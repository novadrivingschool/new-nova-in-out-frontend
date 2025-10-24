/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

// Styles
import 'unfonts.css'
import { useAuth } from '@/stores/auth/useAuth'

const app = createApp(App)

registerPlugins(app)

// rehidrata sesión
//useAuth().hydrateMe()

app.mount('#app')
