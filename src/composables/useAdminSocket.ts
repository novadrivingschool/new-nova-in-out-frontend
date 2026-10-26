// src/composables/useAdminSocket.ts
//
// Un WebSocket por navegador/admin hacia el namespace /realtime. Singleton:
// todas las vistas comparten la misma conexión y el mismo estado.
// El servidor solo acepta tokens con rol admin/super_admin y mete el socket
// en la sala `admin:{userId}`, donde llegan los resultados de los handshakes.
import { readonly, ref } from 'vue'
import { io, type Socket } from 'socket.io-client'
import { ensureFreshAccessToken } from '@/lib/http'

export type RealtimeStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'error'

const API_BASE = (import.meta.env.VITE_API_AUTH_URL || 'http://localhost:5013').replace(/\/+$/, '')
const LS_ACCESS = 'novaio_accessToken'
/** Reintentos manuales tras un cierre iniciado por el servidor (token/rol inválido). */
const MAX_SERVER_RETRIES = 5

const status = ref<RealtimeStatus>('idle')
const lastError = ref('')
const connectedAt = ref<number | null>(null)

let socket: Socket | null = null
let serverRetries = 0
let retryTimer: ReturnType<typeof setTimeout> | null = null
const listeners = new Map<string, Set<(payload: any) => void>>()

async function freshToken(): Promise<string> {
  try {
    return await ensureFreshAccessToken()
  } catch {
    return localStorage.getItem(LS_ACCESS) ?? ''
  }
}

function connect(): void {
  if (socket) return
  status.value = 'connecting'
  lastError.value = ''

  socket = io(`${API_BASE}/realtime`, {
    path: '/socket.io',
    transports: ['websocket'],
    withCredentials: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // Se evalúa en cada (re)conexión: siempre token vigente.
    auth: (cb) => {
      void freshToken().then((token) => cb({ token }))
    },
  })

  // El ack `connected` solo llega si el servidor validó token y rol: es la
  // confirmación real de que "todo está bien" (el evento `connect` no basta).
  socket.on('connected', () => {
    status.value = 'connected'
    connectedAt.value = Date.now()
    lastError.value = ''
    serverRetries = 0
  })

  socket.on('connect_error', (err: Error) => {
    status.value = 'error'
    lastError.value = err?.message || 'No se pudo conectar'
  })

  socket.on('disconnect', (reason: string) => {
    connectedAt.value = null
    if (reason === 'io client disconnect') {
      status.value = 'idle'
      return
    }
    status.value = 'reconnecting'
    lastError.value = reason

    // El servidor nos cerró (token vencido, rol…): socket.io NO reintenta solo.
    if (reason === 'io server disconnect') {
      if (serverRetries >= MAX_SERVER_RETRIES) {
        status.value = 'error'
        lastError.value = 'El servidor rechazó la conexión (sesión o rol). Vuelve a iniciar sesión.'
        return
      }
      serverRetries += 1
      retryTimer = setTimeout(() => socket?.connect(), 1500 * serverRetries)
    }
  })

  socket.io.on('reconnect_attempt', () => {
    status.value = 'reconnecting'
  })

  socket.onAny((event: string, payload: unknown) => {
    listeners.get(event)?.forEach((fn) => {
      try {
        fn(payload)
      } catch (e) {
        console.error('[admin-socket] listener error', event, e)
      }
    })
  })
}

function disconnect(): void {
  if (retryTimer) clearTimeout(retryTimer)
  retryTimer = null
  serverRetries = 0
  try {
    socket?.removeAllListeners()
    socket?.disconnect()
  } finally {
    socket = null
    connectedAt.value = null
    status.value = 'idle'
    lastError.value = ''
  }
}

/** Suscribe a un evento del servidor; devuelve la función para cancelar. */
function on<T = unknown>(event: string, fn: (payload: T) => void): () => void {
  if (!listeners.has(event)) listeners.set(event, new Set())
  listeners.get(event)!.add(fn as (payload: any) => void)
  return () => listeners.get(event)?.delete(fn as (payload: any) => void)
}

export function useAdminSocket() {
  return {
    status: readonly(status),
    lastError: readonly(lastError),
    connectedAt: readonly(connectedAt),
    connect,
    disconnect,
    on,
  }
}
