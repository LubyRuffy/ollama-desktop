import { createApp, watch } from "vue";
import { createPinia } from 'pinia';
import { createI18n } from 'vue-i18n';
import App from "./App.vue";
import router from './router';
import 'highlight.js/styles/github.css';
import './assets/highlight-theme.css';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import en from 'element-plus/dist/locale/en.mjs'
import { useAppStore } from './store';
import { messages } from './locales';

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);

// Initialize the store
const appStore = useAppStore();

// Initialize the app (theme, language, and last used model)
appStore.initApp();

// Get ElementPlus locale based on current language
const getElementLocale = (lang: string) => {
  return lang === 'zh' ? zhCn : en;
};

// Initialize the i18n plugin
const i18n = createI18n({
  legacy: false, // you must set `false`, to use Composition API
  locale: appStore.currentLanguage, // set locale
  fallbackLocale: 'en', // set fallback locale
  messages, // set locale messages
  globalInjection: true, // add global injection
  silentTranslationWarn: true, // suppress warnings
});

// Expose i18n instance globally for direct access
(window as any).__VUE_I18N_INSTANCE__ = i18n;

// Watch for language changes in the store and update i18n locale
watch(() => appStore.currentLanguage, (newLang) => {
  i18n.global.locale.value = newLang as 'en' | 'zh';
  
  // Also update ElementPlus locale
  (window as any).__ELEMENT_PLUS_LOCALE__ = getElementLocale(newLang);
}, { immediate: true });

app.use(router);
app.use(ElementPlus, {
  locale: getElementLocale(appStore.currentLanguage)
});
app.use(i18n);

// Expose ElementPlus locale globally for direct access
(window as any).__ELEMENT_PLUS_LOCALE__ = getElementLocale(appStore.currentLanguage);

app.mount("#app");
