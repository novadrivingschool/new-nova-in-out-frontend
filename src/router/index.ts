// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'
import type { NavigationGuard, RouteLocationRaw } from 'vue-router'
import { useAuth } from '@/stores/auth/useAuth'

declare module 'vue-router' {
  interface RouteMeta {
    /** Restringe la ruta a estos roles. Vacío o ausente = cualquier autenticado. */
    roles?: string[]
    /** Ruta accesible sin sesión. También oculta el cromo de la aplicación. */
    public?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: setupLayouts(routes),
})

// Guard: todo privado salvo las rutas marcadas con `meta.public`
const authGuard: NavigationGuard = async (to) => {
  const auth = useAuth()

  if (to.meta?.public) return // login siempre accesible

  // Si no hay access token pero sí refresh token → intentar refresh antes de mandar al login
  if (!auth.accessToken && auth.refreshToken) {
    try {
      await auth.refreshNow()
    } catch {
      return { path: '/' } as RouteLocationRaw
    }
  }

  // Si definitivamente no hay token → login
  if (!auth.accessToken) {
    return { path: '/' } as RouteLocationRaw
  }

  // (opcional) si la ruta tiene restricción de roles
  if (to.meta?.roles?.length) {
    const ok = to.meta.roles.some(r => auth.user?.roles.includes(r))
    if (!ok) return { path: '/forbidden' } as RouteLocationRaw
  }
}

router.beforeEach(authGuard)

export default router
