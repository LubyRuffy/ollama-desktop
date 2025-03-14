<script setup lang="ts">
import { defineProps, onMounted, watch, computed, ref } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// Import modular components
import { initializeLanguages } from './markdown/languageConfig';
import { setupCopyCodeButtons, ensureCodeHighlighting } from './markdown/codeHighlighter';
import { 
  processThinkingContent, 
  forceCollapseAll, 
  handleThinkingClick,
  toggleThinkingProcess
} from './markdown/thinkingProcess';
import { 
  renderMathFormulas, 
  extendRendererForMath, 
  preprocessMathContent, 
  postprocessMathContent 
} from './markdown/mathRenderer';

// Initialize languages
initializeLanguages();

// Configure marked with custom renderer
const configureMarkedWithMath = () => {
  const renderer = new marked.Renderer();
  extendRendererForMath(renderer);
  
  marked.setOptions({
    renderer: renderer,
    // @ts-ignore - highlight is actually a valid option in marked but TypeScript doesn't recognize it
    highlight: function(code: string, lang: string) {
      if (lang && hljs.getLanguage(lang)) {
        try {
          return hljs.highlight(code, { language: lang }).value;
        } catch (e) {
          console.error(`Error highlighting code block: ${e}`);
        }
      }
      // If no language specified or language not supported, try auto detection
      return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true,
    headerIds: true,
    langPrefix: 'hljs language-' // Add hljs class to ensure styles are applied correctly
  });
};

// Configure marked with math support
configureMarkedWithMath();

const props = defineProps<{
  content: string;
}>();

// 跟踪思考中的内容
const thinkingInProgressContent = ref('');
const thinkingInProgressId = ref('thinking-in-progress');
const showThinkingInProgress = ref(false);
const thinkingInProgressExpanded = ref(false);

// 预处理内容，然后使用 marked 渲染，最后进行后处理
const processedContent = computed(() => {
  // 检查内容是否包含 <think> 标签
  const hasThinkingContent = props.content.includes('<think>');
  
  if (hasThinkingContent) {
    // 提取思考中的内容
    const match = props.content.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
    if (match && !props.content.includes('</think>')) {
      // 如果有未闭合的 <think> 标签，提取思考中的内容
      thinkingInProgressContent.value = match[1];
      showThinkingInProgress.value = true;
      
      // 移除思考中的内容，只处理普通内容
      const normalContent = props.content.replace(/<think>[\s\S]*?$/, '');
      
      // 处理普通内容
      if (normalContent.trim()) {
        return marked(normalContent);
      } else {
        return '';
      }
    } else {
      // 如果所有 <think> 标签都已闭合，隐藏思考中的内容
      showThinkingInProgress.value = false;
      
      // 使用 processThinkingContent 处理所有内容
      return processThinkingContent(props.content);
    }
  } else {
    // 没有思考内容，隐藏思考中的内容
    showThinkingInProgress.value = false;
    
    // 处理普通内容
    const preprocessed = preprocessMathContent(props.content);
    let html = marked(preprocessed);
    html = postprocessMathContent(html);
    return html;
  }
});

// On component mount, set up event listeners
onMounted(() => {
  setupCopyCodeButtons();
  
  // Force collapse all thinking processes
  forceCollapseAll();
  
  // Ensure all code blocks are properly highlighted
  ensureCodeHighlighting();
  
  // Render math formulas
  renderMathFormulas();
  
  // Add MutationObserver to listen for DOM changes (for streaming output)
  const observer = new MutationObserver((mutations) => {
    let shouldUpdate = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        shouldUpdate = true;
      }
    });
    
    if (shouldUpdate) {
      setupCopyCodeButtons();
      ensureCodeHighlighting();
      renderMathFormulas();
      
      // 处理思考过程元素
      const thinkingHeaders = document.querySelectorAll('[data-action="toggle-thinking"]');
      if (thinkingHeaders.length > 0) {
        // 记录当前展开状态的思考过程
        const expandedProcesses = new Set<string>();
        document.querySelectorAll('.thinking-process.expanded').forEach(el => {
          const header = el.querySelector('.thinking-header');
          if (header) {
            const id = header.getAttribute('data-thinking-id');
            if (id) expandedProcesses.add(id);
          }
        });
        
        // 遍历所有思考过程元素，确保它们有正确的事件监听器和样式
        thinkingHeaders.forEach(header => {
          const thinkingId = header.getAttribute('data-thinking-id');
          if (!thinkingId) return;
          
          const process = header.closest('.thinking-process') as HTMLElement;
          const content = document.getElementById(`${thinkingId}-content`) as HTMLElement;
          
          if (process && content) {
            // 确保思考过程元素有正确的样式
            if (!content.style.transition) {
              content.style.transition = 'all 0.3s ease';
            }
            
            // 如果思考过程之前是展开状态，恢复展开状态
            if (expandedProcesses.has(thinkingId) || process.classList.contains('expanded')) {
              process.classList.add('expanded');
              content.style.height = 'auto';
              content.style.maxHeight = '500px';
              content.style.padding = '16px';
              content.style.overflow = 'auto';
              content.style.opacity = '1';
              content.style.visibility = 'visible';
              content.style.borderTop = '1px solid var(--border-color, #e2e8f0)';
            }
          }
        });
      }
    }
  });
  
  // Start observing markdown-content element for changes
  const markdownContent = document.querySelector('.markdown-content');
  if (markdownContent) {
    observer.observe(markdownContent, {
      childList: true,
      subtree: true
    });
  }
});

