<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { useAppStore } from '../../store';
import { getModels, generateChatStream, checkOllamaService } from '../../api/ollama';
import { Setting, Delete, Expand, Service } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

// 导入子组件
import ChatSidebar from './ChatSidebar.vue';
import ChatSettings from './ChatSettings.vue';
import ChatInput from './ChatInput.vue';
import ChatMessages from './ChatMessages.vue';

const store = useAppStore();
const { t } = useI18n();
const isConnected = ref(false);
const showSettings = ref(false);
const showSidebar = ref(true);
const isGenerating = ref(false);
const connectionError = ref<string | null>(null);

// 检查ollama服务连接状态
onMounted(async () => {
  try {
    const result = await checkOllamaService();
    isConnected.value = result.success;
    if (result.success) {
      // 加载模型列表
      const models = await getModels();
      store.availableModels = models;
      if (models.length > 0) {
        // Use the last used model if available and exists in the available models
        if (store.lastUsedModel && models.includes(store.lastUsedModel)) {
          store.currentModel = store.lastUsedModel;
        } else {
          store.currentModel = models[0];
        }
      }
      
      // 加载保存的对话
      store.loadConversations();
      connectionError.value = null;
    } else {
      // 存储错误信息
      connectionError.value = result.error || 'Failed to connect to Ollama service';
    }
  } catch (error) {
    console.error(t('errors.initFailed'), error);
    isConnected.value = false;
    
    // 存储错误信息
    if (error instanceof Error) {
      connectionError.value = error.message;
    } else if (typeof error === 'string') {
      connectionError.value = error;
    } else if (error && typeof error === 'object') {
      connectionError.value = JSON.stringify(error);
    } else {
      connectionError.value = 'Unknown error occurred';
    }
  }
});

