import katex from 'katex';
import 'katex/dist/katex.min.css';

// 预处理内容，将数学公式标记为特殊标记，以便在 marked 处理后能够识别
export function preprocessMathContent(content: string): string {
  // 处理块级公式 $$...$$
  content = content.replace(/\$\$([\s\S]+?)\$\$/g, (match, formula) => {
    return `\n\`\`\`math-block\n${formula}\n\`\`\`\n`;
  });
  
  // 处理行内公式 $...$，但避免处理货币符号 $123
  content = content.replace(/\$([^\s][^$]*?[^\s])\$/g, (match, formula) => {
    return `\`math-inline:${formula}\``;
  });
  
  return content;
}

// 后处理 HTML，将特殊标记转换为 KaTeX 渲染的公式
export function postprocessMathContent(html: string): string {
  // 处理块级公式
  html = html.replace(/<pre><code class="hljs language-math-block">([\s\S]+?)<\/code><\/pre>/g, (match, formula) => {
    try {
      const renderedMath = katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: true,
        output: 'html'
      });
      return `<div class="math math-display">${renderedMath}</div>`;
    } catch (error) {
      console.error('Error rendering block math:', error);
      return `<div class="math-error">数学公式渲染错误: ${error}</div>`;
    }
  });
  
  // 处理行内公式
  html = html.replace(/<code>math-inline:([\s\S]+?)<\/code>/g, (match, formula) => {
    try {
      const renderedMath = katex.renderToString(formula.trim(), {
        throwOnError: false,
        displayMode: false,
        output: 'html'
      });
      return `<span class="math math-inline">${renderedMath}</span>`;
    } catch (error) {
      console.error('Error rendering inline math:', error);
      return `<span class="math-error">公式错误</span>`;
    }
  });
  
  return html;
}

// 渲染页面中已存在的数学公式元素
export function renderMathFormulas() {
  // 查找所有未渲染的数学公式
  document.querySelectorAll('.markdown-content .math-to-render').forEach((element) => {
    const formula = element.getAttribute('data-formula') || '';
    const isDisplay = element.classList.contains('math-display-to-render');
    
    try {
      const renderedMath = katex.renderToString(formula, {
        throwOnError: false,
        displayMode: isDisplay,
        output: 'html'
      });
      
      if (isDisplay) {
        const div = document.createElement('div');
        div.classList.add('math', 'math-display');
        div.innerHTML = renderedMath;
        element.parentNode?.replaceChild(div, element);
      } else {
        const span = document.createElement('span');
        span.classList.add('math', 'math-inline');
        span.innerHTML = renderedMath;
        element.parentNode?.replaceChild(span, element);
      }
    } catch (error) {
      console.error('Error rendering math:', error);
      element.textContent = isDisplay ? `数学公式渲染错误: ${error}` : '公式错误';
      element.classList.add('math-error');
    }
  });
}

// 扩展 marked 渲染器以处理数学公式
export function extendRendererForMath(renderer: any) {
  // 保存原始的代码渲染器
  const originalCodeRenderer = renderer.code;
  
  // 重写代码渲染器以处理数学公式块
  renderer.code = function(code: string, language: string | undefined) {
    if (language === 'math' || language === 'math-block') {
      try {
        const renderedMath = katex.renderToString(code.trim(), {
          throwOnError: false,
          displayMode: true,
          output: 'html'
        });
        return `<div class="math math-display">${renderedMath}</div>`;
      } catch (error) {
        console.error('Error rendering math block:', error);
        return `<div class="math-error">数学公式渲染错误: ${error}</div>`;
      }
    }
    
    // 否则使用原始渲染器
    return originalCodeRenderer.call(this, code, language);
  };
  
  // 保存原始的行内代码渲染器
  const originalInlineCodeRenderer = renderer.codespan;
  
  // 重写行内代码渲染器以处理行内数学公式
  renderer.codespan = function(code: string) {
    if (code.startsWith('math-inline:')) {
      const formula = code.substring('math-inline:'.length);
      try {
        const renderedMath = katex.renderToString(formula.trim(), {
          throwOnError: false,
          displayMode: false,
          output: 'html'
        });
        return `<span class="math math-inline">${renderedMath}</span>`;
      } catch (error) {
        console.error('Error rendering inline math:', error);
        return `<span class="math-error">公式错误</span>`;
      }
    }
    
    // 否则使用原始渲染器
    return originalInlineCodeRenderer.call(this, code);
  };
  
  return renderer;
} 