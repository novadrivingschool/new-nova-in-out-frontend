/**
 * src/composables/useAppTheme.ts
 *
 * Control del tema claro/oscuro.
 *
 * Precedencia al arrancar:
 *   1. Preferencia guardada por el usuario (localStorage).
 *   2. Preferencia del sistema operativo (`prefers-color-scheme`).
 *   3. Claro.
 *
 * Mientras el usuario no elija explícitamente, la app sigue al sistema en
 * tiempo real: si el SO cambia a oscuro al anochecer, la app también.
 * En cuanto elige, esa decisión manda y el seguimiento se desactiva.
 */
import { computed, readonly, ref } from 'vue'
import { useTheme } from 'vuetify'

export type AppThemeName = 'light' | 'dark'
export type AppThemePreference = AppThemeName | 'system'

const STORAGE_KEY = 'app-theme'

/** Clase en <html> que anula las transiciones CSS mientras se cambia de tema. */
const SWITCHING_CLASS = 'theme-switching'

/** Estado compartido por todas las instancias del composable. */
const preference = ref<AppThemePreference>('system')
let initialized = false

function readStoredPreference(): AppThemePreference {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'light' || raw === 'dark' || raw === 'system') return raw
  } catch {
    // Modo privado o storage bloqueado: se cae a la preferencia del sistema.
  }
  return 'system'
}

function persistPreference(value: AppThemePreference): void {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // Sin persistencia el tema simplemente no sobrevive al recargar.
  }
}

function systemPrefersDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  )
}

function resolve(pref: AppThemePreference): AppThemeName {
  if (pref === 'system') return systemPrefersDark() ? 'dark' : 'light'
  return pref
}

/**
 * Ejecuta el cambio de tema sin transiciones CSS. Al cambiar la clase
 * `v-theme--*`, cientos de elementos animarían `color`, `border-*` y
 * `scrollbar-color` a la vez (80–250 ms), lo que además de verse como un
 * "fundido" lento multiplica los recálculos de estilo por frame. La clase se
 * retira tras dos frames, cuando el tema nuevo ya se pintó.
 */
function withoutTransitions(change: () => void): void {
  if (typeof document === 'undefined') {
    change()
    return
  }
  const root = document.documentElement
  root.classList.add(SWITCHING_CLASS)
  change()
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.remove(SWITCHING_CLASS)),
  )
}

export function useAppTheme() {
  const theme = useTheme()

  /** Escribe el tema en Vuetify y sincroniza `color-scheme` del documento. */
  const apply = (name: AppThemeName): void => {
    withoutTransitions(() => {
      theme.global.name.value = name
      if (typeof document !== 'undefined') {
        // Hace que los controles nativos (scrollbars, inputs de fecha) sigan el tema
        document.documentElement.style.colorScheme = name
      }
    })
  }

  /**
   * Arranque. Idempotente: sólo el primer consumidor inicializa y engancha el
   * listener del sistema, aunque el composable se use en varios componentes.
   */
  const init = (): void => {
    if (initialized) return
    initialized = true

    preference.value = readStoredPreference()
    apply(resolve(preference.value))

    if (typeof window === 'undefined' || !window.matchMedia) return

    const media = window.matchMedia('(prefers-color-scheme: dark)')

    // El listener se registra a nivel de módulo y no se libera con
    // `onScopeDispose`: quedaría atado al scope del primer componente que
    // llamase a `init()`, y al desmontarse ese componente el seguimiento del
    // sistema moriría para toda la aplicación. Vive lo que vive la pestaña.
    media.addEventListener('change', (event) => {
      // Sólo seguimos al sistema si el usuario no ha elegido manualmente.
      if (preference.value !== 'system') return
      apply(event.matches ? 'dark' : 'light')
    })
  }

  /** Fija una preferencia explícita (o vuelve a seguir al sistema). */
  const setPreference = (value: AppThemePreference): void => {
    preference.value = value
    persistPreference(value)
    apply(resolve(value))
  }

  const current = computed<AppThemeName>(() =>
    theme.global.name.value === 'dark' ? 'dark' : 'light',
  )

  const isDark = computed<boolean>({
    get: () => current.value === 'dark',
    set: (value) => setPreference(value ? 'dark' : 'light'),
  })

  const toggle = (): void => {
    isDark.value = !isDark.value
  }

  return {
    /** Tema activo tal y como lo está renderizando Vuetify. */
    current,
    /** Preferencia elegida por el usuario ('system' si no ha elegido). */
    preference: readonly(preference),
    isDark,
    init,
    toggle,
    setPreference,
    /** Icono y etiqueta listos para un botón de alternancia. */
    icon: computed(() =>
      current.value === 'dark'
        ? 'mdi-weather-night'
        : 'mdi-white-balance-sunny',
    ),
    label: computed(() =>
      current.value === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
    ),
  }
}
