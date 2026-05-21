import { App } from 'vue'
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../pages/home.vue')
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('../pages/settings.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export function setupRouter(app: App): void {
  app.use(router)
}

export default router
