<!--
  src/App.vue

  Raíz de la aplicación. Decide si se muestra el cromo (barra + navegación)
  según `route.meta.public`, no comparando rutas a mano: así una nueva página
  pública sólo necesita declarar su meta.
-->
<template>
  <v-app>
    <a class="app-skip-link" href="#main-content">Skip to content</a>

    <!-- El shell vive fuera de `v-main` para que Vuetify calcule el layout -->
    <AppShell v-if="showShell" />

    <!--
      Sin transición entre páginas: un fundido, por breve que sea, introduce
      una espera perceptible en cada navegación dentro de una herramienta que
      se usa a diario. El cambio es instantáneo.
    -->
    <v-main id="main-content">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/components/AppShell/AppShell.vue'
import { useAppTheme } from '@/composables/useAppTheme'
import { useAuth } from '@/stores/auth/useAuth'

const route = useRoute()
const auth = useAuth()
const { init: initTheme } = useAppTheme()

/**
 * Ambas inicializaciones son síncronas y deben ocurrir dentro del scope de
 * `setup`: `useAppTheme` registra un listener de `prefers-color-scheme` con
 * `onScopeDispose`, que necesita un effect scope activo. Además, aplicar el
 * tema aquí evita el destello de tema claro antes del primer render.
 */
initTheme()
auth.init()

/**
 * Las rutas públicas (login) no muestran cromo. Mientras el router aún no ha
 * resuelto la ruta inicial, `matched` está vacío: en ese caso no renderizamos
 * el shell para evitar un parpadeo de la barra sobre el login.
 */
const showShell = computed(
  () => route.matched.length > 0 && route.meta.public !== true,
)
</script>
