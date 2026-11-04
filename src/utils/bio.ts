/**
 * Bio break: cada evento tiene una tolerancia (por evento, no acumulada), igual que el BRB pero con su propia
 * constante. Hasta la tolerancia no impacta el performance; los segundos que la exceden cuentan como tiempo
 * inactivo. El valor vigente lo informa el backend (`bioToleranceSec` / `bioToleranceSeconds`); este es el respaldo.
 */
export const BIO_TOLERANCE_FALLBACK_SEC = 600

/** Tolerancia vigente (s): la del backend si es válida, si no el respaldo. */
export function bioToleranceOf(fromBackend?: number | null): number {
  return typeof fromBackend === 'number' && Number.isFinite(fromBackend) && fromBackend > 0
    ? fromBackend
    : BIO_TOLERANCE_FALLBACK_SEC
}

/** Segundos de un bio break que exceden su tolerancia (impactan el performance). */
export function bioOverSeconds(seconds: number, tolerance?: number | null): number {
  return Math.max(0, seconds - bioToleranceOf(tolerance))
}

/** true si el bio break ya pasó su tolerancia (estado crítico). */
export function isBioCritical(seconds: number, tolerance?: number | null): boolean {
  return seconds > bioToleranceOf(tolerance)
}

/** '10 min' / '90 s' para mensajes. */
export function bioToleranceLabel(tolerance?: number | null): string {
  const t = bioToleranceOf(tolerance)
  return t % 60 === 0 ? `${t / 60} min` : `${t} s`
}
