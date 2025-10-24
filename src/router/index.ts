// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'
import type { NavigationGuard, RouteLocationRaw } from 'vue-router'
import { useAuth } from '@/stores/auth/useAuth'

declare module 'vue-router' {
  interface RouteMeta {
    roles?: string[]
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})

// Guard: todo privado salvo "/"
const authGuard: NavigationGuard = async (to) => {
  const auth = useAuth()

  if (!auth.accessToken && to.path !== '/') {
    return { path: '/' } as RouteLocationRaw
  }

  // (opcional) si la ruta tiene restricción de roles
  if (auth.accessToken && to.meta?.roles?.length) {
    /* if (!auth.user && auth.hydrateMe) await auth.hydrateMe() */
    const ok = to.meta.roles.some(r => auth.user?.roles.includes(r))
    if (!ok) return { path: '/forbidden' } as RouteLocationRaw
  }
}

router.beforeEach(authGuard)

export default router
