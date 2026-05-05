// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'
import '@/styles/app.scss'

// Composables
import { createVuetify } from 'vuetify'

// Labs components
import { VCalendar } from 'vuetify/labs/VCalendar'
import { VTimePicker } from 'vuetify/labs/VTimePicker'

// Configuración con temas personalizados
export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        dark: false,
        colors: {
          background: '#F4F6FA',     // Fondo general claro pero suave
          surface: '#FFFFFF',        // Cards / contenedores
          'surface-bright': '#FFFFFF',
          'surface-variant': '#EEF1F6',
          'on-surface-variant': '#475467',
          primary: '#2563EB',        // Azul moderno y vibrante
          'primary-darken-1': '#1D4ED8',
          secondary: '#64748B',      // Gris azulado
          accent: '#7C3AED',         // Morado moderno
          error: '#EF4444',
          warning: '#F59E0B',
          success: '#10B981',
          info: '#0EA5E9',
        },
        variables: {
          'border-color': '#E2E8F0',
          'border-opacity': 1,
          'high-emphasis-opacity': 0.92,
          'medium-emphasis-opacity': 0.66,
          'theme-on-surface': '14, 23, 42',
        },
      },
      dark: {
        dark: true,
        colors: {
          background: '#0B1220',     // Azul muy oscuro (más cálido que negro puro)
          surface: '#111827',        // Cards / paneles
          'surface-bright': '#1F2937',
          'surface-variant': '#1F2937',
          'on-surface-variant': '#CBD5E1',
          primary: '#3B82F6',
          'primary-darken-1': '#2563EB',
          secondary: '#94A3B8',
          accent: '#A78BFA',
          error: '#F87171',
          warning: '#FBBF24',
          success: '#34D399',
          info: '#38BDF8',
        },
        variables: {
          'border-color': '#1F2937',
          'border-opacity': 1,
          'high-emphasis-opacity': 0.95,
          'medium-emphasis-opacity': 0.70,
        },
      },
    },
  },
  defaults: {
    global: {
      ripple: true,
    },
    VCard: {
      rounded: 'lg',
      elevation: 0,
      style: 'border: 1px solid rgb(var(--v-theme-surface-variant));',
    },
    VBtn: {
      rounded: 'lg',
      style: 'text-transform: none; letter-spacing: 0.01em; font-weight: 600;',
    },
    VTextField: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto',
    },
    VTextarea: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto',
    },
    VSelect: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto',
      menuProps: { offset: 4 },
    },
    VAutocomplete: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto',
    },
    VCombobox: {
      variant: 'outlined',
      density: 'comfortable',
      color: 'primary',
      hideDetails: 'auto',
    },
    VCheckbox: {
      color: 'primary',
      hideDetails: 'auto',
    },
    VSwitch: {
      color: 'primary',
      hideDetails: 'auto',
      inset: true,
    },
    VDataTable: {
      density: 'comfortable',
      hover: true,
      itemsPerPage: 10,
    },
    VChip: {
      rounded: 'lg',
      size: 'small',
    },
    VAlert: {
      variant: 'tonal',
      rounded: 'lg',
      density: 'comfortable',
    },
    VDialog: {
      transition: 'dialog-bottom-transition',
    },
    VTooltip: {
      location: 'top',
    },
  },
  display: {
    mobileBreakpoint: 'md',
  },
  components: {
    VCalendar,
    VTimePicker,
  },
})
