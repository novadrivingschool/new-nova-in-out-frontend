<!--
  src/components/common/PageContainer.vue

  Contenedor de página. Implementa el escalado híbrido acordado:

    - `constrained` (por defecto): tope de 75rem centrado. Para formularios,
      vistas de detalle y cualquier cosa con texto seguido. Evita líneas de
      lectura de un metro de ancho en monitores 4K.
    - `wide`: tope de 100rem. Para dashboards, donde ver más de un panel a la
      vez sí aporta.
    - `fluid`: sin tope. Para tablas densas, que se benefician de todo el ancho.
    - `narrow`: tope de 42rem. Para flujos de un solo campo.

  `align` controla la posición horizontal cuando hay tope de ancho:
    - `center` (por defecto): centrado en el área de contenido.
    - `start`: pegado al borde izquierdo (derecho en RTL).

  El padding es fluido (`--app-gutter`), así que va de 12px en móvil a 48px en
  4K sin declarar un solo breakpoint.
-->
<template>
  <div
    class="page-container"
    :class="[`page-container--${variant}`, `page-container--align-${align}`]"
  >
    <slot />
  </div>
</template>

<script setup lang="ts">
export type PageContainerVariant = 'narrow' | 'constrained' | 'wide' | 'fluid'
export type PageContainerAlign = 'center' | 'start'

withDefaults(
  defineProps<{
    variant?: PageContainerVariant
    align?: PageContainerAlign
  }>(),
  {
    variant: 'constrained',
    align: 'center',
  },
)
</script>

<style scoped>
.page-container {
  width: 100%;
  margin-inline: auto;
  padding: var(--app-gutter);
  /* Respeta el notch / bordes redondeados en móviles */
  padding-left: max(var(--app-gutter), env(safe-area-inset-left));
  padding-right: max(var(--app-gutter), env(safe-area-inset-right));
  padding-bottom: max(var(--app-gutter), env(safe-area-inset-bottom));
}

.page-container--align-start {
  margin-inline: 0 auto;
}

.page-container--narrow {
  max-width: var(--app-width-narrow);
}

.page-container--constrained {
  max-width: var(--app-width-constrained);
}

.page-container--wide {
  max-width: var(--app-width-wide);
}

.page-container--fluid {
  max-width: none;
}
</style>
