<script setup lang="ts">
import { defineProps, defineEmits, ref, watch } from 'vue';
import { useAppStore } from '../../store';
import { User, Service, CopyDocument, Delete, RefreshRight, ArrowDown, ArrowUp } from '@element-plus/icons-vue';
import MarkdownRenderer from './MarkdownRenderer.vue';
import type { Message } from '../../store';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  isGenerating: boolean;
  isConnected: boolean;
  connectionError: string | null;
}>();

const emit = defineEmits(['regenerate', 'delete', 'copy', 'retry']);

const store = useAppStore();
const { t } = useI18n();
const isSystemPromptExpanded = ref(false);
const systemPromptValue = ref('');

// Initialize system prompt value
watch(() => store.currentConversation, (conversation) => {
  if (conversation) {
    systemPromptValue.value = conversation.systemPrompt;
  }
}, { immediate: true });

// Update system prompt when it changes
watch(systemPromptValue, (newValue) => {
  if (store.currentConversation) {
    store.currentConversation.systemPrompt = newValue;
    store.systemPrompt = newValue;
    store.saveConversations();
  }
});

// Toggle system prompt expansion
function toggleSystemPrompt() {
  isSystemPromptExpanded.value = !isSystemPromptExpanded.value;
}

// 复制消息内容
function copyMessage(content: string) {
  emit('copy', content);
}

// 删除消息
function deleteMessage(index: number) {
  emit('delete', index);
}

// 重新生成消息
function regenerateMessage(index: number) {
  emit('regenerate', index);
}

// Add retry connection function
function retryConnection() {
  emit('retry');
}
</script>

<template>
  <div class="message-list" v-if="store.currentConversation">
    <!-- System Prompt Section -->
    <div class="system-prompt-container">
      <div class="system-prompt-header" @click="toggleSystemPrompt">
        <span>{{ t('settings.systemPrompt') }}</span>
        <el-icon>
          <ArrowDown v-if="!isSystemPromptExpanded" />
          <ArrowUp v-else />
        </el-icon>
      </div>
      <div class="system-prompt-content" v-if="isSystemPromptExpanded">
        <textarea 
          v-model="systemPromptValue"
          :placeholder="t('settings.systemPromptPlaceholder')"
          class="system-prompt-textarea"
        ></textarea>
      </div>
    </div>
    
    <div 
      v-for="(message, index) in store.currentConversation.messages" 
      :key="index"
      class="message-container"
      :class="message.role"
    >
      <!-- 头像放到外面 -->
      <div class="message-avatar">
        <el-icon>
          <User v-if="message.role === 'user'" />
          <Service v-else />
        </el-icon>
      </div>
      
      <div class="message-content-wrapper">
        <!-- 消息内容 -->
        <div class="message">
          <!-- 显示用户上传的图片 -->
          <div v-if="message.images && message.images.length > 0" class="message-images">
            <img 
              v-for="(image, imgIndex) in message.images" 
              :key="imgIndex" 
              :src="`data:image/jpeg;base64,${image}`" 
              class="message-image" 
            />
          </div>
          
          <!-- 渲染消息内容 -->
          <MarkdownRenderer :content="message.content" />
          
          <!-- 显示生成中指示器，放在内容下方 -->
          <div v-if="isGenerating && index === store.currentConversation.messages.length - 1 && message.role === 'assistant'" class="typing-indicator">
            <div class="typing-cursor"></div>
          </div>
        </div>
        
        <!-- 消息操作按钮 -->
        <div class="message-actions-container">
          <div class="message-actions">
            <button class="action-btn" @click="copyMessage(message.content)" title="复制">
              <el-icon><CopyDocument /></el-icon>
            </button>
            <button class="action-btn" @click="deleteMessage(index)" title="删除">
              <el-icon><Delete /></el-icon>
            </button>
            <button 
              v-if="message.role === 'assistant' && index === store.currentConversation.messages.length - 1"
              class="action-btn" 
              @click="regenerateMessage(index)"
              :disabled="isGenerating"
              title="重新回答"
            >
              <el-icon><RefreshRight /></el-icon>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- 连接状态提示 -->
  <div class="connection-status" v-if="!isConnected">
    <p>⚠️ {{ t('errors.connectionFailed') }}</p>
    <p class="error-details">{{ t('chat.connectionFailedDesc') }}</p>
    <p class="error-details" v-if="connectionError">{{ connectionError }}</p>
    <button class="retry-button" @click="retryConnection">{{ t('chat.retry') }}</button>
  </div>
