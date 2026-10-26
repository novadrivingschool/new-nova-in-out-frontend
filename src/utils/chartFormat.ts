/**
 * src/utils/chartFormat.ts
 *
 * Formateadores compartidos por las gráficas del dashboard.
 */
import { parseDateString } from '@/utils/dateString'

/** 0..23 -> '12 AM', '9 AM', '1 PM'. */
export function formatHour(hour: number): string {
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12} ${hour < 12 ? 'AM' : 'PM'}`
}

/** 'YYYY-MM-DD' -> 'Mon 10/20' (etiqueta corta de eje). */
export function formatShortDate(value: string): string {
  const date = parseDateString(value)
  if (!date) return value
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' })
  return `${weekday} ${date.getMonth() + 1}/${date.getDate()}`
}

/** 'YYYY-MM-DD' -> '10/20' (etiqueta mínima de eje). */
export function formatShortMonthDay(value: string): string {
  const date = parseDateString(value)
  return date ? `${date.getMonth() + 1}/${date.getDate()}` : value
}

/** Recorta con puntos suspensivos; sirve para nombres largos en ejes. */
export function truncate(text: string, max = 18): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** Redondea a `digits` decimales sin dejar ceros a la derecha. */
export function roundTo(value: number, digits = 1): number {
  return Number(value.toFixed(digits))
}
