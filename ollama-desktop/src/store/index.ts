import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Ref } from 'vue';
import { getSystemLocale } from '../locales';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  images?: string[];
  timestamp: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  modelName: string;
  systemPrompt: string;
  createdAt: number;
  updatedAt: number;
}

export interface ModelParams {
  num_ctx?: number;
  temperature?: number;
  top_p?: number;
  top_k?: number;
  repeat_penalty?: number;
}

// Theme type definition
export type ThemeMode = 'light' | 'dark' | 'system';

// Language type definition
export type LanguageMode = 'en' | 'zh' | 'system';

export const useAppStore = defineStore('app', () => {
  // 当前会话
  const currentConversation: Ref<Conversation | null> = ref(null);
  
  // 所有会话列表
  const conversations: Ref<Conversation[]> = ref([]);
  
  // 可用模型列表
  const availableModels: Ref<string[]> = ref([]);
  
  // 当前选择的模型
  const currentModel = ref('');
  
  // 上次使用的模型（用于新建对话时自动选择）
  const lastUsedModel = ref('');
  
  // 系统提示词
  const systemPrompt = ref('');
  
  // 模型参数
  const modelParams: Ref<ModelParams> = ref({
    num_ctx: 4096,
    temperature: 0.7,
    top_p: 0.9,
    top_k: 40,
    repeat_penalty: 1.1
  });
  
  // 是否正在加载
  const isLoading = ref(false);
  
  // 主题设置
  const themeMode: Ref<ThemeMode> = ref('system');
  
  // 当前应用的主题
  const currentTheme = computed(() => {
    if (themeMode.value === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeMode.value;
  });
  
  // 语言设置
  const languageMode: Ref<LanguageMode> = ref('system');
  
  // 设置面板显示状态
  const showSettingsPanel = ref(false);
  
  // 当前应用的语言
  const currentLanguage = computed(() => {
    if (languageMode.value === 'system') {
      return getSystemLocale();
    }
    return languageMode.value;
  });
  
  // 按更新时间排序的会话列表（最新的在前面）
  const sortedConversations = computed(() => {
    return [...conversations.value].sort((a, b) => b.updatedAt - a.updatedAt);
  });
  
  // 创建新会话
  function createNewConversation(modelName?: string) {
    // Get the default title based on current language
    let defaultTitle = '新对话';
    if (currentLanguage.value === 'en') {
      defaultTitle = 'New Chat';
    }
    
    // Use the provided model name, or the last used model, or the current model
    const selectedModel = modelName || lastUsedModel.value || currentModel.value;
    
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: defaultTitle,
      messages: [],
      modelName: selectedModel,
      systemPrompt: systemPrompt.value || (currentLanguage.value === 'zh' 
        ? '你是一个有用的AI助手。请提供准确、有帮助的回答。' 
        : 'You are a helpful AI assistant. Please provide accurate and helpful responses.'),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    conversations.value.unshift(newConversation);
    currentConversation.value = newConversation;
    saveConversations();
    return newConversation;
  }
  
  // 添加消息到当前会话
  function addMessage(message: Omit<Message, 'timestamp'>) {
    if (!currentConversation.value) {
      createNewConversation();
    }
    
    const newMessage: Message = {
      ...message,
      timestamp: Date.now()
    };
    
    currentConversation.value!.messages.push(newMessage);
    currentConversation.value!.updatedAt = Date.now();
    saveConversations();
    return newMessage;
  }
  
  // 更新消息内容
  function updateMessageContent(conversationId: string, messageIndex: number, content: string) {
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (conversation && conversation.messages[messageIndex]) {
      conversation.messages[messageIndex].content = content;
      conversation.updatedAt = Date.now();
      saveConversations();
    }
  }
  
  // 保存会话到本地存储
  function saveConversations() {
    // Force reactivity by creating a new array
    conversations.value = [...conversations.value];
    localStorage.setItem('conversations', JSON.stringify(conversations.value));
  }
  
  // 从本地存储加载会话
  function loadConversations() {
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      conversations.value = JSON.parse(savedConversations);
    }
  }
  
  // 切换到指定会话
  function switchConversation(conversationId: string) {
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (conversation) {
      currentConversation.value = conversation;
    }
  }
  
  // 删除会话
  function deleteConversation(conversationId: string) {
    console.log('Store: deleteConversation called with ID:', conversationId);
    
    const index = conversations.value.findIndex(c => c.id === conversationId);
    console.log('Store: conversation index:', index);
    
    if (index !== -1) {
      console.log('Store: removing conversation from array');
      conversations.value.splice(index, 1);
      
      if (currentConversation.value?.id === conversationId) {
        console.log('Store: current conversation was deleted');
        // 选择最新的会话（如果有）
        if (conversations.value.length > 0) {
          console.log('Store: selecting new conversation');
          const sorted = [...conversations.value].sort((a, b) => b.updatedAt - a.updatedAt);
          currentConversation.value = sorted[0];
          console.log('Store: new current conversation:', currentConversation.value);
        } else {
          console.log('Store: no conversations left, setting current to null');
          currentConversation.value = null;
        }
      }
      
      console.log('Store: saving conversations');
      saveConversations();
    } else {
      console.log('Store: conversation not found');
    }
  }
  
  // 更新会话标题
  function updateConversationTitle(conversationId: string, title: string) {
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (conversation) {
      conversation.title = title;
      conversation.updatedAt = Date.now();
      saveConversations();
    }
  }
  
  // 设置主题模式
  function setThemeMode(mode: ThemeMode) {
    themeMode.value = mode;
    localStorage.setItem('themeMode', mode);
    applyTheme();
  }
  
  // 应用主题到文档
  function applyTheme() {
    const theme = currentTheme.value;
    document.documentElement.setAttribute('data-theme', theme);
    
    // 如果是暗色模式，添加dark类到body
    if (theme === 'dark') {
      document.body.classList.add('dark');
      document.documentElement.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.documentElement.classList.remove('dark');
    }
    
    // 更新Element Plus主题变量
    document.documentElement.style.setProperty('--el-color-primary', theme === 'dark' ? '#818cf8' : '#6366f1');
  }
  
  // 设置语言模式
  function setLanguageMode(mode: LanguageMode) {
    languageMode.value = mode;
    localStorage.setItem('languageMode', mode);
    
    // Update the current language immediately
    const newLanguage = mode === 'system' ? getSystemLocale() : mode;
    
    // Update the document language attribute
    document.documentElement.setAttribute('lang', newLanguage);
    
    // Try to update i18n locale directly if it's available in the global context
    try {
      const i18nInstance = (window as any).__VUE_I18N_INSTANCE__;
      if (i18nInstance) {
        i18nInstance.global.locale.value = newLanguage as 'en' | 'zh';
      }
      
      // Also update ElementPlus locale if needed
      const elementLocale = (window as any).__ELEMENT_PLUS_LOCALE__;
      if (elementLocale) {
        // Get the new locale
        if (newLanguage === 'zh') {
          import('element-plus/dist/locale/zh-cn.mjs').then(module => {
            (window as any).__ELEMENT_PLUS_LOCALE__ = module.default;
          });
        } else {
          import('element-plus/dist/locale/en.mjs').then(module => {
            (window as any).__ELEMENT_PLUS_LOCALE__ = module.default;
          });
        }
      }
    } catch (error) {
      console.error('Failed to update i18n locale directly:', error);
    }
  }
  
  // 初始化语言
  function initLanguage() {
    const savedLanguage = localStorage.getItem('languageMode') as LanguageMode | null;
    if (savedLanguage) {
      languageMode.value = savedLanguage;
    }
  }
  
  // 初始化主题
  function initTheme() {
    const savedTheme = localStorage.getItem('themeMode') as ThemeMode | null;
    if (savedTheme) {
      themeMode.value = savedTheme;
    }
    applyTheme();
    
    // 监听系统主题变化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', () => {
        if (themeMode.value === 'system') {
          applyTheme();
        }
      });
    }
  }
  
  // 监听主题变化
  watch(themeMode, () => {
    applyTheme();
  });
  
  // 初始化应用
  function initApp() {
    // 初始化主题
    initTheme();
    
    // 初始化语言
    initLanguage();
    
    // 加载上次使用的模型
    const savedModel = localStorage.getItem('lastUsedModel');
    if (savedModel) {
      lastUsedModel.value = savedModel;
    }
    
    // 加载系统提示词
    const savedSystemPrompt = localStorage.getItem('systemPrompt');
    if (savedSystemPrompt) {
      systemPrompt.value = savedSystemPrompt;
    } else {
      // 设置默认系统提示词
      const defaultPrompt = currentLanguage.value === 'zh' 
        ? '你是一个有用的AI助手。请提供准确、有帮助的回答。' 
        : 'You are a helpful AI assistant. Please provide accurate and helpful responses.';
      systemPrompt.value = defaultPrompt;
      localStorage.setItem('systemPrompt', defaultPrompt);
    }
  }
  
  // 监听系统提示词变化
  watch(systemPrompt, (newPrompt) => {
    localStorage.setItem('systemPrompt', newPrompt);
  });
  
  return {
    currentConversation,
    conversations,
    sortedConversations,
    availableModels,
    currentModel,
    lastUsedModel,
    systemPrompt,
    modelParams,
    isLoading,
    themeMode,
    currentTheme,
    languageMode,
    currentLanguage,
    showSettingsPanel,
    createNewConversation,
    addMessage,
    updateMessageContent,
    saveConversations,
    loadConversations,
    switchConversation,
    deleteConversation,
    updateConversationTitle,
    setThemeMode,
    applyTheme,
    initTheme,
    setLanguageMode,
    initLanguage,
    initApp
  };
});