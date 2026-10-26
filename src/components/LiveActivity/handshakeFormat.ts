import type { HandshakeStatus } from '@/types/handshake'

export const STATUS_LABEL: Record<HandshakeStatus, string> = {
  pending: 'Waiting',
  completed: 'Completed',
  timeout: 'No response',
  failed: 'Failed',
}

export const STATUS_COLOR: Record<HandshakeStatus, string> = {
  pending: 'info',
  completed: 'success',
  timeout: 'warning',
  failed: 'error',
}

/** ms → `m:ss` (o `h:mm:ss` si pasa de una hora). */
export function formatDuration(ms?: number | null): string {
  if (ms === undefined || ms === null || Number.isNaN(ms)) return '—'
  const total = Math.max(0, Math.round(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString()
}

/** Tiempo de respuesta en segundos con un decimal. */
export function formatLatency(ms?: number | null): string {
  return ms === null || ms === undefined ? '—' : `${(ms / 1000).toFixed(1)} s`
}
