/**
 * src/plugins/vuetify.ts
 *
 * Configuración única de Vuetify: temas, defaults de componentes y breakpoints.
 *
 * La paleta es deliberadamente una escala de grises fríos. El acento (azul
 * Nova) se reserva para dos cosas por pantalla: el elemento de navegación
 * activo y la acción primaria. Los colores de estado (success/warning/error)
 * sólo aparecen cuando hay un estado que comunicar.
 *
 * Todo color de la aplicación se declara aquí; ningún `.vue` contiene
 * literales hexadecimales.
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '@/styles/app.scss'

// Composables
import { createVuetify } from 'vuetify'
import type { ThemeDefinition } from 'vuetify'

// Labs components
import { VCalendar } from 'vuetify/labs/VCalendar'
import { VTimePicker } from 'vuetify/labs/VTimePicker'

const light: ThemeDefinition = {
  dark: false,
  colors: {
    // Superficies: casi blanco, con un punto frío
    background: '#FCFCFD',
    surface: '#FFFFFF',
    'surface-bright': '#FFFFFF',
    'surface-light': '#F7F8F9',
    // Relleno tenue para cabeceras de tabla y estados hover
    'surface-variant': '#F4F5F7',
    'surface-container': '#F7F8F9',

    // Texto
    'on-background': '#16181D',
    'on-surface': '#16181D',
    'on-surface-variant': '#6B7280',

    // Acento: uso contado
    primary: '#2563EB',
    'primary-darken-1': '#1D4ED8',
    'primary-lighten-1': '#3B82F6',
    'on-primary': '#FFFFFF',

    // Neutro para acciones secundarias
    secondary: '#6B7280',
    'secondary-darken-1': '#4B5563',
    'on-secondary': '#FFFFFF',

    accent: '#4F46E5',
    'on-accent': '#FFFFFF',

    // Estado
    error: '#DC2626',
    'on-error': '#FFFFFF',
    warning: '#B45309',
    'on-warning': '#FFFFFF',
    success: '#15803D',
    'on-success': '#FFFFFF',
    info: '#1D4ED8',
    'on-info': '#FFFFFF',

    // Escala de rendimiento (barra de tiempo activo): 0–24, 25–49, 50–74, 75–100
    'perf-low': '#DC2626',
    'perf-fair': '#F97316',
    'perf-good': '#EAB308',
    'perf-high': '#16A34A',

    tooltip: '#16181D',
    'on-tooltip': '#FAFAFA',
  },
  variables: {
    'border-color': '#E4E6EA',
    'border-opacity': 1,
    'high-emphasis-opacity': 1,
    'medium-emphasis-opacity': 0.62,
    'disabled-opacity': 0.36,
    // Interacciones muy contenidas: nada de manchas de color
    'idle-opacity': 0.02,
    'hover-opacity': 0.03,
    'focus-opacity': 0.06,
    'selected-opacity': 0.05,
    'activated-opacity': 0.06,
    'pressed-opacity': 0.08,
  },
}

const dark: ThemeDefinition = {
  dark: true,
  colors: {
    background: '#0A0B0D',
    surface: '#0F1114',
    'surface-bright': '#16181C',
    'surface-light': '#16181C',
    'surface-variant': '#191C21',
    'surface-container': '#131519',

    'on-background': '#F2F4F7',
    'on-surface': '#F2F4F7',
    'on-surface-variant': '#8A9099',

    primary: '#5E8BFF',
    'primary-darken-1': '#3B6FF5',
    'primary-lighten-1': '#8AABFF',
    'on-primary': '#05080F',

    secondary: '#8A9099',
    'secondary-darken-1': '#6B7280',
    'on-secondary': '#0A0B0D',

    accent: '#8B85F5',
    'on-accent': '#0A0716',

    error: '#F0616D',
    'on-error': '#1F0508',
    warning: '#E0A340',
    'on-warning': '#1F1400',
    success: '#3DBF74',
    'on-success': '#04180D',
    info: '#5E8BFF',
    'on-info': '#05080F',

    'perf-low': '#F0616D',
    'perf-fair': '#FB923C',
    'perf-good': '#FACC15',
    'perf-high': '#3DBF74',

    tooltip: '#F2F4F7',
    'on-tooltip': '#0A0B0D',

    /**
     * `login-navy`: único acento azul marino del login (letra "I" del
     * wordmark y botón), sin el celeste vibrante de `primary`. No se usa
     * fuera de Login/*; la card sigue en `surface`, igual que el resto de la
     * app — más simple y consistente que un token de fondo dedicado, que ya
     * se probó en dos variantes (gris intermedio, luego azul sólido) y
     * ninguna mejoró sobre la card oscura original.
     *
     * El valor está calibrado por contraste WCAG, no a ojo: un "azul marino"
     * clásico (p.ej. #1E3A5F) contra `background`/`surface` (~#0A0B0D/
     * #0F1114, casi negro) da ~1.7:1 — imperceptible en pantalla. #4878BE da
     * ~4.4:1 contra el fondo y ~4:1 contra `on-surface` (blanco): sigue
     * leyéndose como azul serio, pero se distingue a simple vista tanto del
     * fondo oscuro como del texto blanco que lo rodea.
     */
    'login-navy': '#4878BE',
  },
  variables: {
    'border-color': '#23262B',
    'border-opacity': 1,
    'high-emphasis-opacity': 1,
    'medium-emphasis-opacity': 0.66,
    'disabled-opacity': 0.38,
    'idle-opacity': 0.03,
    'hover-opacity': 0.05,
    'focus-opacity': 0.09,
    'selected-opacity': 0.07,
    'activated-opacity': 0.09,
    'pressed-opacity': 0.12,
  },
}

