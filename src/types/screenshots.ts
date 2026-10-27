/**
 * src/types/screenshots.ts
 *
 * Tipos compartidos por la vista de capturas de pantalla.
 */

export interface EmployeeProfile {
  firstName: string
  lastName: string
  employee_number: string
}

export interface Employee {
  id?: string
  email?: string | null
  profile: EmployeeProfile
}

/** Datos del cierre hecho por un admin (solo en CLOCK_OUT con FORCE_CLOCK_OUT). */
export interface AdminClockOutInfo {
  reason: string
  note: string | null
  admin_name: string
  /** ADMIN: cierre de un admin · SELF: el propio usuario desde el Activity Report. */
  kind?: 'ADMIN' | 'SELF'
}

/** Registro tal y como llega del backend, antes de resolver las URLs firmadas. */
export interface RawScreenshotRecord {
  id: number
  employee_number: string
  clock_date: string
  clock_time: string
  type_of_clock?: string
  activity_status?: string
  image?: string
  thumbnail?: string
  active_time?: number
  /** Intervalo de captura (s) vigente cuando se creó el registro. Ausente en datos antiguos. */
  slot_seconds?: number
  admin_clock_out?: AdminClockOutInfo | null
  /** Origen del clock: MANUAL (app), ACTIVITY_REPORT (web), ADMIN_FORCE o APP_LOGOUT (log out de la app). Ausente en datos antiguos. */
  source?: string | null
}

/** Registro ya listo para pintar, con URLs firmadas resueltas. */
export interface ScreenshotImage {
  id: number
  employee_number: string
  fullName: string
  imageUrl: string
  thumbnailUrl: string
  clock_date: string
  clock_time: string
  type_of_clock: string
  activity_status: string
  image: string
  thumbnail: string
  active_time: number
  /** Ventana (s) sobre la que se mide `active_time`. */
  slot_seconds: number
  /** Presente si el CLOCK_OUT lo hizo un admin. */
  adminClockOut: AdminClockOutInfo | null
  /** Origen del clock (ver RawScreenshotRecord.source); '' si no consta. */
  source: string
}

/**
 * Ventana de captura histórica (5 min). Es el valor de los registros creados
 * antes de que el intervalo fuera configurable y el fallback si falta el dato.
 */
export const DEFAULT_CAPTURE_WINDOW_SECONDS = 300

/**
 * Ventana (s) de un registro. El tiempo activo se expresa como porcentaje sobre
 * ESTA base, no sobre el intervalo actual: así cambiar el intervalo global no
 * distorsiona la barra de los registros ya guardados.
 */
export function captureWindow(slotSeconds: number | null | undefined): number {
  return typeof slotSeconds === 'number' && Number.isFinite(slotSeconds) && slotSeconds > 0
    ? slotSeconds
    : DEFAULT_CAPTURE_WINDOW_SECONDS
}
