/**
 * src/composables/useResponsive.ts
 *
 * Decisiones de layout derivadas del breakpoint, en un solo sitio.
 *
 * El objetivo es que ningún componente vuelva a escribir
 * `:density="smAndDown ? 'compact' : 'comfortable'"` a mano: esas reglas viven
 * aquí y así la app entera se comporta igual.
 */
import { computed } from 'vue'
import { useDisplay } from 'vuetify'

export function useResponsive() {
  const display = useDisplay()
  const { name, mobile, smAndDown, mdAndDown, lgAndUp, xlAndUp, width } = display

  /** Pantallas grandes de verdad (2K/4K): admiten más columnas y más aire. */
  const isUltraWide = computed(() => width.value >= 2560)

  /**
   * Densidad de inputs, tablas y listas.
   * Compacta en móvil para que quepa más; cómoda a partir de tablet.
   */
  const density = computed<'compact' | 'comfortable' | 'default'>(() =>
    smAndDown.value ? 'compact' : 'comfortable',
  )

  /** Densidad específica de tablas: compacta hasta laptop por volumen de datos. */
  const tableDensity = computed<'compact' | 'comfortable'>(() =>
    mdAndDown.value ? 'compact' : 'comfortable',
  )

  /** Tamaño de botones: táctil en móvil, normal en escritorio. */
  const btnSize = computed<'default' | 'large'>(() =>
    smAndDown.value ? 'large' : 'default',
  )

  const iconSize = computed<number>(() => (isUltraWide.value ? 22 : 20))

  /** Avatar del usuario en el shell. */
  const avatarSize = computed<number>(() => (smAndDown.value ? 32 : 36))

  /** Filas por página sugeridas: aprovecha el alto disponible. */
  const itemsPerPage = computed<number>(() => {
    if (smAndDown.value) return 10
    if (mdAndDown.value) return 15
    if (isUltraWide.value) return 50
    return 25
  })

  /** Columnas para rejillas de tarjetas (KPIs, métricas). */
  const gridCols = computed<number>(() => {
    if (smAndDown.value) return 1
    if (mdAndDown.value) return 2
    if (isUltraWide.value) return 4
    return 3
  })

  /**
   * Props de `v-col` para un campo de formulario estándar.
   * Uso: `<v-col v-bind="fieldCols">`
   */
  const fieldCols = computed(() => ({
    cols: 12,
    sm: 6,
    lg: 4,
    xxl: 3,
  }))

  /** Igual que `fieldCols` pero para campos que necesitan el doble de ancho. */
  const fieldColsWide = computed(() => ({
    cols: 12,
    sm: 12,
    lg: 8,
    xxl: 6,
  }))

  /** El drawer sólo puede ser persistente cuando hay ancho para él. */
  const drawerPermanent = computed(() => !mobile.value)

  /** En tablet el drawer se muestra como rail de iconos para ganar ancho. */
  const drawerRail = computed(() => !mobile.value && !lgAndUp.value)

  /** Los diálogos ocupan la pantalla completa en móvil. */
  const dialogFullscreen = computed(() => smAndDown.value)

  /** Ancho de diálogo estándar cuando no es pantalla completa. */
  const dialogWidth = computed(() => (mdAndDown.value ? 520 : 640))

  return {
    // Breakpoints crudos, por si un caso puntual los necesita
    breakpoint: name,
    width,
    mobile,
    smAndDown,
    mdAndDown,
    lgAndUp,
    xlAndUp,
    isUltraWide,

    // Decisiones derivadas
    density,
    tableDensity,
    btnSize,
    iconSize,
    avatarSize,
    itemsPerPage,
    gridCols,
    fieldCols,
    fieldColsWide,
    drawerPermanent,
    drawerRail,
    dialogFullscreen,
    dialogWidth,
  }
}
