// src/stores/auth/useAuth.ts
import { defineStore } from "pinia";
import { http, ensureFreshAccessToken } from "@/lib/http";
import type { AuthResponseDto, LoginWebRequest, UserDto } from "@/types/auth";
import router from "@/router";
import { formatDateString } from "@/utils/dateString";
import type { ViewKey } from "@/config/views";

const LS_ACCESS_KEY = "novaio_accessToken";
const LS_REFRESH_KEY = "novaio_refreshToken";
const LS_USER_KEY = "novaio_user";
/** Día calendario local (YYYY-MM-DD) en que se introdujeron las credenciales. */
const LS_LOGIN_DAY_KEY = "novaio_loginDay";
/** Cada cuánto se revisa si cambió el día con la pestaña abierta. */
const SESSION_CHECK_MS = 60_000;
/** Cada cuánto se vuelve a leer roles y vistas permitidas desde la auth API. */
const ME_TTL_MS = 60_000;
const slog = (...a: any[]) => console.log("[AUTH]", ...a);

export const useAuth = defineStore("auth", {
  state: () => ({
    user: null as UserDto | null,
    accessToken: (localStorage.getItem(LS_ACCESS_KEY) || null) as string | null,
    refreshToken: (localStorage.getItem(LS_REFRESH_KEY) || null) as
      | string
      | null,
    loginDay: (localStorage.getItem(LS_LOGIN_DAY_KEY) || null) as string | null,
    loading: false,
    error: null as string | null,
    /** Última lectura de /auth/me (ms). No se persiste. */
    lastMeAt: 0,
  }),

  getters: {
    isLogged: (s) => !!s.accessToken && !!s.refreshToken,
    token: (s) => s.accessToken,
    isSuperAdmin: (s) => !!s.user?.roles?.includes("super_admin"),
    /** Solo las vistas otorgadas, también para super_admin (Permissions es la única que va por rol). */
    canView: (s) => (view: ViewKey) => !!s.user?.viewPermissions?.includes(view),
  },

  actions: {
    init() {
      slog("init()");
      try {
        this.user = JSON.parse(localStorage.getItem(LS_USER_KEY) || "null");
      } catch {
        this.user = null;
      }
      this.accessToken = localStorage.getItem(LS_ACCESS_KEY);
      this.refreshToken = localStorage.getItem(LS_REFRESH_KEY);
      this.loginDay = localStorage.getItem(LS_LOGIN_DAY_KEY);

      // tokens rotados desde http.ts
      window.addEventListener("auth:tokens-rotated", (ev: any) => {
        const { accessToken, refreshToken } = ev?.detail || {};
        if (accessToken && refreshToken) {
          slog("event auth:tokens-rotated → update store");
          this.setTokens(accessToken, refreshToken);
        }
      });

      // refresh falló (401, etc.) → limpiar sesión y redirigir al login
      window.addEventListener("auth:refresh-failed", (ev: any) => {
        const d = ev?.detail;
        slog("event auth:refresh-failed", d);
        this.error = d?.msg || "Refresh falló";
        this._clearClientSide();
        router.replace("/");
      });

      // sync multi-tab
      window.addEventListener("storage", (e) => {
        if (e.key === LS_ACCESS_KEY) this.accessToken = e.newValue;
        if (e.key === LS_REFRESH_KEY) this.refreshToken = e.newValue;
        if (e.key === LS_LOGIN_DAY_KEY) this.loginDay = e.newValue;
        if (e.key === LS_USER_KEY) {
          try {
            this.user = e.newValue ? JSON.parse(e.newValue) : null;
          } catch {
            this.user = null;
          }
        }
      });

      // Login diario con la pestaña abierta: los timers se frenan en pestañas
      // ocultas, por eso también se revisa al volver a verla.
      const check = () => void this.enforceDailyLogin();
      document.addEventListener("visibilitychange", () => {
        if (!document.hidden) check();
      });
      window.setInterval(check, SESSION_CHECK_MS);
    },

    async refreshNow() {
      slog("refreshNow() → ensureFreshAccessToken");
      await ensureFreshAccessToken();
      this.accessToken = localStorage.getItem(LS_ACCESS_KEY);
      this.refreshToken = localStorage.getItem(LS_REFRESH_KEY);
    },

    setTokens(access: string, refresh: string) {
      slog("setTokens()", {
        accessLen: access?.length,
        refreshLen: refresh?.length,
      });
      this.accessToken = access;
      this.refreshToken = refresh;
      try {
        localStorage.setItem(LS_ACCESS_KEY, access);
      } catch {}
      try {
        localStorage.setItem(LS_REFRESH_KEY, refresh);
      } catch {}
      (http.defaults.headers as any).common =
        (http.defaults.headers as any).common || {};
      http.defaults.headers.common.Authorization = `Bearer ${access}`;
    },

    /**
     * Re-lee roles y vistas permitidas. Los servidores validan en cada request; esto solo
     * mantiene menú y rutas al día cuando un super_admin cambia permisos con la sesión abierta.
     * Si falla, se conserva lo que ya había.
     */
    async refreshMe(force = false) {
      if (!this.accessToken || !this.user) return;
      if (!force && Date.now() - this.lastMeAt < ME_TTL_MS) return;
      this.lastMeAt = Date.now();
      try {
        const { data } = await http.get<{
          roles?: string[];
          isActive?: boolean;
          viewPermissions?: string[];
        }>("/auth/me");
        if (!this.user) return;
        this.setUser({
          ...this.user,
          roles: data.roles ?? this.user.roles,
          isActive: data.isActive ?? this.user.isActive,
          viewPermissions: data.viewPermissions ?? [],
        });
      } catch (e) {
        slog("refreshMe error (ignored)", e);
      }
    },

    setLoginDay(day: string | null) {
      this.loginDay = day;
      try {
        day
          ? localStorage.setItem(LS_LOGIN_DAY_KEY, day)
          : localStorage.removeItem(LS_LOGIN_DAY_KEY);
      } catch {}
    },

    /**
     * Hay credenciales guardadas pero el login no es de hoy (o no consta, p. ej.
     * sesiones previas a esta regla): hay que volver a iniciar sesión aunque el
     * token siga siendo válido.
     */
    isSessionStale(): boolean {
      if (!this.accessToken && !this.refreshToken) return false;
      return this.loginDay !== formatDateString(new Date());
    },

    /**
     * Cierra la sesión por cambio de día. Solo limpia el cliente: NO llama a
     * `/auth/logout`, porque el logout web borra el refresh token del USUARIO
     * (hay un único hash por usuario) e invalidaría otras sesiones web suyas,
     * incluida una recién iniciada. El siguiente login ya sobrescribe ese hash.
     */
    async expireSession(): Promise<void> {
      slog("expireSession() → login diario requerido");
      this._clearClientSide();
    },

    /** Para pestañas que llevan abiertas desde ayer: cierra y manda al login. */
    async enforceDailyLogin() {
      if (!this.isSessionStale()) return;
      const current = router.currentRoute.value;
      await this.expireSession();
      if (!current.meta?.public) {
        router.replace({
          path: "/",
          query: { redirect: current.fullPath, reason: "daily" },
        });
      }
    },

    setUser(user: UserDto | null) {
      slog("setUser()", { hasUser: !!user });
      this.user = user;
      try {
        user
          ? localStorage.setItem(LS_USER_KEY, JSON.stringify(user))
          : localStorage.removeItem(LS_USER_KEY);
      } catch {}
    },

    /**
     * Login del front web: identifica por employee_number contra el endpoint
     * dedicado `/auth/login/web`. `/auth/login` queda reservado para Electron.
     */
    async login(employeeNumber: string, password: string) {
      this.loading = true;
      this.error = null;
      const normalized = employeeNumber.trim().toUpperCase();
      slog("login START", { employeeNumber: normalized });
      try {
        const body: LoginWebRequest = { employeeNumber: normalized, password };
        const { data } = await http.post<AuthResponseDto>(
          "/auth/login/web",
          body,
        );
        this.setUser(data.user);
        this.lastMeAt = Date.now();
        this.setLoginDay(formatDateString(new Date()));
        this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
        slog("login END OK");
        return true;
      } catch (e: any) {
        this.error = e?.response?.data?.message || "Login failed";
        slog("login ERROR", { message: this.error });
        // No borramos todo por un intento fallido.
        return false;
      } finally {
        this.loading = false;
      }
    },

    async logout() {
      slog("logout START");
      try {
        await http.post("/auth/logout");
      } catch (e) {
        slog("logout server error (ignored)", e);
      }
      this._clearClientSide();
      slog("logout END");
    },

    _clearClientSide() {
      slog("_clearClientSide()");
      this.user = null;
      this.accessToken = null;
      this.refreshToken = null;
      this.loginDay = null;
      this.lastMeAt = 0;
      try {
        localStorage.removeItem(LS_ACCESS_KEY);
      } catch {}
      try {
        localStorage.removeItem(LS_REFRESH_KEY);
      } catch {}
      try {
        localStorage.removeItem(LS_USER_KEY);
      } catch {}
      try {
        localStorage.removeItem(LS_LOGIN_DAY_KEY);
      } catch {}
      try {
        delete (http.defaults.headers as any)?.common?.Authorization;
      } catch {}
    },
  },
});
