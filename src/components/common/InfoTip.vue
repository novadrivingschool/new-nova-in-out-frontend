<!--
  src/components/common/InfoTip.vue

  Icono "i" con tooltip explicativo. Se abre con hover, foco de teclado
  (Tab), clic/toque en móvil, y se cierra con Escape o al perder el foco. El
  estado se controla aquí (`v-model`) porque el `open-on-focus` de Vuetify no
  abre el tooltip con la navegación por teclado.

  Dentro de una tarjeta clicable, el clic/tecla del icono NO se propaga:
  abrir la ayuda no debe navegar.

  El texto completo va también en `aria-label` para lectores de pantalla.
-->
<template>
  <v-tooltip v-model="open" location="top" :max-width="maxWidth">
    <template #activator="{ props: tipProps }">
      <button
        v-bind="tipProps"
        type="button"
        class="info-tip"
        :aria-label="`${label ? label + ': ' : ''}${text}`"
        @click.stop="open = true"
        @focus="open = true"
        @blur="open = false"
        @keydown.enter.stop
        @keydown.space.stop
        @keydown.esc="open = false"
      >
        <v-icon icon="mdi-information-outline" size="16" />
      </button>
    </template>
    <span class="info-tip__text">{{ text }}</span>
  </v-tooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue'

withDefaults(
  defineProps<{
    /** Explicación (qué significa y cómo se calcula). */
    text: string
    /** Nombre del elemento, para el aria-label. */
    label?: string
    maxWidth?: number
  }>(),
  { label: '', maxWidth: 320 },
)

const open = ref(false)
</script>

<style scoped>
.info-tip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: help;
  transition: background-color 120ms ease, color 120ms ease;
}

.info-tip:hover,
.info-tip:focus-visible {
  background: rgba(var(--v-theme-on-surface), 0.08);
  color: rgb(var(--v-theme-on-surface));
}

.info-tip:focus-visible {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}

.info-tip__text {
  display: block;
  font-size: 0.8125rem;
  line-height: 1.45;
  text-align: start;
}
</style>
