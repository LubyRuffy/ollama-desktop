import { createRouter, createWebHistory } from 'vue-router';
import Chat from '../components/Chat.vue';

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Chat
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../components/NotFound.vue')
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router; 