export default createVuetify({
  theme: {
    // El tema real lo fija `useAppTheme()` en el arranque.
    defaultTheme: 'light',
    themes: { light, dark },
  },

  defaults: {
    /**
     * El ripple es el efecto que hace que cada clic se perciba con retardo.
     * Desactivarlo aquí es la mitad del cambio; la otra mitad está en
     * `app.scss`, donde se acortan las transiciones del cromo.
     */
    global: {
      ripple: false,
    },

    VCard: {
      rounded: 'md',
      elevation: 0,
      color: 'surface',
    },
    VBtn: {
      rounded: 'sm',
      variant: 'text',
      // Las mayúsculas y el interletrado de Material se anulan en app.scss
      style: 'font-weight: 500;',
    },
    VTextField: {
      variant: 'outlined',
      density: 'compact',
      color: 'primary',
      hideDetails: 'auto',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'compact',
      color: 'primary',
      hideDetails: 'auto',
      autoGrow: true,
      rows: 3,
    },
    VSelect: {
      variant: 'outlined',
      density: 'compact',
      color: 'primary',
      hideDetails: 'auto',
      menuProps: { offset: 4 },
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'compact',
      color: 'primary',
      hideDetails: 'auto',
      menuProps: { offset: 4 },
    },
    VCombobox: {
      variant: 'outlined',
      density: 'compact',
      color: 'primary',
      hideDetails: 'auto',
    },
    VFileInput: {
      variant: 'outlined',
      density: 'compact',
      color: 'primary',
      hideDetails: 'auto',
    },
    VCheckbox: {
      color: 'primary',
      density: 'compact',
      hideDetails: 'auto',
    },
    VRadioGroup: {
      color: 'primary',
      density: 'compact',
      hideDetails: 'auto',
    },
    VSwitch: {
      color: 'primary',
      density: 'compact',
      hideDetails: 'auto',
      inset: true,
    },
    VDataTable: {
      density: 'compact',
      hover: true,
      itemsPerPage: 25,
    },
    VDataTableServer: {
      density: 'compact',
      hover: true,
    },
    VChip: {
      rounded: 'xs',
      size: 'small',
      variant: 'tonal',
    },
    VAlert: {
      variant: 'tonal',
      rounded: 'md',
      density: 'compact',
    },
    VDialog: {
      scrollable: true,
    },
    VTooltip: {
      location: 'top',
      openDelay: 400,
    },
    VListItem: {
      rounded: 'sm',
    },
    VList: {
      density: 'compact',
    },
    VNavigationDrawer: {
      elevation: 0,
      color: 'surface',
    },
    VAppBar: {
      elevation: 0,
      color: 'surface',
    },
    VSkeletonLoader: {
      color: 'surface-variant',
    },
    VSnackbar: {
      location: 'bottom right',
      rounded: 'md',
      timeout: 4000,
      variant: 'flat',
    },
    VPagination: {
      density: 'comfortable',
      activeColor: 'primary',
      variant: 'text',
      totalVisible: 5,
    },
    VMenu: {
      offset: 6,
    },
    VProgressLinear: {
      rounded: true,
      height: 4,
    },
    VExpansionPanels: {
      variant: 'accordion',
    },
  },

  display: {
    /**
     * `md` (960px) separa navegación táctil de navegación de escritorio: por
     * debajo el drawer es temporal, por encima persistente.
     */
    mobileBreakpoint: 'md',
    thresholds: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
      xxl: 2560,
    },
  },

  components: {
    VCalendar,
    VTimePicker,
  },
})
