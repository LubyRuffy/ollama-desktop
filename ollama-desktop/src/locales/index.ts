import en from './en';
import zh from './zh';

export const messages = {
  en,
  zh
};

export const availableLocales = [
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' }
];

// Get system locale
export function getSystemLocale(): string {
  const browserLang = navigator.language.split('-')[0];
  return availableLocales.some(locale => locale.code === browserLang) ? browserLang : 'en';
} 