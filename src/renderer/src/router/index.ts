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
  },
  {
    path: '/default-setup/:gameId',
    name: 'DefaultSetup',
    component: () => import('../pages/default-setup.vue')
  },
  {
    path: '/games/:gameId',
    name: 'GameManager',
    component: () => import('../pages/game-manager/index.vue')
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
