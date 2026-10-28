/** Estados posibles de un handshake (espejo del backend). */
export type HandshakeStatus = 'pending' | 'completed' | 'timeout' | 'failed'

export interface HandshakeActivity {
  activeMs?: number
  inactiveMs?: number
  running?: boolean
  activityStatus?: string
  clockedIn?: boolean
  networkType?: string
  capturedAt?: string
  [key: string]: unknown
}

/** Respuesta de POST /handshakes/ping (prueba de conexión, sin captura). */
export interface PingResult {
  ok: boolean
  pingId: string
  targetUserId: string
  deviceId: string
  rttMs: number
}

/** Vista de un handshake tal como la devuelve el backend. */
export interface HandshakeView {
  id: string
  status: HandshakeStatus
  targetUserId: string
  targetName: string | null
  targetDeviceId: string | null
  requestedById: string
  requestedByName: string | null
  requestedAt: string
  respondedAt: string | null
  latencyMs: number | null
  employeeNumber: string | null
  imageKey: string | null
  thumbKey: string | null
  activity: HandshakeActivity | null
  error: string | null
}
