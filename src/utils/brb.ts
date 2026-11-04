/**
 * Be right back (BRB): cada evento tiene una tolerancia (por evento, no acumulada). Hasta la tolerancia
 * no impacta el performance; los segundos que la exceden cuentan como tiempo inactivo.
 * El valor vigente lo informa el backend (`brbToleranceSec` / `brbToleranceSeconds`); este es el respaldo.
 */
export const BRB_TOLERANCE_FALLBACK_SEC = 600

/** Tolerancia vigente (s): la del backend si es válida, si no el respaldo. */
export function brbToleranceOf(fromBackend?: number | null): number {
  return typeof fromBackend === 'number' && Number.isFinite(fromBackend) && fromBackend > 0
    ? fromBackend
    : BRB_TOLERANCE_FALLBACK_SEC
}

/** Segundos de un BRB que exceden su tolerancia (impactan el performance). */
export function brbOverSeconds(seconds: number, tolerance?: number | null): number {
  return Math.max(0, seconds - brbToleranceOf(tolerance))
}

/** true si el BRB ya pasó su tolerancia (estado crítico). */
export function isBrbCritical(seconds: number, tolerance?: number | null): boolean {
  return seconds > brbToleranceOf(tolerance)
}

/** '10 min' / '90 s' para mensajes. */
export function brbToleranceLabel(tolerance?: number | null): string {
  const t = brbToleranceOf(tolerance)
  return t % 60 === 0 ? `${t / 60} min` : `${t} s`
}
