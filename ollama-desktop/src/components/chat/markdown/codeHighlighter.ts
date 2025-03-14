import hljs from 'highlight.js';
import { marked } from 'marked';
import { getDisplayName, normalizeLang } from './languageConfig';

// Create custom renderer for marked
export function createCustomRenderer() {
  const renderer = new marked.Renderer();

  // Custom code block rendering
  renderer.code = function(code, language) {
    // Normalize language name
    let normalizedLang = language ? normalizeLang(language) : '';
    let displayLang = language ? getDisplayName(language) : 'Text';
    
    // Try to highlight code
    let highlighted = '';
    if (normalizedLang && hljs.getLanguage(normalizedLang)) {
      try {
        highlighted = hljs.highlight(code, { language: normalizedLang }).value;
      } catch (e) {
        console.error(`Error highlighting ${normalizedLang} code:`, e);
        // Fallback to auto detection
        highlighted = hljs.highlightAuto(code).value;
      }
    } else {
      // No language specified or unsupported language, use auto detection
      const result = hljs.highlightAuto(code);
      highlighted = result.value;
      
      // If auto detection succeeds, update language display
      if (result.language && !normalizedLang) {
        normalizedLang = result.language;
        displayLang = getDisplayName(normalizedLang);
      }
    }
    
    // Return code block with language label and copy button
    return `<pre data-language="${normalizedLang || 'text'}"><div class="code-header"><span class="code-language">${displayLang}</span><button class="copy-code-button" title="复制代码">复制</button></div><code class="hljs language-${normalizedLang || 'text'}">${highlighted}</code></pre>`;
  };

  return renderer;
}

// Configure marked with custom renderer
export function configureMarked() {
  const renderer = createCustomRenderer();
  
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
}

// Add language labels to code blocks
export function addLanguageLabels(html: string): string {
  return html
    // Handle code blocks without language identifier
    .replace(/<pre><code>/g, '<pre data-language="text"><div class="code-header"><span class="code-language">Text</span><button class="copy-code-button" title="复制代码">复制</button></div><code>')
    // Ensure all code blocks have the correct structure
    .replace(/<pre><code class="([^"]+)">/g, (match, className) => {
      // Extract language name
      const langMatch = className.match(/language-([a-zA-Z0-9_]+)/);
      if (langMatch) {
        const lang = langMatch[1];
        const displayLang = getDisplayName(lang);
        
        return `<pre data-language="${lang}"><div class="code-header"><span class="code-language">${displayLang}</span><button class="copy-code-button" title="复制代码">复制</button></div><code class="${className}">`;
      }
      return match;
    });
}

// Ensure all code blocks are properly highlighted
export function ensureCodeHighlighting() {
  // Find all code blocks
  document.querySelectorAll('pre code').forEach((block) => {
    // Get language
    const classNames = block.className.split(' ');
    let language = '';
    for (const className of classNames) {
      if (className.startsWith('language-')) {
        language = className.replace('language-', '');
        break;
      }
    }
    
    if (language) {
      // Reapply highlighting
      hljs.highlightElement(block as HTMLElement);
      
      // Ensure parent element has correct language marker
      const pre = block.parentElement;
      if (pre) {
        pre.setAttribute('data-language', language);
        
        // Update language display
        const langSpan = pre.querySelector('.code-language');
        if (langSpan) {
          langSpan.textContent = getDisplayName(language);
        }
      }
    }
  });
}

// Set up code copy buttons
export function setupCopyCodeButtons() {
  document.querySelectorAll('.copy-code-button').forEach(button => {
    if (!button.hasAttribute('data-event-added')) {
      button.setAttribute('data-event-added', 'true');
      
      button.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling to thinking process click event
        
        // Get code content
        const pre = (e.target as HTMLElement).closest('pre');
        if (!pre) return;
        
        const code = pre.querySelector('code');
        if (!code) return;
        
        // Copy code
        const text = code.textContent || '';
        navigator.clipboard.writeText(text).then(() => {
          // Show copy success message
          const button = e.target as HTMLElement;
          const originalText = button.textContent;
          button.textContent = '已复制!';
          button.classList.add('copied');
          
          // Restore original text after 2 seconds
          setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('copied');
          }, 2000);
        }).catch(err => {
          console.error('复制失败:', err);
        });
      });
    }
  });
} 