<template>
  <v-app>
    <app-bar v-if="showAppBar" /> <!-- App bar + drawer fuera de v-main -->

    <v-main class="d-flex flex-column">
      <router-view />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import AppBar from './components/AppBar/AppBar.vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const showAppBar = computed(() => {
  return route.path !== '/' && route.path !== '/login'
})
</script>

<style>
html,
body,
#app,
.v-application,
.v-main {
  height: 100%;
  margin: 0;
}
</style>
