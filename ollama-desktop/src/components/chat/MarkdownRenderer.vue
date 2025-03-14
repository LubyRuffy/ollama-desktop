<script setup lang="ts">
import { defineProps, onMounted, watch, computed } from 'vue';
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

// 预处理内容，然后使用 marked 渲染，最后进行后处理
const processedContent = computed(() => {
  // Check if content contains <think> tags
  const hasThinkingContent = props.content.includes('<think>');
  
  if (hasThinkingContent) {
    // If it has thinking content, process it directly with processThinkingContent
    return processThinkingContent(props.content);
  }
  
  // For regular content without thinking tags
  // 预处理数学公式
  const preprocessed = preprocessMathContent(props.content);
  
  // 使用 marked 渲染 Markdown
  let html = marked(preprocessed);
  
  // 后处理数学公式
  html = postprocessMathContent(html);
  
  return html;
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
  
  // Add direct click handlers to thinking headers
  setTimeout(() => {
    const thinkingHeaders = document.querySelectorAll('.thinking-header');
    console.log('Found thinking headers:', thinkingHeaders.length);
    
    thinkingHeaders.forEach(header => {
      header.addEventListener('click', (e) => {
        console.log('Direct click on thinking header');
        const headerEl = e.currentTarget as HTMLElement;
        const process = headerEl.closest('.thinking-process') as HTMLElement;
        const thinkingId = headerEl.getAttribute('data-thinking-id');
        const content = document.getElementById(`${thinkingId}-content`) as HTMLElement;
        
        if (process && content) {
          toggleThinkingProcess(process, content);
        }
      });
    });
  }, 100);
  
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
      
      // Handle thinking process elements
      const thinkingHeaders = document.querySelectorAll('.thinking-header');
      console.log('MutationObserver found thinking headers:', thinkingHeaders.length);
      
      thinkingHeaders.forEach(header => {
        // Remove existing event listeners to avoid duplicates
        const headerEl = header as HTMLElement;
        const newHeader = headerEl.cloneNode(true);
        headerEl.parentNode?.replaceChild(newHeader, headerEl);
        
        // Add new event listener
        newHeader.addEventListener('click', (e) => {
          console.log('MutationObserver click on thinking header');
          const headerEl = e.currentTarget as HTMLElement;
          const process = headerEl.closest('.thinking-process') as HTMLElement;
          const thinkingId = headerEl.getAttribute('data-thinking-id');
          const content = document.getElementById(`${thinkingId}-content`) as HTMLElement;
          
          if (process && content) {
            toggleThinkingProcess(process, content);
          }
        });
      });
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
    
    // Handle thinking process elements
    const thinkingHeaders = document.querySelectorAll('.thinking-header');
    thinkingHeaders.forEach(header => {
      header.addEventListener('click', (e) => handleThinkingClick(e as MouseEvent));
    });
  }, 0);
});
</script>

<template>
  <div 
    class="markdown-content" 
    v-html="processedContent" 
    @click="handleThinkingClick"
  ></div>
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
  cursor: pointer;
}

.thinking-process.expanded .thinking-content {
  height: auto !important;
  max-height: 500px !important;
  padding: 16px !important;
  overflow: auto !important;
  opacity: 1 !important;
  visibility: visible !important;
}
</style> 