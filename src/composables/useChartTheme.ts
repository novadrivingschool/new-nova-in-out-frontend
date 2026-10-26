/**
 * src/composables/useChartTheme.ts
 *
 * Tema común de las gráficas del dashboard (ApexCharts).
 *
 * Los colores de SERIE salen de una paleta categórica validada (claro y
 * oscuro por separado, cada modo contra su superficie): azul = serie
 * principal, aqua = segunda serie, gris = "resto"/contexto. El texto y los
 * fondos siguen el tema activo de Vuetify, de modo que el modo oscuro de la
 * app se refleja en las gráficas sin configuración extra.
 *
 * El aqua en modo claro queda bajo 3:1 de contraste: por eso toda gráfica que
 * lo usa lleva leyenda con valores y la tabla por empleado hace de vista
 * alternativa.
 */
import { computed, onScopeDispose, ref, watch } from 'vue'
import { useTheme } from 'vuetify'
import type { ApexOptions } from 'apexcharts'

const SERIES = {
  light: { primary: '#2a78d6', secondary: '#1baf7a', neutral: '#a9a8a0' },
  dark: { primary: '#3987e5', secondary: '#199e70', neutral: '#7a7974' },
} as const

const CHROME = {
  light: { grid: '#e1e0d9', ink: '#0b0b0b' },
  dark: { grid: '#2c2c2a', ink: '#f0efec' },
} as const

type PlainObject = Record<string, unknown>

const isPlainObject = (value: unknown): value is PlainObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/**
 * Mezcla profunda de opciones; los arrays y los valores primitivos del segundo
 * ganan. `extra` se tipa como objeto libre porque ApexOptions es una interfaz
 * (sin firma de índice) y no encaja en `Record<string, unknown>`.
 */
export function mergeOptions(
  base: ApexOptions,
  extra: Record<string, unknown>,
): ApexOptions {
  const merge = (a: PlainObject, b: PlainObject): PlainObject => {
    const result: PlainObject = { ...a }
    for (const [key, value] of Object.entries(b)) {
      const current = result[key]
      result[key] =
        isPlainObject(current) && isPlainObject(value)
          ? merge(current, value)
          : value
    }
    return result
  }
  return merge(base as unknown as PlainObject, extra) as unknown as ApexOptions
}

/**
 * Eje Y de conteos enteros: marcas uniformes y sin decimales.
 * Hasta 5 se marca cada unidad; por encima el máximo se redondea a un
 * múltiplo de 4 para que las 4 divisiones caigan en enteros (p. ej. 7 -> 8
 * con marcas 0, 2, 4, 6, 8).
 * @param maxValue valor máximo de los datos.
 */
export function integerAxis(maxValue: number): {
  min: number
  max: number
  tickAmount: number
} {
  const peak = Math.max(3, Math.ceil(maxValue))
  if (peak <= 5) return { min: 0, max: peak, tickAmount: peak }
  const step = Math.ceil(peak / 4)
  return { min: 0, max: step * 4, tickAmount: 4 }
}

export function useChartTheme() {
  const theme = useTheme()

  const vuetifyMode = computed<'dark' | 'light'>(() =>
    theme.global.name.value === 'dark' ? 'dark' : 'light',
  )

  /**
   * Modo con el que se dibujan las gráficas. Sigue al tema de Vuetify con dos
   * frames de retraso: reconstruir 6 gráficas ApexCharts cuesta cientos de
   * ms (mide SVG con getBBox/layout forzado) y, hecho en el mismo frame,
   * retrasaba el cambio de tema de TODA la pantalla. Así la interfaz cambia
   * al instante y las gráficas la alcanzan en el frame siguiente.
   */
  const mode = ref<'dark' | 'light'>(vuetifyMode.value)
  let raf = 0
  watch(vuetifyMode, (next) => {
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      raf = requestAnimationFrame(() => {
        mode.value = next
      })
    })
  })
  onScopeDispose(() => cancelAnimationFrame(raf))

  const isDark = computed(() => mode.value === 'dark')

  const colors = computed(() => {
    // Colores del tema que se está dibujando (no del activo en Vuetify, que
    // ya puede ser otro durante ese frame de retraso).
    const vuetify = (theme.themes.value[mode.value] ?? theme.current.value).colors
    return {
      ...SERIES[mode.value],
      grid: CHROME[mode.value].grid,
      ink: String(vuetify['on-surface'] ?? CHROME[mode.value].ink),
      inkSoft: String(vuetify['on-surface-variant'] ?? CHROME[mode.value].ink),
      surface: String(vuetify.surface),
    }
  })

  /** Opciones base de ApexCharts; cada gráfica las extiende con `mergeOptions`. */
  const baseOptions = computed<ApexOptions>(() => {
    const c = colors.value
    return {
      chart: {
        toolbar: { show: false },
        zoom: { enabled: false },
        background: 'transparent',
        fontFamily: 'inherit',
        foreColor: c.inkSoft,
        // `dynamicAnimation` apagado: cambiar de tema o refrescar datos no debe
        // animar la gráfica (la animación inicial sí se conserva).
        animations: {
          enabled: true,
          speed: 300,
          dynamicAnimation: { enabled: false },
        },
      },
      theme: { mode: mode.value },
      colors: [c.primary],
      dataLabels: { enabled: false },
      grid: {
        borderColor: c.grid,
        strokeDashArray: 0,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
        padding: { left: 8, right: 8 },
      },
      xaxis: {
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: c.inkSoft, fontSize: '11px' } },
      },
      yaxis: {
        labels: { style: { colors: c.inkSoft, fontSize: '11px' } },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '12px',
        labels: { colors: c.ink },
        markers: { size: 6, strokeWidth: 0 },
      },
      tooltip: { theme: mode.value },
    }
  })

  return { isDark, colors, baseOptions }
}
