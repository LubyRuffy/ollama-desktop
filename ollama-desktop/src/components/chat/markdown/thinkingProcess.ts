import { marked } from 'marked';
import { addLanguageLabels } from './codeHighlighter';

// Toggle thinking process visibility
export function toggleThinkingProcess(process: HTMLElement, content: HTMLElement) {
  // 精简日志，只在调试时需要时再打开
  // console.log('Toggling thinking process', process, content);
  const isExpanded = process.classList.contains('expanded');
  const isInProgress = process.getAttribute('data-in-progress') === 'true';
  
  // 只保留状态变化的日志，简化输出
  if (isExpanded) {
    // Collapse
    process.classList.remove('expanded');
    content.style.height = '0';
    content.style.maxHeight = '0';
    content.style.padding = '0';
    content.style.overflow = 'hidden';
    content.style.opacity = '0';
    content.style.visibility = 'hidden';
    // console.log('Collapsed thinking process');
  } else {
    // Expand
    process.classList.add('expanded');
    content.style.height = 'auto';
    content.style.maxHeight = '500px';
    content.style.padding = '16px';
    content.style.overflow = 'auto';
    content.style.opacity = '1';
    content.style.visibility = 'visible';
    content.style.borderTop = '1px solid var(--border-color, #e2e8f0)';
    // console.log('Expanded thinking process');
  }
  
  // Enable transition effect
  content.style.transition = 'all 0.3s ease';
}

// Force collapse all thinking processes
export function forceCollapseAll() {
  // Find all thinking process containers
  const processes = document.querySelectorAll('.thinking-process');
  processes.forEach(process => {
    const content = process.querySelector('.thinking-content');
    
    if (!content) return;
    
    // Force collapse
    process.classList.remove('expanded');
    
    // Set styles directly, without transition
    const contentEl = content as HTMLElement;
    contentEl.style.transition = 'none';
    contentEl.style.height = '0';
    contentEl.style.maxHeight = '0';
    contentEl.style.padding = '0';
    contentEl.style.overflow = 'hidden';
    contentEl.style.opacity = '0';
    contentEl.style.visibility = 'hidden';
    
    // Re-enable transition effect
    setTimeout(() => {
      contentEl.style.transition = 'all 0.3s ease';
    }, 50);
  });
}

// Create thinking process HTML
export function createThinkingProcessHTML(thinkingId: string, content: string, inProgress: boolean = false) {
  const title = inProgress ? '思考中...' : '思考过程';
  const processClass = inProgress ? 'thinking-process thinking-in-progress-process' : 'thinking-process';
  const dataInProgress = inProgress ? 'data-in-progress="true"' : '';
  
  // Always start collapsed, regardless of whether it's in progress
  const contentStyles = "height:0;max-height:0;padding:0;overflow:hidden;opacity:0;visibility:hidden;transition:all 0.3s ease;";
  
  return `
    <div class="thinking-process-wrapper" id="${thinkingId}">
      <div class="${processClass}" ${dataInProgress}>
        <div class="thinking-header" data-thinking-id="${thinkingId}" data-action="toggle-thinking">
          <span class="thinking-title">${title}</span>
        </div>
        <div class="thinking-content" id="${thinkingId}-content" style="${contentStyles}">
          ${addLanguageLabels(marked(content))}
        </div>
      </div>
    </div>
  `;
}

// 用于跟踪已创建的思考过程元素的映射
const createdThinkingProcesses = new Map<string, string>();

// 使用一个固定的前缀，确保同一会话中的思考过程ID保持一致
const SESSION_ID = `session-${Date.now()}`;

// Process content with thinking tags
export function processThinkingContent(content: string) {
  // If no thinking process tags, return Markdown rendering directly
  if (!content.includes('<think>')) {
    const html = marked(content);
    return addLanguageLabels(html);
  }
  
  // 只保留关键日志，移除详细内容
  // console.log('Processing thinking content:', content);
  
  // Generate a unique message ID to distinguish thinking processes in different messages
  const messageId = `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  
  // Process thinking content
  let result = '';
  let inThinkingMode = false;
  let thinkingContent = '';
  let normalContent = '';
  let thinkingCount = 0;
  
  // Split content by <think> and </think> tags
  const parts = content.split(/(<think>|<\/think>)/g);
  // 移除详细的数组内容打印，避免大量日志
  // console.log('Split parts:', parts);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    
    if (part === '<think>') {
      // Start tag, enter thinking mode
      inThinkingMode = true;
      
      // Process previous normal content first
      if (normalContent) {
        result += addLanguageLabels(marked(normalContent));
        normalContent = '';
      }
      
      // Create unique ID for each thinking process
      thinkingCount++;
      
    } else if (part === '</think>') {
      // End tag, exit thinking mode
      inThinkingMode = false;
      
      // Process thinking content
      if (thinkingContent) {
        const thinkingId = `${messageId}-thinking-${thinkingCount}`;
        // 简化日志，不打印详细ID
        // console.log('Creating thinking process HTML for completed thinking:', thinkingId);
        result += createThinkingProcessHTML(thinkingId, thinkingContent);
        thinkingContent = '';
      }
      
    } else if (inThinkingMode) {
      // In thinking mode, accumulate thinking content
      thinkingContent += part;
    } else {
      // Not in thinking mode, accumulate normal content
      normalContent += part;
    }
  }
  
  // Process remaining content
  if (normalContent) {
    result += addLanguageLabels(marked(normalContent));
  }
  
  // If thinking mode didn't end properly, handle unclosed thinking content
  if (inThinkingMode && thinkingContent) {
    const thinkingId = `${messageId}-thinking-${thinkingCount}`;
    // Mark as in progress
    // 简化日志，只保留关键信息
    // console.log('Creating thinking process HTML for in-progress thinking:', thinkingId);
    
    // Add a special class to make it more noticeable during streaming
    result += `<div class="thinking-process-streaming-wrapper">`;
    result += createThinkingProcessHTML(thinkingId, thinkingContent, true);
    result += `</div>`;
  }
  
  // 移除详细的结果打印，避免大量HTML输出到控制台
  // console.log('Processed result:', result);
  return result;
}

// Handle click events for thinking process
export function handleThinkingClick(e: MouseEvent) {
  // 简化日志，移除事件对象打印
  // console.log('Thinking click event triggered', e);
  const target = e.target as HTMLElement;
  
  // Check if the clicked element is a thinking header or its child
  const header = target.closest('.thinking-header');
  
  if (header) {
    // 简化日志，不打印DOM元素
    // console.log('Found thinking header:', header);
    const process = header.closest('.thinking-process') as HTMLElement;
    const thinkingId = header.getAttribute('data-thinking-id');
    
    if (!thinkingId) {
      console.log('No thinking ID found');
      return;
    }
    
    const content = document.getElementById(`${thinkingId}-content`) as HTMLElement;
    
    // 移除冗余的DOM元素打印
    // console.log('Process element:', process);
    // console.log('Content element:', content);
    
    if (process && content) {
      // 简化日志
      // console.log('Toggling thinking process');
      toggleThinkingProcess(process, content);
    } else {
      console.log('Could not find process or content element');
    }
  } else {
    // 移除不必要的日志
    // console.log('No thinking header found in click path');
  }
}

// Manually expand a thinking process by ID
export function expandThinkingProcess(thinkingId: string) {
  const process = document.getElementById(thinkingId)?.querySelector('.thinking-process') as HTMLElement;
  const content = document.getElementById(`${thinkingId}-content`) as HTMLElement;
  
  if (process && content) {
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