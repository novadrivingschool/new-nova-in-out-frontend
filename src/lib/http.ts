// src/lib/http.ts
import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios"

const LS_ACCESS = "novaio_accessToken"
const LS_REFRESH = "novaio_refreshToken"
const API_BASE = import.meta.env.VITE_AUTH_API_URL || "http://localhost:5013"

const log = (...a: any[]) => console.log("[HTTP]", ...a)

/** Emitir eventos para que la UI/Store escuche (opcional) */
function publish(name: string, detail: any) {
  try { window.dispatchEvent(new CustomEvent(name, { detail })) } catch { }
}

export const http = axios.create({ baseURL: API_BASE, withCredentials: false })

/* =========================
 *  LocalStorage helpers
 * ========================= */
function getAccessToken() { const v = localStorage.getItem(LS_ACCESS); log("getAccessToken()", v ? "OK" : "NULL"); return v }
function getRefreshToken() { const v = localStorage.getItem(LS_REFRESH); log("getRefreshToken()", v ? "OK" : "NULL"); return v }

export function setAuthTokens(accessToken: string, refreshToken: string) {
  log("setAuthTokens() START")
  localStorage.setItem(LS_ACCESS, accessToken)
  localStorage.setItem(LS_REFRESH, refreshToken)
  log("setAuthTokens() END", { hasAT: !!localStorage.getItem(LS_ACCESS), hasRT: !!localStorage.getItem(LS_REFRESH) })
  publish("auth:tokens-rotated", { accessToken, refreshToken })
}

/* =========================
 *  Exp helpers
 * ========================= */
function decodeExp(tok?: string | null) {
  try { if (!tok) return 0; const [, b64] = tok.split("."); const json = JSON.parse(atob(b64)); return (json?.exp || 0) * 1000 } catch { return 0 }
}
function isExpired(tok?: string | null, skew = 15_000) { const exp = decodeExp(tok); return !exp || Date.now() + skew >= exp }

/* =========================
 *  Explicación de fallas
 * ========================= */
function explainRefreshFailure(status?: number, serverMessage?: any) {
  // Mensaje amigable para UI / logs
  if (status === 401) {
    return serverMessage
      ? `Refresh 401: ${String(serverMessage)}. Posible colisión WEB/ELECTRON: otra sesión rotó o revocó tu refresh.`
      : "Refresh 401: refresh token inválido o no encontrado. Posible colisión WEB/ELECTRON.";
  }
  return `Refresh falló (${status ?? "?"}): ${serverMessage ?? "motivo desconocido"}`;
}

/* =========================
 *  Refresh (POST /auth/refresh)
 *  — ENRIQUECE el error con code/status/serverMessage
 * ========================= */
async function refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
  const rt = getRefreshToken()
  if (!rt) {
    const e: any = new Error("NO_REFRESH_TOKEN")
    e.code = "NO_REFRESH_TOKEN"
    log("refreshTokens() → NO_REFRESH_TOKEN")
    publish("auth:refresh-failed", { code: e.code, msg: "No hay refresh token en este origin." })
    throw e
  }

  log("refreshTokens() POST /auth/refresh")
  try {
    const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken: rt }, {
      headers: { "Content-Type": "application/json" },
    })
    const at = data?.accessToken, newRt = data?.refreshToken
    log("refreshTokens() response", { hasAT: !!at, hasRT: !!newRt })
    if (!at || !newRt) {
      const e: any = new Error("BAD_REFRESH_RESPONSE")
      e.code = "BAD_REFRESH_RESPONSE"
      publish("auth:refresh-failed", { code: e.code, msg: "El backend no devolvió access/refresh." })
      throw e
    }
    setAuthTokens(at, newRt)
    return { accessToken: at, refreshToken: newRt }
  } catch (err: any) {
    const status = err?.response?.status
    const serverMessage = err?.response?.data?.message ?? err?.response?.data?.error ?? err?.message
    const msg = explainRefreshFailure(status, serverMessage)
    log("refreshTokens() FAILED ⇒", { status, serverMessage: serverMessage ?? null, msg })

    const e: any = new Error(msg)
    e.code = status === 401 ? "REFRESH_401" : "REFRESH_FAILED"
    e.status = status
    e.serverMessage = serverMessage
    publish("auth:refresh-failed", { code: e.code, status, serverMessage, msg })
    throw e
  }
}

