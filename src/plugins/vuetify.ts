// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

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
          background: '#F4F5F7',     // Fondo general claro pero suave
          surface: '#F9FAFB',        // Cards / contenedores (sin blanco puro)
          primary: '#3B82F6',        // Azul moderno
          secondary: '#6B7280',      // Gris medio neutro
          accent: '#A5B4FC',         // Azul lavanda claro
          error: '#EF4444',          // Rojo controlado
          warning: '#FACC15',        // Amarillo pastel
          success: '#10B981',        // Verde suave
          info: '#60A5FA',           // Azul cielo
        },
      },
      dark: {
        dark: true,
        colors: {
          background: '#0D1117',     // Negro azulado (GitHub dark base)
          surface: '#161B22',        // Cards / paneles
          primary: '#3B82F6',        // Azul moderno (acción principal)
          secondary: '#8B949E',      // Gris claro frío
          accent: '#60A5FA',         // Azul cielo tenue (hover, interacción)
          error: '#EF4444',          // Rojo plano, serio
          warning: '#F59E0B',        // Mostaza desaturada
          success: '#3BA55D',        // Verde oscuro contenido
          info: '#93C5FD',           // Azul suave pastel para info
        },
      }
    },
  },
  components: {
    VCalendar,
    VTimePicker
  },
})
