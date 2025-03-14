import hljs from 'highlight.js';

// Import common programming languages
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import java from 'highlight.js/lib/languages/java';
import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import ruby from 'highlight.js/lib/languages/ruby';
import php from 'highlight.js/lib/languages/php';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import scala from 'highlight.js/lib/languages/scala';
import bash from 'highlight.js/lib/languages/bash';
import shell from 'highlight.js/lib/languages/shell';
import sql from 'highlight.js/lib/languages/sql';
import json from 'highlight.js/lib/languages/json';
import xml from 'highlight.js/lib/languages/xml';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import css from 'highlight.js/lib/languages/css';
import less from 'highlight.js/lib/languages/less';
import scss from 'highlight.js/lib/languages/scss';

// Language aliases mapping
export const langAliases: Record<string, string> = {
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'cs': 'csharp',
  'c++': 'cpp',
  'golang': 'go',
  'rs': 'rust',
  'kt': 'kotlin',
  'sh': 'bash',
  'yml': 'yaml',
  'md': 'markdown'
};

// Language display names mapping
export const displayNames: Record<string, string> = {
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'python': 'Python',
  'java': 'Java',
  'csharp': 'C#',
  'cpp': 'C++',
  'go': 'Go',
  'rust': 'Rust',
  'ruby': 'Ruby',
  'php': 'PHP',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'scala': 'Scala',
  'bash': 'Bash',
  'shell': 'Shell',
  'sql': 'SQL',
  'json': 'JSON',
  'xml': 'XML',
  'yaml': 'YAML',
  'markdown': 'Markdown',
  'css': 'CSS',
  'less': 'Less',
  'scss': 'SCSS',
  'html': 'HTML'
};

// Initialize and register all languages
export function initializeLanguages() {
  // Register languages with their primary names
  hljs.registerLanguage('javascript', javascript);
  hljs.registerLanguage('typescript', typescript);
  hljs.registerLanguage('python', python);
  hljs.registerLanguage('java', java);
  hljs.registerLanguage('csharp', csharp);
  hljs.registerLanguage('cpp', cpp);
  hljs.registerLanguage('go', go);
  hljs.registerLanguage('rust', rust);
  hljs.registerLanguage('ruby', ruby);
  hljs.registerLanguage('php', php);
  hljs.registerLanguage('swift', swift);
  hljs.registerLanguage('kotlin', kotlin);
  hljs.registerLanguage('scala', scala);
  hljs.registerLanguage('bash', bash);
  hljs.registerLanguage('shell', shell);
  hljs.registerLanguage('sql', sql);
  hljs.registerLanguage('json', json);
  hljs.registerLanguage('xml', xml);
  hljs.registerLanguage('yaml', yaml);
  hljs.registerLanguage('markdown', markdown);
  hljs.registerLanguage('css', css);
  hljs.registerLanguage('less', less);
  hljs.registerLanguage('scss', scss);
  hljs.registerLanguage('html', xml);
  
  // Register aliases
  hljs.registerLanguage('js', javascript);
  hljs.registerLanguage('ts', typescript);
  hljs.registerLanguage('py', python);
  hljs.registerLanguage('cs', csharp);
  hljs.registerLanguage('c++', cpp);
  hljs.registerLanguage('golang', go);
  hljs.registerLanguage('rs', rust);
  hljs.registerLanguage('rb', ruby);
  hljs.registerLanguage('kt', kotlin);
  hljs.registerLanguage('sh', shell);
  hljs.registerLanguage('yml', yaml);
  hljs.registerLanguage('md', markdown);
}

// Get display name for a language
export function getDisplayName(lang: string): string {
  const normalizedLang = lang.toLowerCase();
  
  // Check if it's an alias first
  const resolvedLang = normalizedLang in langAliases 
    ? langAliases[normalizedLang as keyof typeof langAliases] 
    : normalizedLang;
  
  // Return the display name or capitalize the first letter
  return resolvedLang in displayNames 
    ? displayNames[resolvedLang as keyof typeof displayNames]
    : normalizedLang.charAt(0).toUpperCase() + normalizedLang.slice(1);
}

// Normalize language name (resolve aliases)
export function normalizeLang(lang: string): string {
  if (!lang) return 'text';
  
  const normalizedLang = lang.toLowerCase();
  return normalizedLang in langAliases 
    ? langAliases[normalizedLang as keyof typeof langAliases] 
    : normalizedLang;
} 