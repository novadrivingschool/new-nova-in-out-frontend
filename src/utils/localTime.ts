import { CHICAGO_TZ } from '@/utils/clockSession'

/**
 * Hora en la zona del NAVEGADOR (solo presentación).
 * El backend guarda y calcula todo en America/Chicago (fecha, hora, "día"); aquí solo se convierte
 * lo que se MUESTRA. La lógica (timers, cooldown, bloqueos, payloads) sigue en hora de Chicago.
 */

/** Zonas que equivalen a Chicago (si el navegador está en una de ellas no se convierte nada). */
const CHICAGO_ALIASES = new Set([CHICAGO_TZ, 'US/Central'])

/** Ciudades con acento / nombre más legible que el último tramo del id IANA. */
const CITY_OVERRIDES: Record<string, string> = {
  Merida: 'Mérida',
  Bogota: 'Bogotá',
  Asuncion: 'Asunción',
  Mexico_City: 'Mexico City',
  Sao_Paulo: 'São Paulo',
  Havana: 'La Habana',
  Calcutta: 'Kolkata',
}

/** Zona IANA del navegador (p. ej. 'America/Merida'). Cae a Chicago si no se puede resolver. */
export function browserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || CHICAGO_TZ
  } catch {
    return CHICAGO_TZ
  }
}

/** true si la zona del navegador es la de Chicago (la vista se ve igual que antes). */
export function isChicagoZone(tz: string = browserTimeZone()): boolean {
  return CHICAGO_ALIASES.has(tz)
}

/** Diferencia (ms) entre la hora de pared de `tz` y UTC en el instante `at` (redondeada a segundos). */
function tzOffsetMs(at: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(at))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
  return asUtc - Math.floor(at / 1000) * 1000
}

/**
 * Instante real de un horario de pared de America/Chicago ('YYYY-MM-DD' + 'HH:mm:ss').
 * Usa el offset de Chicago de ESA fecha (maneja DST). Hora ambigua (fin de DST) = primera ocurrencia;
 * hora inexistente (inicio de DST) = se corre hacia adelante. Devuelve null si la entrada es inválida.
 */
export function chicagoWallToDate(dateYYYYMMDD: string, timeHHMMSS: string): Date | null {
  const d = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateYYYYMMDD ?? ''))
  const t = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(String(timeHHMMSS ?? ''))
  if (!d || !t) return null
  const wall = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), Number(t[1]), Number(t[2]), Number(t[3] ?? 0))
  if (Number.isNaN(wall)) return null
  // Dos pasadas: el offset depende del instante, y el instante del offset.
  const first = wall - tzOffsetMs(wall, CHICAGO_TZ)
  const second = wall - tzOffsetMs(first, CHICAGO_TZ)
  // Si la segunda pasada no regresa a la misma hora de pared, esa hora no existe (salto de DST):
  // se usa la primera pasada, que la corre hacia adelante.
  const roundTrips = second + tzOffsetMs(second, CHICAGO_TZ) === wall
  return new Date(roundTrips ? second : first)
}

const timeFormatters = new Map<string, Intl.DateTimeFormat>()
function timeFormatter(tz: string, seconds: boolean): Intl.DateTimeFormat {
  const key = `${tz}|${seconds}`
  let f = timeFormatters.get(key)
  if (!f) {
    f = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      hourCycle: 'h23',
      hour: '2-digit',
      minute: '2-digit',
      ...(seconds ? { second: '2-digit' } : {}),
    })
    timeFormatters.set(key, f)
  }
  return f
}

/**
 * Hora de un registro (guardada en Chicago) mostrada en la zona del navegador, 24 h.
 * 'HH:mm:ss' por defecto (como se mostraba antes) o 'HH:mm' con `{ seconds: false }`.
 * Si `time` está vacío o es inválido devuelve lo mismo que mostraba la vista (el texto recortado).
 * Si el navegador está en Chicago no convierte nada.
 */
export function formatLocalTime(
  date: string | null | undefined,
  time: string | null | undefined,
  opts: { seconds?: boolean; fallbackDate?: string } = {},
): string {
  const seconds = opts.seconds !== false
  const raw = String(time ?? '')
  const plain = raw.slice(0, seconds ? 8 : 5)
  const tz = browserTimeZone()
  if (isChicagoZone(tz) || !raw || raw.startsWith('00:00:00')) return plain
  const day = /^\d{4}-\d{2}-\d{2}/.test(String(date ?? '')) ? String(date) : (opts.fallbackDate ?? '')
  const instant = chicagoWallToDate(day, raw)
  if (!instant) return plain
  return timeFormatter(tz, seconds).format(instant)
}

/** Reloj en vivo: 'HH:mm:ss' (24 h) en la zona del navegador. */
export function formatLocalClock(d: Date = new Date()): string {
  return timeFormatter(browserTimeZone(), true).format(d)
}

/** Fecha corta en la zona del navegador, p. ej. 'Mon, Nov 2'. */
export function formatLocalDate(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: browserTimeZone(),
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d)
}

/** Ciudad de la zona IANA (último tramo): 'America/Merida' → 'Mérida'. */
export function zoneCity(tz: string = browserTimeZone()): string {
  const last = tz.split('/').pop() ?? tz
  return CITY_OVERRIDES[last] ?? last.replace(/_/g, ' ')
}

/** Offset corto de la zona en `d`: 'GMT-6' (o la abreviatura que dé Intl si no hay shortOffset). */
export function zoneOffsetLabel(d: Date = new Date(), tz: string = browserTimeZone()): string {
  for (const style of ['shortOffset', 'short'] as const) {
    try {
      const name = new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: style })
        .formatToParts(d)
        .find((p) => p.type === 'timeZoneName')?.value
      if (name) return name
    } catch {
      /* estilo no soportado: probar el siguiente */
    }
  }
  return ''
}

/** Etiqueta corta de la zona: 'Mérida · GMT-6'. */
export function zoneLabel(d: Date = new Date(), tz: string = browserTimeZone()): string {
  const off = zoneOffsetLabel(d, tz)
  return off ? `${zoneCity(tz)} · ${off}` : zoneCity(tz)
}