/* =========================
 *  Preflight antes de cada request
 * ========================= */
async function tryPreflightRefresh(): Promise<void> {
  const at = getAccessToken(), rt = getRefreshToken()
  if (!at && rt) { log("REQUEST preflight: AT missing; refreshing with RT…"); await refreshTokens(); return }
  if (at && isExpired(at) && rt) { log("REQUEST preflight: AT near expiry; refreshing with RT…"); await refreshTokens() }
}

/** Para forzar desde la UI cuando quieras */
export async function ensureFreshAccessToken(): Promise<string> {
  await tryPreflightRefresh()
  const latest = getAccessToken()
  if (!latest) {
    const e: any = new Error("NO_ACCESS_TOKEN_AFTER_PREFLIGHT")
    e.code = "NO_ACCESS_TOKEN_AFTER_PREFLIGHT"
    throw e
  }
  return latest
}

/* =========================
 *  Cola para reintentos si cae 401
 * ========================= */
let isRefreshing = false
type Queued = { resolve: (v: any) => void; reject: (e?: any) => void; original: AxiosRequestConfig & { _retry?: boolean } }
let queue: Queued[] = []

const enqueue = (original: any) => new Promise((resolve, reject) => { log("enqueue retry", original?.url); queue.push({ resolve, reject, original }) })
const flush = (err: any, newAT?: string) => {
  log("flush queue", { count: queue.length, err: !!err, hasNewAT: !!newAT })
  const pending = queue; queue = []
  for (const { resolve, reject, original } of pending) {
    if (err) reject(err)
    else {
      original.headers = original.headers || {}
      if (newAT) (original.headers as any).Authorization = `Bearer ${newAT}`
      resolve(http(original))
    }
  }
}

/* =========================
 *  Interceptor REQUEST
 * ========================= */
http.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try { await tryPreflightRefresh() } catch (e: any) { log("REQUEST preflight refresh failed (soft):", e?.code || e?.message) }
    const latestAT = getAccessToken()
    config.headers = config.headers || {}
    if (latestAT) { (config.headers as any).Authorization = `Bearer ${latestAT}`; log("REQUEST", (config.method || "get").toUpperCase(), config.url, "→ with AT") }
    else { delete (config.headers as any).Authorization; log("REQUEST", (config.method || "get").toUpperCase(), config.url, "→ NO AT") }
    return config
  }
)

/* =========================
 *  Interceptor RESPONSE (401 → refresh → retry)
 * ========================= */
http.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined
    const status = error.response?.status
    const url = (original?.url || "").toString()
    const isAuth = url.includes("/auth/login") || url.includes("/auth/refresh") || url.includes("/auth/logout")
    log("RESPONSE ERROR", { status, url, isAuth, retried: (original as any)?._retry })

    if (status !== 401 || isAuth || !original) {
      log("→ not handled by refresh; rethrow")
      return Promise.reject(error)
    }
    if ((original as any)._retry) {
      log("→ already retried; rethrow")
      return Promise.reject(error)
    }
    (original as any)._retry = true

    try {
      if (isRefreshing) { log("→ isRefreshing=true, enqueuing"); return await enqueue(original) }
      isRefreshing = true
      const { accessToken } = await refreshTokens()
      isRefreshing = false
      flush(null, accessToken)
      original.headers = original.headers || {}
        ; (original.headers as any).Authorization = `Bearer ${accessToken}`
      log("→ retry original with new AT", original.url)
      return http(original)
    } catch (e: any) {
      isRefreshing = false
      flush(e)
      log("refresh FAILED (response interceptor)", { code: e?.code, status: e?.status, msg: e?.message })
      // ⚠️ No tocamos LocalStorage aquí; deja a la store/UX decidir qué hacer.
      return Promise.reject(e)
    }
  }
)
