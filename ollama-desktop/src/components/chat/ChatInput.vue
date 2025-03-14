<script setup lang="ts">
import { ref, defineEmits } from 'vue';
import { Picture, ChatRound } from '@element-plus/icons-vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const emit = defineEmits(['send']);

const userInput = ref('');
const selectedImages = ref<string[]>([]);
const fileInput = ref<HTMLInputElement | null>(null);

// 发送消息
function sendMessage() {
  if (!userInput.value.trim() && selectedImages.value.length === 0) return;
  
  emit('send', {
    content: userInput.value,
    images: selectedImages.value.length > 0 ? [...selectedImages.value] : undefined
  });
  
  // 清空输入和已选图片
  userInput.value = '';
  selectedImages.value = [];
}

// 处理图片选择
function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  
  for (let i = 0; i < input.files.length; i++) {
    const file = input.files[i];
    if (!file.type.startsWith('image/')) continue;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target && typeof e.target.result === 'string') {
        // 确保只获取 base64 数据部分，去掉 data:image/xxx;base64, 前缀
        const base64Data = e.target.result.split(',')[1];
        if (base64Data) {
          selectedImages.value.push(base64Data);
        }
      }
    };
    reader.readAsDataURL(file);
  }
}

// 移除已选图片
function removeImage(index: number) {
  selectedImages.value.splice(index, 1);
}

// 触发文件选择
function triggerFileInput() {
  if (fileInput.value) {
    fileInput.value.click();
  }
}

// 处理键盘事件
function handleKeyDown(event: KeyboardEvent) {
  // 如果按下 Ctrl+Enter 或 Command+Enter，发送消息
  if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    sendMessage();
  }
}

defineProps<{
  isGenerating: boolean;
  isConnected: boolean;
}>();
</script>

<template>
  <div class="chat-input-container">
    <!-- 已选图片预览 -->
    <div class="selected-images" v-if="selectedImages.length > 0">
      <div 
        v-for="(image, index) in selectedImages" 
        :key="index"
        class="image-preview"
      >
        <img :src="`data:image/jpeg;base64,${image}`" alt="Selected image" />
        <button class="remove-image-btn" @click="removeImage(index)">×</button>
      </div>
    </div>
    
    <div class="input-wrapper">
      <textarea 
        v-model="userInput" 
        :placeholder="t('chat.inputPlaceholder')"
        @keydown="handleKeyDown"
        class="message-input"
      ></textarea>
      
      <div class="input-actions">
        <button 
          class="action-btn upload-btn" 
          @click="triggerFileInput"
          :title="t('chat.uploadImage')"
        >
          <el-icon><Picture /></el-icon>
        </button>
        
        <button 
          class="action-btn send-btn" 
          @click="sendMessage"
          :disabled="!userInput.trim() && selectedImages.length === 0"
          :title="t('chat.send')"
        >
          <el-icon><ChatRound /></el-icon>
        </button>
      </div>
      
      <input 
        type="file" 
        ref="fileInput" 
        @change="handleFileSelect" 
        accept="image/*" 
        multiple 
        class="file-input"
      />
    </div>
  </div>
</template>

<style scoped>
.chat-input-container {
  padding: 16px;
  border-top: 1px solid var(--border-color, #e5e7eb);
  background-color: var(--bg-color, #ffffff);
  position: sticky;
  bottom: 0;
  width: 100%;
  flex-shrink: 0;
  z-index: 10;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: flex-end;
}

.message-input {
  flex: 1;
  min-height: 60px;
  max-height: 200px;
  padding: 12px 60px 12px 16px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
  background-color: var(--bg-secondary, #f9fafb);
  color: var(--text-color, #111827);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.input-actions {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background-color: transparent;
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
}

.action-btn:hover {
  background-color: var(--hover-color, #f4f4f5);
  color: var(--primary-color, #6366f1);
}

.send-btn {
  background-color: var(--primary-color, #6366f1);
  color: white;
}

.send-btn:hover {
  background-color: var(--primary-hover, #4f46e5);
  color: white;
}

.send-btn:disabled {
  background-color: var(--border-color, #e5e7eb);
  color: var(--text-secondary, #6b7280);
  cursor: not-allowed;
}

.file-input {
  display: none;
}

.selected-images {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.image-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color, #e5e7eb);
}

.image-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-image-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.remove-image-btn:hover {
  background-color: rgba(0, 0, 0, 0.7);
}

/* 深色模式调整 */
[data-theme="dark"] .chat-input-container {
  border-top-color: var(--border-color-dark, #1f2937);
  background-color: var(--bg-color-dark, #111827);
}

[data-theme="dark"] .message-input {
  background-color: var(--bg-secondary-dark, #1f2937);
  border-color: var(--border-color-dark, #374151);
  color: var(--text-color-dark, #f3f4f6);
}

[data-theme="dark"] .message-input:focus {
  border-color: var(--primary-color, #6366f1);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

[data-theme="dark"] .action-btn {
  color: var(--text-secondary-dark, #9ca3af);
}

[data-theme="dark"] .action-btn:hover {
  background-color: var(--hover-color-dark, #1f2937);
}

[data-theme="dark"] .send-btn:disabled {
  background-color: var(--border-color-dark, #374151);
  color: var(--text-secondary-dark, #6b7280);
}

[data-theme="dark"] .image-preview {
  border-color: var(--border-color-dark, #374151);
}
</style> 