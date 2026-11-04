// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router/auto'
import { setupLayouts } from 'virtual:generated-layouts'
import { routes } from 'vue-router/auto-routes'
import type { NavigationGuard, RouteLocationNormalized, RouteLocationRaw } from 'vue-router'
import { useAuth } from '@/stores/auth/useAuth'
import { HOME_ROUTE } from './home'
import { PERMISSIONS_ROUTE, accessForPath, firstAccessibleRoute } from '@/config/views'

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

/** Login conservando el destino original y, si aplica, el motivo. */
function toLogin(to: RouteLocationNormalized, reason?: 'daily'): RouteLocationRaw {
  return { path: '/', query: { redirect: to.fullPath, ...(reason ? { reason } : {}) } }
}

// Guard: todo privado salvo las rutas marcadas con `meta.public`
const authGuard: NavigationGuard = async (to) => {
  const auth = useAuth()

  // Login diario: aunque el token siga vigente, cada día calendario exige credenciales.
  const dailyExpired = auth.isSessionStale()
  if (dailyExpired) await auth.expireSession()

  if (to.meta?.public) {
    // Con sesión del día vigente el login no aporta nada: ir al inicio.
    if (to.name === 'login' && auth.isLogged) return { path: HOME_ROUTE }
    // Sesión recién caducada: avisarlo en el login.
    if (dailyExpired && to.name === 'login' && !to.query.reason) {
      return { path: to.path, query: { ...to.query, reason: 'daily' } }
    }
    return
  }

  // Si no hay access token pero sí refresh token → intentar refresh antes de mandar al login
  if (!auth.accessToken && auth.refreshToken) {
    try {
      await auth.refreshNow()
    } catch {
      return toLogin(to)
    }
  }

  // Si definitivamente no hay token → login
  if (!auth.accessToken) {
    return toLogin(to, dailyExpired ? 'daily' : undefined)
  }

  // Roles y vistas se re-leen (con TTL) para que una revocación llegue sin cerrar sesión.
  await auth.refreshMe()

  // (opcional) si la ruta tiene restricción de roles
  if (to.meta?.roles?.length) {
    const ok = to.meta.roles.some(r => auth.user?.roles.includes(r))
    if (!ok) return { path: '/forbidden' } as RouteLocationRaw
  }

  // Permiso de vista: lo decide el catálogo (`config/views.ts`), no cada página.
  // Ruta sin mapear => cerrada salvo super_admin.
  const access = accessForPath(to.path)
  // Ser super_admin no da vistas: solo /permissions (y lo sin mapear) van por rol.
  const allowed =
    access === 'any' ||
    (access === 'super_admin' || access === null
      ? auth.isSuperAdmin
      : auth.canView(access))
  if (!allowed) {
    // Tras el login se aterriza en HOME_ROUTE: si no es accesible, llevar a la primera que sí lo sea.
    if (to.path === HOME_ROUTE) {
      const fallback =
        firstAccessibleRoute(auth.canView) ?? (auth.isSuperAdmin ? PERMISSIONS_ROUTE : null)
      if (fallback && fallback !== to.path) return { path: fallback }
    }
    return { path: '/forbidden' } as RouteLocationRaw
  }
}

router.beforeEach(authGuard)

export default router
