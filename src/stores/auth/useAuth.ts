// src/stores/auth/useAuth.ts
import { defineStore } from 'pinia'
import { http, ensureFreshAccessToken } from '@/lib/http'
import type { AuthResponseDto, LoginRequest, UserDto } from '@/types/auth'

const LS_ACCESS_KEY = 'novaio_accessToken'
const LS_REFRESH_KEY = 'novaio_refreshToken'
const LS_USER_KEY = 'novaio_user'
const slog = (...a: any[]) => console.log('[AUTH]', ...a)

export const useAuth = defineStore('auth', {
    state: () => ({
        user: null as UserDto | null,
        accessToken: (localStorage.getItem(LS_ACCESS_KEY) || null) as string | null,
        refreshToken: (localStorage.getItem(LS_REFRESH_KEY) || null) as string | null,
        loading: false,
        error: null as string | null,
    }),

    getters: { isLogged: (s) => !!s.accessToken && !!s.refreshToken },

    actions: {
        init() {
            slog('init()')
            try { this.user = JSON.parse(localStorage.getItem(LS_USER_KEY) || 'null') } catch { this.user = null }
            this.accessToken = localStorage.getItem(LS_ACCESS_KEY)
            this.refreshToken = localStorage.getItem(LS_REFRESH_KEY)

            // tokens rotados desde http.ts
            window.addEventListener('auth:tokens-rotated', (ev: any) => {
                const { accessToken, refreshToken } = ev?.detail || {}
                if (accessToken && refreshToken) {
                    slog('event auth:tokens-rotated → update store')
                    this.setTokens(accessToken, refreshToken)
                }
            })

            // refresh falló (401, etc.)
            window.addEventListener('auth:refresh-failed', (ev: any) => {
                const d = ev?.detail
                slog('event auth:refresh-failed', d)
                this.error = d?.msg || 'Refresh falló'
            })

            // sync multi-tab
            window.addEventListener('storage', (e) => {
                if (e.key === LS_ACCESS_KEY) this.accessToken = e.newValue
                if (e.key === LS_REFRESH_KEY) this.refreshToken = e.newValue
                if (e.key === LS_USER_KEY) {
                    try { this.user = e.newValue ? JSON.parse(e.newValue) : null } catch { this.user = null }
                }
            })
        },

        async refreshNow() {
            slog('refreshNow() → ensureFreshAccessToken')
            await ensureFreshAccessToken()
            this.accessToken = localStorage.getItem(LS_ACCESS_KEY)
            this.refreshToken = localStorage.getItem(LS_REFRESH_KEY)
        },

        setTokens(access: string, refresh: string) {
            slog('setTokens()', { accessLen: access?.length, refreshLen: refresh?.length })
            this.accessToken = access
            this.refreshToken = refresh
            try { localStorage.setItem(LS_ACCESS_KEY, access) } catch { }
            try { localStorage.setItem(LS_REFRESH_KEY, refresh) } catch { }
            ; (http.defaults.headers as any).common = (http.defaults.headers as any).common || {}
            http.defaults.headers.common.Authorization = `Bearer ${access}`
        },

        setUser(user: UserDto | null) {
            slog('setUser()', { hasUser: !!user })
            this.user = user
            try { user ? localStorage.setItem(LS_USER_KEY, JSON.stringify(user)) : localStorage.removeItem(LS_USER_KEY) } catch { }
        },

        async login(email: string, password: string) {
            this.loading = true; this.error = null
            slog('login START', { email })
            try {
                const body: LoginRequest = { email, password }
                const { data } = await http.post<AuthResponseDto>('/auth/login', body)
                this.setUser(data.user)
                this.setTokens(data.tokens.accessToken, data.tokens.refreshToken)
                slog('login END OK')
                return true
            } catch (e: any) {
                this.error = e?.response?.data?.message || 'Login failed'
                slog('login ERROR', { message: this.error })
                // No borramos todo por un intento fallido.
                return false
            } finally { this.loading = false }
        },

        async logout() {
            slog('logout START')
            try { await http.post('/auth/logout') } catch (e) { slog('logout server error (ignored)', e) }
            this._clearClientSide()
            slog('logout END')
        },

        _clearClientSide() {
            slog('_clearClientSide()')
            this.user = null
            this.accessToken = null
            this.refreshToken = null
            try { localStorage.removeItem(LS_ACCESS_KEY) } catch { }
            try { localStorage.removeItem(LS_REFRESH_KEY) } catch { }
            try { localStorage.removeItem(LS_USER_KEY) } catch { }
            try { delete (http.defaults.headers as any)?.common?.Authorization } catch { }
        },
    },
})
