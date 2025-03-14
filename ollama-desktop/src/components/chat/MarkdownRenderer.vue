<script setup lang="ts">
import { defineProps, onMounted, watch, computed } from 'vue';
import { marked } from 'marked';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';

// Import modular components
import { initializeLanguages } from './markdown/languageConfig';
import { configureMarked, setupCopyCodeButtons, ensureCodeHighlighting } from './markdown/codeHighlighter';
import { processThinkingContent, forceCollapseAll, handleThinkingClick } from './markdown/thinkingProcess';
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
  // 预处理数学公式
  const preprocessed = preprocessMathContent(props.content);
  
  // 使用 marked 渲染 Markdown
  let html = marked(preprocessed);
  
  // 处理思考过程
  html = processThinkingContent(html);
  
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
</script>

<template>
  <div class="markdown-content" v-html="processedContent" @click="handleThinkingClick"></div>
</template>

<style src="./markdown/markdownStyles.css" scoped></style> 