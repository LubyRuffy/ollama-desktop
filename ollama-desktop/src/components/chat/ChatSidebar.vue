<script setup lang="ts">
import { computed } from 'vue';
import { useAppStore } from '../../store';
import { Document, Moon, Sunny, ChatDotRound } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const store = useAppStore();
const { t } = useI18n();

// 创建新会话
function createNewChat() {
  store.createNewConversation();
}

// 切换主题
function toggleTheme() {
  if (store.themeMode === 'light') {
    store.themeMode = 'dark';
  } else if (store.themeMode === 'dark') {
    store.themeMode = 'system';
  } else {
    store.themeMode = 'light';
  }
}

// 切换语言
function toggleLanguage() {
  if (store.languageMode === 'en') {
    store.languageMode = 'zh';
  } else if (store.languageMode === 'zh') {
    store.languageMode = 'system';
  } else {
    store.languageMode = 'en';
  }
}

// 获取当前主题图标
const themeIcon = computed(() => {
  if (store.themeMode === 'light' || (store.themeMode === 'system' && !window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    return Sunny;
  } else {
    return Moon;
  }
});

// 获取当前主题文本
const themeText = computed(() => {
  if (store.themeMode === 'light') {
    return t('settings.lightMode');
  } else if (store.themeMode === 'dark') {
    return t('settings.darkMode');
  } else {
    return t('settings.systemMode');
  }
});

// 获取当前语言文本
const languageText = computed(() => {
  if (store.languageMode === 'en') {
    return t('settings.english');
  } else if (store.languageMode === 'zh') {
    return t('settings.chinese');
  } else {
    return t('settings.systemLanguage');
  }
});

// 格式化时间戳为相对时间
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  // 小于1分钟
  if (diff < 60 * 1000) {
    return t('chat.justNow');
  }
  
  // 小于1小时
  if (diff < 60 * 60 * 1000) {
    const minutes = Math.floor(diff / (60 * 1000));
    return t('chat.minutesAgo', { n: minutes });
  }
  
  // 小于24小时
  if (diff < 24 * 60 * 60 * 1000) {
    const hours = Math.floor(diff / (60 * 60 * 1000));
    return t('chat.hoursAgo', { n: hours });
  }
  
  // 小于7天
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    return t('chat.daysAgo', { n: days });
  }
  
  // 大于7天，显示日期
  const date = new Date(timestamp);
  return t('chat.monthDay', { month: date.getMonth() + 1, day: date.getDate() });
}
</script>

<template>
  <div class="sidebar">
    <div class="sidebar-header">
      <h2>{{ t('chat.chatList') }}</h2>
      <button class="new-chat-btn" @click="createNewChat">
        <el-icon><Document /></el-icon>
        {{ t('chat.newChat') }}
      </button>
    </div>
    <div class="conversation-list">
      <div 
        v-for="conversation in store.sortedConversations" 
        :key="conversation.id" 
        class="conversation-item"
        :class="{ 'active': store.currentConversation?.id === conversation.id }"
        @click="store.switchConversation(conversation.id)"
      >
        <div class="conversation-title">{{ conversation.title }}</div>
        <div class="conversation-details">
          <span class="conversation-model">{{ conversation.modelName }}</span>
          <span class="conversation-time">{{ formatRelativeTime(conversation.updatedAt) }}</span>
        </div>
      </div>
    </div>
    
    <!-- 底部设置栏 -->
    <div class="sidebar-footer">
      <div class="settings-container" :class="{ 'show-settings': store.showSettingsPanel }">
        <div class="settings-header">
          <span>{{ t('settings.title') }}</span>
          <button class="close-btn" @click="store.showSettingsPanel = false">×</button>
        </div>
        <div class="settings-item" 
          @click="toggleTheme" 
          :class="{ 'selected': store.themeMode === 'light' || store.themeMode === 'dark' || store.themeMode === 'system' }"
        >
          <el-icon><component :is="themeIcon" /></el-icon>
          <span class="setting-text">{{ themeText }}</span>
        </div>
        <div class="settings-item" 
          @click="toggleLanguage"
          :class="{ 'selected': store.languageMode === 'en' || store.languageMode === 'zh' || store.languageMode === 'system' }"
        >
          <el-icon><ChatDotRound /></el-icon>
          <span class="setting-text">{{ languageText }}</span>
        </div>
      </div>
      <div class="settings-toggle" @click="store.showSettingsPanel = !store.showSettingsPanel">
        <el-icon><component :is="themeIcon" /></el-icon>
        <el-icon><ChatDotRound /></el-icon>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  width: 240px;
  background-color: var(--bg-color, #ffffff);
  border-right: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  height: 100vh;
  position: relative;
  left: 0;
  top: 0;
  z-index: 10;
  flex-shrink: 0;
  overflow-y: auto;
}

