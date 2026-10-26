/**
 * src/components/Screenshots/screenshotFormat.ts
 *
 * Utilidades de presentación compartidas por la tarjeta y el visor de capturas.
 *
 * Los colores se devuelven como nombres de token del tema (`success`,
 * `warning`…) y no como colores literales: la versión anterior devolvía
 * 'red' / 'yellow' / 'green', que ignoran el tema y desentonan en modo oscuro.
 */
import { captureWindow, type ScreenshotImage } from '@/types/screenshots'
import { FORCE_CLOCK_OUT_REASON_LABEL, type ForceClockOutReason } from '@/types/adminClockOut'
import { SELF_CLOCK_OUT_REASON_LABEL, type SelfClockOutReason } from '@/types/remoteClock'

/** Porcentaje de tiempo activo sobre la ventana de captura de ese registro. */
export function activePercentage(
  activeTime: number | null | undefined,
  slotSeconds?: number | null,
): number {
  if (!activeTime || activeTime <= 0) return 0
  return Math.min(Math.round((activeTime / captureWindow(slotSeconds)) * 100), 100)
}

/** Intervalo de captura legible: 300 → "5 min", 3600 → "1 h", 90 → "1m 30s". */
export function formatInterval(seconds: number | null | undefined): string {
  const total = Math.round(Number(seconds))
  if (!Number.isFinite(total) || total <= 0) return ''
  if (total % 3600 === 0) return `${total / 3600} h`
  if (total % 60 === 0) return `${total / 60} min`
  return `${Math.floor(total / 60)}m ${total % 60}s`
}

/**
 * Escala de cuatro tramos para la barra de tiempo activo. Los tokens
 * `perf-*` están definidos en el tema (plugins/vuetify.ts), claro y oscuro.
 */
export function progressColor(percentage: number): string {
  if (percentage < 25) return 'perf-low'
  if (percentage < 50) return 'perf-fair'
  if (percentage < 75) return 'perf-good'
  return 'perf-high'
}

/** Calificación en palabras; el color sigue los mismos cuatro tramos de la barra. */
export function performanceRating(percentage: number): { label: string; color: string } {
  const color = progressColor(percentage)
  if (percentage < 25) return { label: 'Crítico', color }
  if (percentage < 50) return { label: 'Malo', color }
  if (percentage < 75) return { label: 'Regular', color }
  if (percentage < 90) return { label: 'Bueno', color }
  return { label: 'Excelente', color }
}

export function clockTypeColor(type: string | null | undefined): string {
  switch (type?.toLowerCase()) {
    case 'clock_in':
      return 'success'
    case 'clock_out':
      return 'error'
    default:
      return 'primary'
  }
}

/** Nombre legible de un estado de captura (`NO_INTERNET` → "Sin internet"). */
const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Activo',
  INACTIVE: 'Inactivo',
  NO_INTERNET: 'Sin internet',
  API_DOWN: 'API caída',
  OFFLINE: 'Offline',
  DISCONNECTED_WIFI: 'WiFi desconectado',
  DISCONNECTED_ETHERNET: 'Ethernet desconectado',
  RESTARTED: 'Reinicio',
  FORCE_CLOCK_OUT: 'Admin clock out',
}

export function statusLabel(status: string | null | undefined): string {
  const key = status?.trim().toUpperCase()
  if (!key) return '—'
  if (STATUS_LABELS[key]) return STATUS_LABELS[key]
  // Estado desconocido: sin guiones bajos ni mayúsculas ("SOME_STATE" → "Some state").
  const text = key.toLowerCase().replace(/_/g, ' ')
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function statusColor(status: string | null | undefined): string {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'success'
    // Mismos colores que las gráficas de estado: sin conexión se distingue de los tramos
    // de rendimiento (rojo/naranja/amarillo/verde).
    case 'offline':
      return '#000000'
    case 'no_internet':
      return '#9d00ff'
    case 'api_down':
      return '#0ea5e9'
    case 'disconnected_wifi':
      return '#ec4899'
    case 'disconnected_ethernet':
      return '#92400e'
    case 'restarted':
      return '#64748b'
    case 'force_clock_out':
      return 'warning'
    case 'inactive':
      return 'error'
    default:
      return 'secondary'
  }
}

/** Motivo de un clock out de admin en inglés (`POWER_OUTAGE` → "Power outage"). */
export function adminReasonLabel(reason: string | null | undefined): string {
  if (!reason) return ''
  return (
    FORCE_CLOCK_OUT_REASON_LABEL[reason as ForceClockOutReason] ??
    SELF_CLOCK_OUT_REASON_LABEL[reason as SelfClockOutReason] ??
    reason
  )
}

export function formatClockType(type: string | null | undefined): string {
  if (!type) return ''
  return type.replace(/_/g, ' ').toUpperCase()
}

/**
 * La barra de tiempo activo sólo tiene sentido en capturas periódicas: en un
 * fichaje de entrada o salida el dato no representa nada.
 */
export function shouldShowProgress(image: ScreenshotImage | null): boolean {
  if (!image) return false
  const hasActiveTime = image.active_time !== null && image.active_time !== undefined
  const isClockEvent =
    image.type_of_clock?.toLowerCase() === 'clock_in' ||
    image.type_of_clock?.toLowerCase() === 'clock_out'
  return hasActiveTime && !isClockEvent
}

export function imageFileName(imagePath: string | null | undefined): string {
  if (!imagePath) return 'No filename available'
  return imagePath.split('/').pop() || imagePath
}

/** Convierte lo que devuelva el date picker a `YYYY-MM-DD`. */
export function dateToString(value: unknown): string {
  if (!value) return ''
  try {
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
      return new Date(value).toISOString().split('T')[0]
    }
    if (value instanceof Date) {
      // Se usan los componentes locales para no desplazar un día por la zona
      // horaria, cosa que sí ocurre con `toISOString()`.
      const year = value.getFullYear()
      const month = String(value.getMonth() + 1).padStart(2, '0')
      const day = String(value.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    return ''
  } catch (error) {
    console.error('Error converting date:', error)
    return ''
  }
}

export function formatDisplayDate(value: unknown): string {
  if (!value) return ''
  try {
    const raw =
      typeof value === 'string'
        ? value
        : value instanceof Date
          ? dateToString(value)
          : String(value)

    const withTime = raw.includes('T') ? raw : `${raw}T00:00:00`
    return new Date(withTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    })
  } catch (error) {
    console.error('Error formatting date:', error)
    return String(value)
  }
}

export function employeeTitle(
  employee: {
    profile?: { firstName?: string; lastName?: string; employee_number?: string }
  } | null,
): string {
  if (!employee?.profile) return ''
  const { firstName, lastName, employee_number } = employee.profile
  return `${firstName ?? ''} ${lastName ?? ''} (${employee_number ?? ''})`.trim()
}