// 发送消息
async function sendMessage(messageData: { content: string, images?: string[] }) {
  if (isGenerating.value) return; // 防止重复发送
  
  // 确保有当前会话
  if (!store.currentConversation) {
    store.createNewConversation();
  }
  
  // 添加用户消息
  store.addMessage({
    role: 'user',
    content: messageData.content,
    images: messageData.images
  });
  
  try {
    isGenerating.value = true;
    
    // 准备上下文
    const messages = [...store.currentConversation!.messages];
    
    // 如果有系统提示词，添加到消息列表开头
    if (store.currentConversation?.systemPrompt) {
      messages.unshift({
        role: 'system',
        content: store.currentConversation.systemPrompt,
        timestamp: Date.now()
      });
    }
    
    // 添加一个空的助手消息，用于流式更新
    const assistantMessage = store.addMessage({
      role: 'assistant',
      content: ''
    });
    
    // 获取当前会话的模型名称
    const modelName = store.currentConversation!.modelName || store.currentModel;
    
    // 流式生成回复
    await generateChatStream({
      model: modelName,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        images: m.images
      })),
      stream: true,
      options: store.modelParams,
      onUpdate: (content) => {
        // 更新助手消息内容
        if (store.currentConversation) {
          const index = store.currentConversation.messages.findIndex(m => m === assistantMessage);
          if (index !== -1) {
            store.currentConversation.messages[index].content = content;
          }
        }
      }
    });
    
    // 保存会话
    store.saveConversations();
    
    // 如果是第一条消息，使用AI生成标题
    if (store.currentConversation!.messages.length === 2 && store.currentConversation!.title === t('chat.newChat')) {
      generateTitle();
    }
  } catch (error) {
    console.error(t('errors.messageSendFailed'), error);
    // 显示错误消息
    if (store.currentConversation) {
      let errorMessage = `**${t('errors.messageSendFailed')}**`;
      
      // 添加详细错误信息
      if (error instanceof Error) {
        errorMessage += `: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage += `: ${error}`;
      } else if (error && typeof error === 'object') {
        errorMessage += `: ${JSON.stringify(error)}`;
      }
      
      store.addMessage({
        role: 'assistant',
        content: errorMessage
      });
    }
  } finally {
    isGenerating.value = false;
  }
}

// 使用AI生成对话标题
async function generateTitle() {
  if (!store.currentConversation) return;
  
  try {
    const userMessage = store.currentConversation.messages[0].content;
    
    // Create a language-appropriate system prompt
    let systemPrompt = '你是一个助手，请根据用户的第一条消息生成一个简短的对话标题（不超过20个字符）。直接返回标题，不要有任何前缀或解释。';
    if (store.currentLanguage === 'en') {
      systemPrompt = 'You are an assistant. Please generate a short title (no more than 20 characters) based on the user\'s first message. Return only the title without any prefix or explanation.';
    }
    
    // 使用当前模型生成标题
    const response = await generateChatStream({
      model: store.currentConversation.modelName || store.currentModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      stream: false,
      options: {
        temperature: 0.7
      }
    });
    
    // 清理标题（去除引号和多余空格）
    let title = response.trim();
    title = title.replace(/^["']|["']$/g, '').trim();
    
    // 如果标题太长，截断
    if (title.length > 20) {
      title = title.substring(0, 20) + '...';
    }
    
    // 更新标题
    if (title && store.currentConversation) {
      store.updateConversationTitle(store.currentConversation.id, title);
    }
  } catch (error) {
    console.error(t('errors.titleGenerationFailed'), error);
    // 失败时使用默认标题
    if (store.currentConversation) {
      const defaultTitle = store.currentConversation.messages[0].content.substring(0, 20);
      store.updateConversationTitle(store.currentConversation.id, defaultTitle + '...');
    }
  }
}

// 重新生成消息
async function regenerateMessage(index: number) {
  if (!store.currentConversation || isGenerating.value) return;
  
  // 找到最后一条助手消息
  const messages = store.currentConversation.messages;
  if (index < 0 || index >= messages.length || messages[index].role !== 'assistant') return;
  
  // 删除该消息之后的所有消息
  store.currentConversation.messages = messages.slice(0, index);
  
  // 重新发送最后一条用户消息
  const lastUserMessage = messages.slice(0, index).reverse().find(m => m.role === 'user');
  if (lastUserMessage) {
    await sendMessage({
      content: lastUserMessage.content,
      images: lastUserMessage.images
    });
  }
}

// 删除消息
function deleteMessage(index: number) {
  if (!store.currentConversation) return;
  
  // 删除消息
  store.currentConversation.messages.splice(index, 1);
  store.saveConversations();
}

// 复制消息内容
function copyMessage(content: string) {
  navigator.clipboard.writeText(content).then(() => {
    // 可以添加复制成功的提示
    console.log(t('chat.copied'));
  });
}

// 重试连接
async function retryConnection() {
  try {
    const result = await checkOllamaService();
    isConnected.value = result.success;
    if (result.success) {
      // 加载模型列表
      const models = await getModels();
      store.availableModels = models;
      if (models.length > 0) {
        // Use the last used model if available and exists in the available models
        if (store.lastUsedModel && models.includes(store.lastUsedModel)) {
          store.currentModel = store.lastUsedModel;
        } else {
          store.currentModel = models[0];
        }
      }
      
      // 加载保存的对话
      store.loadConversations();
      connectionError.value = null;
    } else {
      // 存储错误信息
      connectionError.value = result.error || 'Failed to connect to Ollama service';
    }
  } catch (error) {
    console.error(t('errors.connectionFailed'), error);
    isConnected.value = false;
    
    // 存储错误信息
    if (error instanceof Error) {
      connectionError.value = error.message;
    } else if (typeof error === 'string') {
      connectionError.value = error;
    } else if (error && typeof error === 'object') {
      connectionError.value = JSON.stringify(error);
    } else {
      connectionError.value = 'Unknown error occurred';
    }
  }
}

// 切换设置面板
function toggleSettings() {
  showSettings.value = !showSettings.value;
}

// 切换侧边栏
function toggleSidebar() {
  showSidebar.value = !showSidebar.value;
}

// 删除当前会话
function deleteCurrentConversation() {
  if (store.currentConversation) {
    if (confirm(t('chat.confirmDelete'))) {
      store.deleteConversation(store.currentConversation.id);
    }
  }
}
</script>

<template>
  <div class="chat-container">
    <!-- 侧边栏 -->
    <ChatSidebar v-if="showSidebar" />
    
    <!-- 主聊天区域 -->
    <div class="main-content">
      <!-- 顶部导航栏 -->
      <div class="chat-header">
        <button class="sidebar-toggle" @click="toggleSidebar">
          <span></span>
          <span></span>
          <span></span>
        </button>
        
        <div class="chat-title">
          {{ store.currentConversation?.title || t('chat.newChat') }}
        </div>
        
        <div class="header-actions">
          <button class="header-action" @click="deleteCurrentConversation" v-if="store.currentConversation">
            <el-icon><Delete /></el-icon>
          </button>
          <button class="header-action" @click="toggleSettings">
            <el-icon><Setting /></el-icon>
          </button>
        </div>
      </div>
      
      <!-- 消息列表 -->
      <ChatMessages 
        :is-generating="isGenerating"
        :is-connected="isConnected"
        :connection-error="connectionError"
        @regenerate="regenerateMessage"
        @delete="deleteMessage"
        @copy="copyMessage"
        @retry="retryConnection"
      />
      
      <!-- 输入框 -->
      <ChatInput 
        :is-generating="isGenerating"
        :is-connected="isConnected"
        @send="sendMessage"
      />
    </div>
    
    <!-- 设置面板 -->
    <ChatSettings 
      :show-settings="showSettings"
      @close="showSettings = false"
    />
  </div>
</template>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  overflow: hidden;
  width: 100%;
}

.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--bg-color, #ffffff);
  height: 100%;
  position: relative;
  min-height: 0;
}

.chat-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  background-color: var(--bg-color, #ffffff);
}

.sidebar-toggle {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 24px;
  height: 18px;
  background: none;
  border: none;
  cursor: pointer;
  margin-right: 16px;
  padding: 0;
}

.sidebar-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  background-color: var(--text-color, #111827);
  transition: all 0.3s;
}

.chat-title {
  flex: 1;
  font-size: 16px;
  font-weight: 600;
  color: var(--heading-color, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.header-action {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: all 0.2s;
}

.header-action:hover {
  background-color: var(--hover-color, #f4f4f5);
  color: var(--text-color, #111827);
}

/* 深色模式调整 */
[data-theme="dark"] .main-content {
  background-color: var(--bg-color-dark, #111827);
}

[data-theme="dark"] .chat-header {
  background-color: var(--bg-color-dark, #111827);
  border-bottom-color: var(--border-color-dark, #1f2937);
}

[data-theme="dark"] .sidebar-toggle span {
  background-color: var(--text-color-dark, #f3f4f6);
}

[data-theme="dark"] .chat-title {
  color: var(--heading-color-dark, #f9fafb);
}

[data-theme="dark"] .header-action {
  color: var(--text-secondary-dark, #9ca3af);
}

[data-theme="dark"] .header-action:hover {
  background-color: var(--hover-color-dark, #1f2937);
  color: var(--text-color-dark, #f3f4f6);
}

/* Add this to ensure ChatMessages takes up available space */
:deep(.message-list) {
  flex: 1 !important;
  overflow-y: auto !important;
  display: flex !important;
  flex-direction: column !important;
  min-height: 0 !important; /* This is crucial for flex containers */
  width: 100% !important;
}
</style> 