// When content changes, re-setup event listeners
watch(() => props.content, () => {
  setTimeout(() => {
    setupCopyCodeButtons();
    
    // Add transition effect to all thinking process containers
    document.querySelectorAll('.thinking-content').forEach(el => {
      if (!(el as HTMLElement).style.transition) {
        (el as HTMLElement).style.transition = 'all 0.3s ease';
      }
    });
    
    // Ensure all code blocks are properly highlighted
    ensureCodeHighlighting();
    
    // Render math formulas
    renderMathFormulas();
  }, 0);
});

// Function to handle clicks on the markdown content
function handleContentClick(e: MouseEvent) {
  const target = e.target as HTMLElement;
  
  // Check if the clicked element or its parent has the data-action attribute for toggling thinking
  let thinkingHeader = target.closest('[data-action="toggle-thinking"]');
  
  // If we didn't find a thinking header, check if we clicked on a child of the thinking header
  if (!thinkingHeader) {
    if (target.closest('.thinking-title')) {
      thinkingHeader = target.closest('.thinking-header');
    } else if (target.classList.contains('thinking-header')) {
      thinkingHeader = target;
    }
  }
  
  if (thinkingHeader) {
    e.preventDefault();
    e.stopPropagation();
    
    const thinkingId = thinkingHeader.getAttribute('data-thinking-id');
    if (!thinkingId) {
      console.error('No thinking ID found on header');
      return;
    }
    
    const process = thinkingHeader.closest('.thinking-process') as HTMLElement;
    const content = document.getElementById(`${thinkingId}-content`) as HTMLElement;
    
    if (process && content) {
      // 检查思考过程是否处于进行中状态
      const isInProgress = process.getAttribute('data-in-progress') === 'true';
      
      // 简化日志
      // console.log('Toggling thinking process via global click handler');
      toggleThinkingProcess(process, content);
    } else {
      console.error('Could not find process or content element');
    }
  } else {
    // Check if we clicked on any element inside a thinking process
    const thinkingProcess = target.closest('.thinking-process');
    if (thinkingProcess) {
      // 检查思考过程是否处于进行中状态
      const isInProgress = thinkingProcess.getAttribute('data-in-progress') === 'true';
      // 移除详细状态日志
      // console.log('Clicked inside thinking process, state:', { 
      //   isInProgress, 
      //   isExpanded: thinkingProcess.classList.contains('expanded'),
      //   inProgressAttr: thinkingProcess.getAttribute('data-in-progress')
      // });
      
      const header = thinkingProcess.querySelector('.thinking-header') as HTMLElement;
      if (header) {
        // 简化日志
        // console.log('Simulating header click');
        header.click();
      }
    }
  }
}

// 处理思考中内容的点击事件
function handleThinkingInProgressClick() {
  thinkingInProgressExpanded.value = !thinkingInProgressExpanded.value;
  
  // 获取思考中内容的 DOM 元素
  const contentEl = document.getElementById(`${thinkingInProgressId.value}-content`);
  if (!contentEl) return;
  
  if (thinkingInProgressExpanded.value) {
    // 展开
    contentEl.style.height = 'auto';
    contentEl.style.maxHeight = '500px';
    contentEl.style.padding = '16px';
    contentEl.style.overflow = 'auto';
    contentEl.style.opacity = '1';
    contentEl.style.visibility = 'visible';
    contentEl.style.borderTop = '1px solid var(--border-color, #e2e8f0)';
  } else {
    // 折叠
    contentEl.style.height = '0';
    contentEl.style.maxHeight = '0';
    contentEl.style.padding = '0';
    contentEl.style.overflow = 'hidden';
    contentEl.style.opacity = '0';
    contentEl.style.visibility = 'hidden';
  }
}
</script>

