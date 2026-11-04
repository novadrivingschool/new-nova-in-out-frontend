// src/config/views.ts
/**
 * Catálogo ÚNICO de vistas que se otorgan por usuario.
 *
 * Alimenta el menú, el guard del router y la vista de permisos. Las claves son contrato con
 * la auth API (`users/view-permissions.ts`) y con el backend NIO (`@RequireView`): si agregas
 * una vista, agrégala en los tres lugares.
 *
 * `paths` son los prefijos de ruta que cubre la vista (una página interna como
 * `/clocked-in-now` cuelga de NIO Analytics). Una ruta autenticada que no esté mapeada aquí
 * queda prohibida para todos salvo super_admin: es mejor que una página nueva nazca cerrada.
 */
export interface ViewDefinition {
  key: string
  title: string
  icon: string
  /** Ruta a la que lleva la entrada del menú. */
  route: string
  /** Prefijos de ruta cubiertos por esta vista. */
  paths: string[]
  description: string
}

export const VIEW_CATALOG = [
  // Activity Report deshabilitado temporalmente (04-nov-2026). Descomentar para reactivarlo.
  // {
  //   key: 'activity-report',
  //   title: 'Activity Report',
  //   icon: 'mdi-clock-check-outline',
  //   route: '/activity-report',
  //   paths: ['/activity-report'],
  //   description: 'Clock in/out and own activity.',
  // },
  // External AR (Vout) deshabilitado (04-nov-2026). Descomentar para reactivarlo.
  // {
  //   key: 'external-activity-report',
  //   title: 'External AR (Vout)',
  //   icon: 'mdi-clock-outline',
  //   route: '/external-activity-report',
  //   paths: ['/external-activity-report'],
  //   description: 'Read-only Vout Activity Report, own day and team range.',
  // },
  {
    key: 'screenshots',
    title: 'Screenshots',
    icon: 'mdi-image-outline',
    route: '/screenshots',
    paths: ['/screenshots'],
    description: 'Employee screenshots and their stats.',
  },
  {
    key: 'live-staff-activity',
    title: 'Live Activity',
    icon: 'mdi-pulse',
    route: '/live-staff-activity',
    paths: ['/live-staff-activity', '/hand-shake'],
    description: 'Real-time staff activity panel.',
  },
  {
    key: 'admin-dashboard',
    title: 'NIO Analytics',
    icon: 'mdi-chart-box-outline',
    route: '/admin-dashboard',
    paths: ['/admin-dashboard', '/clocked-in-now', '/clocked-in-today', '/not-clocked-in-now'],
    description: 'Attendance analytics and its detail lists.',
  },
  {
    key: 'users',
    title: 'Users',
    icon: 'mdi-account-outline',
    route: '/users',
    paths: ['/users'],
    description: 'User list and profiles.',
  },
  {
    key: 'settings',
    title: 'Settings',
    icon: 'mdi-cog-outline',
    route: '/settings',
    paths: ['/settings'],
    description: 'Global configuration (capture interval).',
  },
] as const satisfies readonly ViewDefinition[]

export type ViewKey = (typeof VIEW_CATALOG)[number]['key']

/** Administración de permisos: solo super_admin, no se puede delegar. */
export const PERMISSIONS_ROUTE = '/permissions'

/** Página de inicio (post-login): accesos directos, sin datos. Ver `router/home.ts`. */
const HOME_PATH = '/home'

/**
 * Rutas autenticadas que no exigen ninguna vista.
 */
const OPEN_PATHS = ['/forbidden', HOME_PATH]

const matches = (path: string, prefix: string): boolean =>
  path === prefix || path.startsWith(`${prefix}/`)

export type RouteAccess = ViewKey | 'super_admin' | 'any' | null

/** Qué se necesita para abrir `path`. `null` = ruta sin mapear (cerrada salvo super_admin). */
export function accessForPath(path: string): RouteAccess {
  if (OPEN_PATHS.some((p) => matches(path, p))) return 'any'
  if (matches(path, PERMISSIONS_ROUTE)) return 'super_admin'
  const view = VIEW_CATALOG.find((v) => v.paths.some((p) => matches(path, p)))
  return view ? view.key : null
}

/** Primera vista a la que el usuario puede entrar, en el orden del menú. */
export function firstAccessibleRoute(canView: (key: ViewKey) => boolean): string | null {
  return VIEW_CATALOG.find((v) => canView(v.key))?.route ?? null
}
