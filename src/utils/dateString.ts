/**
 * src/utils/dateString.ts
 *
 * Conversión entre `Date` y cadenas `YYYY-MM-DD` en hora LOCAL.
 *
 * No se usa `toISOString()` a propósito: convierte a UTC y, pasadas las 18:00
 * en México/Chicago, devuelve el día siguiente.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** `Date` -> `YYYY-MM-DD` usando la fecha local. */
export function formatDateString(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

/**
 * `YYYY-MM-DD` -> `Date` a medianoche local, o `null` si el formato es inválido
 * o la fecha no existe (p. ej. `2026-02-31`).
 */
export function parseDateString(value: string): Date | null {
  if (!DATE_RE.test(value)) return null

  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  const isSameDay =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day

  return isSameDay ? date : null
}
