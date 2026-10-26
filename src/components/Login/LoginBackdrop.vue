<!--
  src/components/Login/LoginBackdrop.vue

  Fondo del login. Retícula basada en la técnica de
  go-nova/src/components/auth/LoginBackdrop.vue (tokens de tema en vez de hex
  fijos, porque este proyecto sí alterna light/dark en el resto de la app).
  Sin los brillos de esquina de go-nova: la paleta del login es blanco / negro
  / azul marino (`login-navy*` en plugins/vuetify.ts), y dos manchas radiales
  de color compiten con esa sobriedad — se descartaron en vez de recolorearlas.

   1. Retícula hexagonal: tres familias de `repeating-linear-gradient` a 0°,
      60° y 120° (en vez de las dos de go-nova a 45°/-45°, que daban rombos)
      con el mismo período — tres direcciones a 60° entre sí generan una
      malla triangular cuyos huecos (donde ninguna línea cruza) son hexágonos
      regulares; es la forma estándar de dibujar un panal con gradientes CSS,
      sin SVG. Se mantiene `repeating-linear-gradient` en vez de cualquier
      forma rellena porque se repite por su propia matemática, sin depender
      de `background-repeat`; eso importa en este proyecto porque el reset
      global de Vuetify (`ress.css`, cargado por `import 'vuetify/styles'` en
      plugins/vuetify.ts) trae `*, ::before, ::after { background-repeat:
      no-repeat }` aplicado a TODO elemento, y cualquier fondo que dependa de
      `background-size` para tesela r (radial-gradient + circle, o un tile
      PNG) se pinta una sola vez sin repetir si no se le fija
      `background-repeat: repeat` explícitamente. Al no depender de eso,
      `repeating-linear-gradient` nunca sufrió ese bug.
   2. Viñeta radial que oscurece los bordes y concentra la mirada al centro.
-->
<script setup lang="ts"></script>

<template>
  <div class="backdrop" aria-hidden="true">
    <div class="backdrop__grid" />
    <div class="backdrop__vignette" />
  </div>
</template>

<style scoped>
.backdrop,
.backdrop__grid,
.backdrop__vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.backdrop {
  z-index: 0;
  overflow: hidden;
}

/* Retícula hexagonal: tres familias de líneas a 0°, 60° y 120° (mismo
   período) — donde las tres NO se cruzan quedan hexágonos regulares. */
.backdrop__grid {
  background-image:
    repeating-linear-gradient(
      0deg,
      rgba(var(--v-theme-on-surface), 0.06) 0 1px,
      transparent 1px 40px
    ),
    repeating-linear-gradient(
      60deg,
      rgba(var(--v-theme-on-surface), 0.06) 0 1px,
      transparent 1px 40px
    ),
    repeating-linear-gradient(
      120deg,
      rgba(var(--v-theme-on-surface), 0.06) 0 1px,
      transparent 1px 40px
    );
  /* La retícula se desvanece hacia los bordes: presente, nunca protagonista. */
  mask-image: radial-gradient(ellipse 90% 85% at 50% 45%, black 30%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 90% 85% at 50% 45%, black 30%, transparent 100%);
}

/* Bordes oscurecidos: la luz queda en el centro, donde está la tarjeta. */
.backdrop__vignette {
  background: radial-gradient(
    ellipse 78% 72% at 50% 48%,
    transparent 35%,
    rgba(var(--v-theme-background), 0.6) 100%
  );
}
</style>
