import { App } from 'vue'
import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    redirect: '/default-setup/1'
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
    meta: {
      requireModPath: true
    },
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
