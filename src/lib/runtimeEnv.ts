/**
 * Configuración en tiempo de ejecución.
 * En el contenedor, /config.js (generado al arrancar desde el entorno del servidor) define
 * window.__ENV__. En desarrollo local (vite dev) no hay nada ahí y se usa import.meta.env (.env).
 */
export type RuntimeEnvKey =
  | 'VITE_API_AUTH_URL'
  | 'VITE_API_NOVA_IN_OUT_URL'
  | 'VITE_ENABLE_SCREENSHOT_DELETE'
  | 'VITE_DEV_ACTIVITY_BOT'

export function runtimeEnv(key: RuntimeEnvKey): string | undefined {
  const runtime = typeof window !== 'undefined' ? window.__ENV__?.[key] : undefined
  if (runtime !== undefined && runtime !== '') return runtime
  return import.meta.env[key] as string | undefined
}
