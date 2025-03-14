<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { useAppStore } from '../../store';
import { useI18n } from 'vue-i18n';

defineProps<{
  showSettings: boolean;
}>();

const emit = defineEmits(['close']);

const store = useAppStore();
const { t } = useI18n();

// 关闭设置面板
function closeSettings() {
  emit('close');
}

// 更新模型
function updateModel(event: Event) {
  const select = event.target as HTMLSelectElement;
  const selectedModel = select.value;
  
  // Update the current conversation's model
  if (store.currentConversation) {
    store.currentConversation.modelName = selectedModel;
    store.saveConversations();
  }
  
  // Save as the last used model for future conversations
  store.lastUsedModel = selectedModel;
  
  // Also save to localStorage for persistence
  localStorage.setItem('lastUsedModel', selectedModel);
}
</script>

<template>
  <div class="settings-panel" v-if="showSettings">
    <div class="settings-header">
      <h3>{{ t('settings.title') }}</h3>
      <button class="close-settings" @click="closeSettings">×</button>
    </div>
    
    <div class="settings-group">
      <label>{{ t('settings.model') }}</label>
      <select 
        :value="store.currentConversation?.modelName" 
        @change="updateModel($event)"
      >
        <option v-for="model in store.availableModels" :key="model" :value="model">{{ model }}</option>
      </select>
    </div>
    <div class="settings-group">
      <label>{{ t('settings.contextWindow') }} ({{ store.modelParams.num_ctx }})</label>
      <input type="range" v-model.number="store.modelParams.num_ctx" min="512" max="131072" step="512" />
    </div>
    <div class="settings-group">
      <label>{{ t('settings.temperature') }} ({{ store.modelParams.temperature?.toFixed(1) }})</label>
      <input type="range" v-model.number="store.modelParams.temperature" min="0" max="2" step="0.1" />
    </div>
    <div class="settings-group">
      <label>Top P ({{ store.modelParams.top_p?.toFixed(2) }})</label>
      <input type="range" v-model.number="store.modelParams.top_p" min="0.01" max="1" step="0.01" />
    </div>
    <div class="settings-group">
      <label>Top K ({{ store.modelParams.top_k }})</label>
      <input type="range" v-model.number="store.modelParams.top_k" min="1" max="100" step="1" />
    </div>
    <div class="settings-group">
      <label>{{ t('settings.repeatPenalty') }} ({{ store.modelParams.repeat_penalty?.toFixed(2) }})</label>
      <input type="range" v-model.number="store.modelParams.repeat_penalty" min="1" max="2" step="0.01" />
    </div>
  </div>
</template>

<style scoped>
.settings-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 320px;
  height: 100vh;
  background-color: var(--bg-color, #ffffff);
  border-left: 1px solid var(--border-color, #e5e7eb);
  box-shadow: -4px 0 15px rgba(0, 0, 0, 0.05);
  padding: 24px;
  z-index: 50;
  overflow-y: auto;
  color: var(--text-color, #111827);
}

.settings-header {
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.settings-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--heading-color, #111827);
  margin: 0;
}

.close-settings {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.close-settings:hover {
  background-color: var(--hover-color, #f4f4f5);
}

.settings-group {
  margin-bottom: 24px;
}

.settings-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color, #374151);
}

.settings-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-color, #374151);
  background-color: var(--bg-secondary, #f9fafb);
  transition: all 0.2s;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  background-size: 16px;
  padding-right: 40px;
}

.settings-group select:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  background-color: var(--bg-color, #ffffff);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.settings-group select:hover {
  border-color: var(--border-hover, #d1d5db);
  background-color: var(--bg-color, #ffffff);
}

.settings-group textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  font-size: 14px;
  color: var(--text-color, #374151);
  background-color: var(--bg-secondary, #f9fafb);
  transition: all 0.2s;
  min-height: 100px;
  resize: vertical;
  line-height: 1.5;
}

.settings-group textarea:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  background-color: var(--bg-color, #ffffff);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.settings-group input[type="range"] {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  background: var(--border-color, #e5e7eb);
  border-radius: 3px;
  outline: none;
  padding: 0;
  margin: 16px 0;
  position: relative;
}

.settings-group input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color, #6366f1);
  border: 2px solid var(--bg-color, #ffffff);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: -6px;
}

.settings-group input[type="range"]::-moz-range-thumb {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--primary-color, #6366f1);
  border: 2px solid var(--bg-color, #ffffff);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-top: -6px;
}

.settings-group input[type="range"]::-webkit-slider-runnable-track {
  width: 100%;
  height: 6px;
  cursor: pointer;
  background: var(--border-color, #e5e7eb);
  border-radius: 3px;
}

.settings-group input[type="range"]::-moz-range-track {
  width: 100%;
  height: 6px;
  cursor: pointer;
  background: var(--border-color, #e5e7eb);
  border-radius: 3px;
}

.settings-group input[type="range"]::-webkit-slider-thumb:hover {
  background: var(--primary-hover, #4f46e5);
  transform: scale(1.1);
}

.settings-group input[type="range"]::-webkit-slider-thumb:active {
  transform: scale(0.95);
  background: var(--primary-active, #4338ca);
}

.settings-group input[type="range"]:focus::-webkit-slider-thumb {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.settings-group input[type="range"]::-webkit-slider-runnable-track {
  background: linear-gradient(to right, var(--primary-color, #6366f1) var(--range-progress, 0%), var(--border-color, #e5e7eb) var(--range-progress, 0%));
}

/* Dark mode styling */
[data-theme="dark"] .settings-panel {
  background-color: var(--bg-color-dark, #111827);
  border-left-color: var(--border-color-dark, #374151);
  color: var(--text-color-dark, #f3f4f6);
}

[data-theme="dark"] .settings-header {
  border-bottom-color: var(--border-color-dark, #374151);
}

[data-theme="dark"] .settings-header h3 {
  color: var(--heading-color-dark, #f9fafb);
}

[data-theme="dark"] .close-settings {
  color: var(--text-secondary-dark, #9ca3af);
}

[data-theme="dark"] .close-settings:hover {
  background-color: var(--hover-color-dark, #1f2937);
}

[data-theme="dark"] .settings-group label {
  color: var(--text-color-dark, #f3f4f6);
}

[data-theme="dark"] .settings-group select,
[data-theme="dark"] .settings-group textarea {
  background-color: var(--bg-secondary-dark, #1e293b);
  color: var(--text-color-dark, #f3f4f6);
  border-color: var(--border-color-dark, #4b5563);
}

[data-theme="dark"] .settings-group select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23d1d5db'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
}

[data-theme="dark"] .settings-group select:hover,
[data-theme="dark"] .settings-group textarea:hover {
  border-color: var(--border-hover-dark, #6b7280);
}

[data-theme="dark"] .settings-group select:focus,
[data-theme="dark"] .settings-group textarea:focus {
  background-color: var(--bg-color-dark, #0f172a);
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.3);
}

[data-theme="dark"] .settings-group input[type="range"] {
  background: var(--border-color-dark, #4b5563);
}

[data-theme="dark"] .settings-group input[type="range"]::-webkit-slider-runnable-track {
  background: linear-gradient(to right, var(--primary-color, #6366f1) var(--range-progress, 0%), var(--border-color-dark, #4b5563) var(--range-progress, 0%));
}

[data-theme="dark"] .settings-group input[type="range"]::-webkit-slider-thumb {
  border-color: var(--bg-color-dark, #1e293b);
  background-color: var(--primary-color, #6366f1);
}
</style> 