<template>
  <div>
    <!-- 主要的 Markdown 内容 -->
    <div 
      class="markdown-content" 
      v-html="processedContent"
      @click="handleContentClick"
    ></div>
    
    <!-- 思考中的内容，使用单独的 div 来管理，不会随着流式内容的更新而被重新创建 -->
    <div v-if="showThinkingInProgress" class="thinking-process-streaming-wrapper">
      <div class="thinking-process-wrapper" :id="thinkingInProgressId">
        <div class="thinking-process thinking-in-progress-process" data-in-progress="true" :class="{ 'expanded': thinkingInProgressExpanded }">
          <div class="thinking-header" :data-thinking-id="thinkingInProgressId" data-action="toggle-thinking" @click="handleThinkingInProgressClick">
            <span class="thinking-title">思考中...</span>
          </div>
          <div class="thinking-content" :id="`${thinkingInProgressId}-content`" :style="{
            height: thinkingInProgressExpanded ? 'auto' : '0',
            maxHeight: thinkingInProgressExpanded ? '500px' : '0',
            padding: thinkingInProgressExpanded ? '16px' : '0',
            overflow: thinkingInProgressExpanded ? 'auto' : 'hidden',
            opacity: thinkingInProgressExpanded ? '1' : '0',
            visibility: thinkingInProgressExpanded ? 'visible' : 'hidden',
            transition: 'all 0.3s ease',
            borderTop: thinkingInProgressExpanded ? '1px solid var(--border-color, #e2e8f0)' : 'none'
          }">
            <div v-html="marked(thinkingInProgressContent)"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style src="./markdown/markdownStyles.css" scoped></style>
<style src="./markdown/thinkingStyles.css"></style>

<style>
/* Add non-scoped styles to ensure thinking process works properly */
.thinking-process-wrapper {
  margin: 12px 0;
  width: 100%;
}

.thinking-header {
  cursor: pointer !important;
  z-index: 100 !important;
  position: relative !important;
}

.thinking-process.expanded .thinking-content {
  height: auto !important;
  max-height: 500px !important;
  padding: 16px !important;
  overflow: auto !important;
  opacity: 1 !important;
  visibility: visible !important;
}

/* Ensure the thinking process is clickable during streaming */
.thinking-in-progress .thinking-header {
  position: relative;
  z-index: 10;
  cursor: pointer !important;
  background-color: rgba(99, 102, 241, 0.1) !important;
}

.thinking-in-progress .thinking-header:hover {
  background-color: rgba(99, 102, 241, 0.2) !important;
}

/* Make the title more prominent */
.thinking-title {
  font-weight: bold;
  pointer-events: auto;
}

/* Special styles for streaming thinking process */
.thinking-process-streaming-wrapper {
  margin: 8px 0;
  padding: 8px;
  border-radius: 6px;
  background-color: rgba(0, 0, 0, 0.03);
  border: 1px dashed var(--border-color, #e2e8f0);
  /* 确保流式传输过程中的思考过程元素不会被覆盖 */
  position: relative;
  z-index: 5;
  /* 添加过渡效果，使其更加平滑 */
  transition: all 0.3s ease;
}

/* 增强思考中状态的视觉效果 */
.thinking-process-streaming-wrapper .thinking-header {
  padding: 8px !important;
  border-radius: 4px !important;
  background-color: rgba(59, 130, 246, 0.05) !important;
  transition: background-color 0.2s ease !important;
  cursor: pointer !important;
  /* 增加点击区域 */
  margin: -4px !important;
  padding: 12px !important;
}

.thinking-process-streaming-wrapper .thinking-header:hover {
  background-color: rgba(59, 130, 246, 0.1) !important;
}

/* 确保正在进行中的思考过程也能正确显示展开/折叠状态 */
.thinking-process[data-in-progress="true"] .thinking-title {
  color: var(--primary-color, #3b82f6);
  /* 增加字体大小，使其更加明显 */
  font-size: 1.05em;
}

.thinking-process[data-in-progress="true"] .thinking-header {
  cursor: pointer !important;
  background-color: rgba(59, 130, 246, 0.1);
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.thinking-process[data-in-progress="true"] .thinking-header:hover {
  background-color: rgba(59, 130, 246, 0.2);
}

/* 使用更高优先级的选择器和 !important 来确保样式能够覆盖内联样式 */
.thinking-process.expanded .thinking-content,
.thinking-process[data-in-progress="true"].expanded .thinking-content {
  height: auto !important;
  max-height: 500px !important;
  padding: 16px !important;
  overflow: auto !important;
  opacity: 1 !important;
  visibility: visible !important;
  border-top: 1px solid var(--border-color, #e2e8f0) !important;
  transition: all 0.3s ease !important;
}
</style> 