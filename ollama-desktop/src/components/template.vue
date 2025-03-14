<template>
  <div class="component">
    <h1>Component Title</h1>
    <p>This is a template component that uses theme variables.</p>
    <button class="primary-button">Primary Button</button>
    <button class="secondary-button">Secondary Button</button>
  </div>
</template>

<script setup lang="ts">
// Component logic goes here
</script>

<style scoped>
.component {
  padding: 20px;
  background-color: var(--bg-color, #ffffff);
  color: var(--text-color, #374151);
  border-radius: 8px;
  border: 1px solid var(--border-color, #e5e7eb);
}

h1 {
  color: var(--heading-color, #111827);
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

p {
  margin-bottom: 1rem;
}

.primary-button {
  background-color: var(--primary-color, #6366f1);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
  margin-right: 10px;
}

.primary-button:hover {
  background-color: var(--primary-hover, #4f46e5);
}

.secondary-button {
  background-color: var(--bg-secondary, #f9fafb);
  color: var(--text-color, #374151);
  border: 1px solid var(--border-color, #e5e7eb);
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.secondary-button:hover {
  background-color: var(--hover-color, #f3f4f6);
  border-color: var(--border-hover, #d1d5db);
}
</style> 