// Modo NIO + Activity Report: comprueba que la app NIO corre en ESTE equipo hablándole por
// 127.0.0.1 (la app Electron abre un servidor local, ver local-handshake-server.js) y que, ante
// el backend, es del mismo usuario y tiene el socket activo.
import { http } from '@/lib/http'
import { toRemoteClockError } from '@/services/remoteClock.service'
import type { RemoteClockError } from '@/types/remoteClock'

const PORT_START = 47800
const PORT_END = 47810
// Mayor que el timeout del servidor local (4 s): si la app tarda, responde ella con un código
// en lugar de que la web aborte antes y lo tome como "no hay app".
const PROBE_TIMEOUT_MS = 6000

let lastPort: number | null = null

interface LocalReply {
  ok: boolean
  code?: string
  app_version?: string
}

async function postLocal(port: number, nonce: string, timeoutMs: number): Promise<LocalReply | null> {
  const ctl = new AbortController()
  const timer = setTimeout(() => ctl.abort(), timeoutMs)
  try {
    const res = await fetch(`http://127.0.0.1:${port}/nio/handshake`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nonce }),
      signal: ctl.signal,
    })
    const body = (await res.json()) as LocalReply
    return typeof body?.ok === 'boolean' ? body : null // algo que no es nuestra app
  } catch {
    return null // puerto cerrado, bloqueado o sin respuesta
  } finally {
    clearTimeout(timer)
  }
}

/** Entrega el nonce a la app local. null = ninguna app NIO respondió en este equipo. */
async function deliver(nonce: string): Promise<LocalReply | null> {
  const ports: number[] = []
  if (lastPort) ports.push(lastPort)
  for (let p = PORT_START; p <= PORT_END; p++) if (p !== lastPort) ports.push(p)
  for (const port of ports) {
    // Un puerto cerrado responde al instante; el de la app puede tardar (canjea el nonce en el
    // backend), por eso todos usan el mismo timeout largo.
    const reply = await postLocal(port, nonce, PROBE_TIMEOUT_MS)
    if (reply) {
      lastPort = port
      return reply
    }
  }
  lastPort = null
  return null
}

const MESSAGES: Record<string, string> = {
  DESKTOP_APP_NOT_LOCAL: 'We cannot detect the NIO app open on this computer. Open it on this computer.',
  DESKTOP_APP_OTHER_USER: 'The NIO app open on this computer belongs to another user.',
  DESKTOP_APP_REQUIRED: 'The NIO app on this computer is disconnected. Wait a few seconds or restart it.',
  HANDSHAKE_INVALID: 'Could not verify your NIO app. Try again.',
}
MESSAGES.DESKTOP_APP_NO_SESSION = 'The NIO app is open on this computer but no one is signed in. Sign in on the NIO app.'
MESSAGES.DESKTOP_APP_NOT_VERIFIED =
  'The NIO app on this computer could not complete the verification. Try again in a few seconds.'
MESSAGES.DESKTOP_APP_ORIGIN = 'The NIO app does not accept requests from this website. Contact IT.'
export const localAppMessage = (code?: string) => MESSAGES[code ?? ''] ?? MESSAGES.HANDSHAKE_INVALID

/** La app respondió pero NO canjeó el nonce: se explica por qué en vez de decir "no hay app". */
function failureOf(reply: LocalReply): { code: string; message: string } {
  const code =
    reply.code === 'NO_SESSION'
      ? 'DESKTOP_APP_NO_SESSION'
      : reply.code === 'ORIGIN_NOT_ALLOWED'
        ? 'DESKTOP_APP_ORIGIN'
        : 'DESKTOP_APP_NOT_VERIFIED'
  return { code, message: localAppMessage(code) }
}

export interface LocalCheck {
  ok: boolean
  code?: string
  message?: string
}

export const localAppService = {
  /** Verificación para pintar el estado en pantalla (las 3 validaciones; consume su nonce). */
  async check(): Promise<LocalCheck> {
    try {
      const { data } = await http.post<{ nonce: string }>('/remote-clock/handshake')
      const reply = await deliver(data.nonce)
      if (!reply) return { ok: false, code: 'DESKTOP_APP_NOT_LOCAL', message: localAppMessage('DESKTOP_APP_NOT_LOCAL') }
      if (!reply.ok) return { ok: false, ...failureOf(reply) }
      const res = await http.post<{ ok: boolean; code?: string }>('/remote-clock/handshake/check', { nonce: data.nonce })
      return res.data.ok
        ? { ok: true }
        : { ok: false, code: res.data.code, message: localAppMessage(res.data.code) }
    } catch (e) {
      const err = toRemoteClockError(e)
      return { ok: false, code: err.code ?? 'HANDSHAKE_INVALID', message: err.message }
    }
  },

  /**
   * Nonce fresco para un Clock In / Out. El backend lo verifica de nuevo (es lo que decide);
   * aquí solo se evita la llamada si ya se sabe que no hay app local.
   */
  async prepareClockNonce(): Promise<string> {
    try {
      const { data } = await http.post<{ nonce: string }>('/remote-clock/handshake')
      const reply = await deliver(data.nonce)
      if (!reply) {
        throw { status: 409, code: 'DESKTOP_APP_NOT_LOCAL', message: localAppMessage('DESKTOP_APP_NOT_LOCAL') } as RemoteClockError
      }
      if (!reply.ok) throw { status: 409, ...failureOf(reply) } as RemoteClockError
      return data.nonce
    } catch (e) {
      if (String((e as RemoteClockError)?.code ?? '').startsWith('DESKTOP_APP_')) throw e
      throw toRemoteClockError(e)
    }
  },
}
