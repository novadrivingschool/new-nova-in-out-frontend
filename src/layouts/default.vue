<!--
  src/layouts/default.vue

  Layout por defecto. El cromo (barra + navegación) lo monta `App.vue` fuera de
  `v-main`, porque Vuetify necesita que `v-app-bar` y `v-navigation-drawer`
  sean hermanos de `v-main` para calcular el layout.

  Aquí sólo queda el contenedor de la página: cada página decide su propio
  ancho envolviéndose en `<PageContainer>`.
-->
<template>
  <router-view />
</template>
