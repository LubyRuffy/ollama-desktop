<template>
  <div class="not-found">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The page you are looking for does not exist or has been moved.</p>
    <button @click="goHome">Go to Home</button>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goHome() {
  router.push('/');
}
</script>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 0 20px;
  background-color: var(--bg-color, #ffffff);
  color: var(--text-color, #374151);
}

h1 {
  font-size: 6rem;
  margin-bottom: 0;
  color: var(--primary-color, #396cd8);
}

h2 {
  font-size: 2rem;
  margin-top: 0;
  color: var(--heading-color, #111827);
}

p {
  margin: 20px 0;
  font-size: 1.2rem;
  color: var(--text-color, #374151);
}

button {
  background-color: var(--primary-color, #396cd8);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: background-color 0.3s;
}

button:hover {
  background-color: var(--primary-hover, #2a4fa0);
}
</style> 