.sidebar-header {
  padding: 10px 12px;
  background-color: var(--bg-color, #ffffff);
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h2 {
  font-size: 15px;
  font-weight: 600;
  color: var(--heading-color, #111827);
  margin: 0;
}

.new-chat-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background-color: var(--primary-color, #6366f1);
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.new-chat-btn:hover {
  background-color: var(--primary-hover, #4f46e5);
}

.conversation-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}

.conversation-item {
  padding: 8px 10px;
  border-radius: 6px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 2px;
  background-color: var(--bg-secondary, #f9fafb);
  border: 1px solid transparent;
}

.conversation-item:hover {
  background-color: var(--hover-color, #f3f4f6);
}

.conversation-item.active {
  background-color: var(--bg-color, #ffffff);
  border-color: var(--primary-color, #6366f1);
}

/* 底部设置栏样式 */
.sidebar-footer {
  border-top: 1px solid var(--border-color, #e5e7eb);
  padding: 8px 12px;
  position: relative;
  background-color: var(--bg-color, #ffffff);
  margin-top: auto;
}

.settings-toggle {
  display: flex;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary, #6b7280);
  font-size: 16px;
  cursor: pointer;
  padding: 6px 0;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.settings-toggle:hover {
  background-color: var(--hover-color, #f3f4f6);
}

[data-theme="dark"] .settings-toggle:hover {
  background-color: var(--hover-color-dark, #1f2937);
}

.settings-container {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  background-color: var(--bg-color, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-bottom: none;
  border-radius: 6px 6px 0 0;
  padding: 0;
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease, padding 0.3s ease;
  z-index: 20;
}

.settings-container.show-settings {
  max-height: 150px;
  padding: 0 0 8px 0;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.settings-header span {
  font-size: 15px;
  font-weight: 600;
  color: var(--heading-color, #111827);
}

.close-btn {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
}

.settings-item {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-left: 3px solid transparent;
}

.settings-item:hover {
  background-color: var(--hover-color, #f3f4f6);
}

.settings-item.selected {
  border-left-color: var(--primary-color, #6366f1);
  background-color: var(--hover-color, #f3f4f6);
}

[data-theme="dark"] .settings-item.selected {
  border-left-color: var(--primary-color, #818cf8);
  background-color: var(--hover-color-dark, #1f2937);
}

.settings-item .el-icon {
  margin-right: 8px;
  color: var(--text-secondary, #6b7280);
}

.setting-text {
  font-size: 13px;
  color: var(--text-color, #111827);
}

/* 深色模式下的对话项样式调整 */
[data-theme="dark"] .conversation-item {
  background-color: var(--bg-secondary, #111827);
}

[data-theme="dark"] .conversation-item:hover {
  background-color: var(--hover-color, #374151);
}

[data-theme="dark"] .conversation-item.active {
  background-color: var(--bg-color, #1f2937);
  border-color: var(--primary-color, #818cf8);
}

/* 深色模式下的文本颜色调整 */
[data-theme="dark"] .conversation-title {
  color: #f3f4f6;
}

[data-theme="dark"] .conversation-model,
[data-theme="dark"] .conversation-time {
  color: #9ca3af;
}

[data-theme="dark"] .sidebar-header h2 {
  color: #f9fafb;
}

[data-theme="dark"] .sidebar {
  border-right-color: #374151;
}

[data-theme="dark"] .sidebar-header {
  border-bottom-color: #374151;
}

[data-theme="dark"] .sidebar-footer {
  border-top-color: #374151;
  background-color: var(--bg-color-dark, #111827);
}

[data-theme="dark"] .settings-container {
  background-color: var(--bg-color-dark, #111827);
  border-color: #374151;
}

[data-theme="dark"] .settings-item:hover {
  background-color: var(--hover-color-dark, #1f2937);
}

[data-theme="dark"] .settings-item .el-icon {
  color: #9ca3af;
}

[data-theme="dark"] .setting-text {
  color: #f3f4f6;
}

[data-theme="dark"] .settings-toggle {
  color: #9ca3af;
}

[data-theme="dark"] .settings-header {
  border-bottom-color: #374151;
}

[data-theme="dark"] .settings-header span {
  color: #f9fafb;
}

[data-theme="dark"] .close-btn {
  color: #9ca3af;
}

/* 调整对话列表项的内容样式 */
.conversation-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-color, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.conversation-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1px;
}

.conversation-model {
  font-size: 11px;
  color: var(--text-secondary, #6b7280);
  max-width: 60%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.conversation-time {
  font-size: 11px;
  color: var(--text-secondary, #6b7280);
}
</style> 