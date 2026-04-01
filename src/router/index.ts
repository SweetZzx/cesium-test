import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name:"Home",
    component: () => import('@/views/index.vue'),
    meta: {
      title: 'cesium框架',
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior: () => ({ top: 0 }),
  routes,
})

export default router
