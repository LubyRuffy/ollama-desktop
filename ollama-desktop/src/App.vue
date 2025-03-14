<template>
  <div class="app-container" :key="appKey">
    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useAppStore } from './store';

const store = useAppStore();
const appKey = ref(0);

// Watch for language changes and force a re-render of the entire app
watch(() => store.currentLanguage, () => {
  // Increment the key to force a re-render
  appKey.value++;
});
</script>

<style>
@import './assets/theme.css';

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
}

a {
  text-decoration: none;
  color: var(--primary-color, #4a90e2);
}

a:hover {
  text-decoration: underline;
}

.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.app-nav {
  background-color: var(--bg-secondary, #f8f9fa);
  padding: 1rem;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
}

.nav-links {
  display: flex;
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-link {
  font-weight: 500;
  padding: 0.5rem 0;
}

.app-content {
  flex: 1;
}

[data-theme="dark"] .app-nav {
  background-color: var(--bg-secondary-dark, #1a202c);
  border-bottom-color: var(--border-color-dark, #2d3748);
}
</style>