</template>

<style scoped>
.message-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background-color: var(--bg-secondary, #f8fafc);
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: auto;
}

.message-container {
  display: flex;
  width: 100%;
  margin-bottom: 16px;
  position: relative;
  align-items: flex-start;
}

.message-container.user {
  flex-direction: row-reverse;
}

.message-content-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 80%;
  width: auto;
  min-width: 0;
}

.message-container.user .message-content-wrapper {
  align-items: flex-end;
}

.message-container.assistant .message-content-wrapper {
  align-items: flex-start;
}

.message {
  width: 100%;
  background-color: var(--bg-color, #ffffff);
  padding: 12px;
  border-radius: 10px;
  box-shadow: 0 1px 2px var(--shadow-color, rgba(0, 0, 0, 0.1));
  border: 1px solid var(--border-color, #e5e7eb);
  position: relative;
  overflow: visible;
  word-wrap: break-word;
  max-width: 100%;
  box-sizing: border-box;
  color: var(--text-color, #374151);
}

.message-container.user .message {
  background-color: var(--chat-user-bg, #eff6ff);
  border-color: var(--border-color, #bfdbfe);
  color: var(--text-color, #374151);
}

.message-container.assistant .message {
  background-color: var(--chat-assistant-bg, #f0f9ff);
  border-color: var(--border-color, #e5e7eb);
  color: var(--text-color, #374151);
}

/* 深色模式下的消息样式 */
[data-theme="dark"] .message {
  border-color: #374151;
}

[data-theme="dark"] .user-message {
  background-color: var(--chat-user-bg, #1f2937);
}

[data-theme="dark"] .assistant-message {
  background-color: var(--chat-assistant-bg, #312e81);
}

[data-theme="dark"] .message-content p,
[data-theme="dark"] .message-content span,
[data-theme="dark"] .message-content li,
[data-theme="dark"] .message-content h1,
[data-theme="dark"] .message-content h2,
[data-theme="dark"] .message-content h3,
[data-theme="dark"] .message-content h4,
[data-theme="dark"] .message-content h5,
[data-theme="dark"] .message-content h6 {
  color: var(--text-color, #f8f8f2) !important;
}

/* 深色模式下的代码块样式 */
[data-theme="dark"] .message-content pre {
  background-color: var(--hljs-background, #1e1e2e) !important;
  border-color: var(--code-border, #2d3748);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
}

[data-theme="dark"] .message-content code {
  color: #f8f8f2 !important;
  background-color: #2d3748 !important;
}

/* 深色模式下的消息头部样式 */
[data-theme="dark"] .message-header {
  color: #e2e8f0;
  border-bottom-color: #4b5563;
}

[data-theme="dark"] .user-icon,
[data-theme="dark"] .assistant-icon {
  background-color: #2d3748;
  border-color: #4b5563;
  color: #f8f8f2;
}

/* 深色模式下的消息操作按钮 */
[data-theme="dark"] .message-actions button {
  color: #a78bfa;
  background-color: transparent;
}

[data-theme="dark"] .message-actions button:hover {
  background-color: #374151;
  color: #f8f8f2;
}

/* 深色模式下的滚动条 */
[data-theme="dark"] .messages-container::-webkit-scrollbar-thumb {
  background-color: var(--scrollbar-thumb, #4b5563);
}

[data-theme="dark"] .messages-container::-webkit-scrollbar-thumb:hover {
  background-color: var(--scrollbar-thumb-hover, #6b7280);
}

/* 深色模式下的加载动画 */
[data-theme="dark"] .loading-indicator {
  background-color: rgba(17, 24, 39, 0.7);
}

[data-theme="dark"] .loading-spinner {
  border-color: #8b5cf6 transparent #8b5cf6 transparent;
}

.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.message-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 6px;
  object-fit: contain;
}

/* 修改打字光标效果 */
.typing-indicator {
  margin-top: 8px;
  display: flex;
  align-items: center;
}

.typing-cursor {
  display: inline-block;
  width: 3px;
  height: 16px;
  background-color: var(--primary-color, #6366f1);
  margin-right: 2px;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}

/* 修改消息头像样式 */
.message-avatar {
  width: 24px !important;
  height: 24px !important;
  border-radius: 5px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 14px !important;
  flex-shrink: 0 !important;
  margin-top: 4px !important;
  color: #ffffff !important; /* 确保图标颜色始终为白色 */
}

.message-container.assistant .message-avatar {
  background-color: var(--primary-color, #6366f1) !important;
  color: #ffffff !important;
  margin-right: 10px !important;
}

.message-container.user .message-avatar {
  background-color: var(--primary-hover, #3b82f6) !important;
  color: #ffffff !important;
  margin-left: 10px !important;
}

/* 深色模式下增强头像的可见性 */
[data-theme="dark"] .message-avatar {
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
}

/* 修复消息操作按钮样式 */
.message-actions-container {
  margin-top: 3px;
  display: flex;
  justify-content: flex-start;
  width: 100%;
}

.message-container.user .message-actions-container {
  justify-content: flex-end;
}

.message-actions {
  display: flex;
  gap: 3px;
  opacity: 0;
  transition: opacity 0.2s;
  background-color: var(--bg-color, rgba(255, 255, 255, 0.9));
  padding: 3px;
  border-radius: 5px;
  box-shadow: 0 1px 3px var(--shadow-color, rgba(0, 0, 0, 0.1));
}

.message-container:hover .message-actions {
  opacity: 1;
}

.message-container.user .message-actions {
  justify-content: flex-start;
}

.message-container.assistant .message-actions {
  justify-content: flex-end;
}

/* 优化按钮样式 */
.action-btn {
  padding: 4px;
  background-color: var(--bg-secondary, #f3f4f6);
  border: none;
  border-radius: 4px;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  font-size: 13px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background-color: var(--hover-color, #e5e7eb);
  color: var(--text-color, #374151);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.connection-status {
  padding: 16px;
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  margin: 24px;
  text-align: center;
  color: #b91c1c;
  font-weight: 500;
}

.error-details {
  font-size: 14px;
  margin-top: 8px;
  color: #b91c1c;
  font-weight: normal;
}

.retry-button {
  margin-top: 10px;
  padding: 6px 12px;
  background-color: #b91c1c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.retry-button:hover {
  background-color: #991b1b;
}

/* 深色模式下的连接状态提示 */
[data-theme="dark"] .connection-status {
  background-color: #7f1d1d;
  border-color: #b91c1c;
  color: #fecaca;
}

[data-theme="dark"] .error-details {
  color: #fca5a5;
}

[data-theme="dark"] .retry-button {
  background-color: #b91c1c;
  color: #fecaca;
}

[data-theme="dark"] .retry-button:hover {
  background-color: #ef4444;
}

/* System Prompt Styles */
.system-prompt-container {
  margin: 0 16px 16px;
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  background-color: var(--bg-color, #ffffff);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.system-prompt-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 16px;
  background-color: var(--bg-secondary, #f8fafc);
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  color: var(--text-secondary, #6b7280);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  transition: background-color 0.2s;
}

.system-prompt-header:hover {
  background-color: var(--hover-color, #f4f4f5);
}

.system-prompt-content {
  padding: 8px;
}

.system-prompt-textarea {
  width: 100%;
  min-height: 60px;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
  background-color: var(--bg-secondary, #f9fafb);
  color: var(--text-color, #374151);
  transition: border-color 0.2s, box-shadow 0.2s;
  font-family: inherit;
}

.system-prompt-textarea:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Dark mode styles for system prompt */
[data-theme="dark"] .system-prompt-container {
  border-color: #374151;
  background-color: #1f2937;
}

[data-theme="dark"] .system-prompt-header {
  background-color: #111827;
  color: #e5e7eb;
  border-bottom-color: #374151;
}

[data-theme="dark"] .system-prompt-textarea {
  background-color: #111827;
  color: #e5e7eb;
  border-color: #374151;
}

[data-theme="dark"] .system-prompt-textarea:focus {
  border-color: #818cf8;
  box-shadow: 0 0 0 3px rgba(129, 140, 248, 0.2);
}
</style> 