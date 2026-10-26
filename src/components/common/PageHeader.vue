<!--
  src/components/common/PageHeader.vue

  Cabecera de página: título, subtítulo opcional y acciones.

  El título es de 20px, no de 30: en una herramienta interna el usuario ya sabe
  dónde está —lo dice la navegación— y el espacio vertical vale más que el
  tamaño del encabezado.
-->
<template>
  <header class="page-header">
    <div class="page-header__main">
      <button
        v-if="backTo"
        type="button"
        class="page-header__back"
        :aria-label="`Back to ${backTo}`"
        @click="goBack"
      >
        <v-icon size="16">mdi-arrow-left</v-icon>
      </button>

      <div class="page-header__text">
        <component :is="titleTag" class="page-header__title">
          {{ title }}
        </component>
        <p v-if="subtitle" class="page-header__subtitle">{{ subtitle }}</p>
      </div>
    </div>

    <div v-if="$slots.actions" class="page-header__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Ruta de retorno. Si se omite, no se muestra el botón de volver. */
    backTo?: string
    /** Nivel semántico del título. `h1` por página, `h2` en secciones. */
    titleTag?: 'h1' | 'h2'
  }>(),
  {
    titleTag: 'h1',
  },
)

const router = useRouter()

/**
 * Vuelve en el historial si es posible, para no perder el estado previo
 * (filtros, scroll); si no lo hay, navega a la ruta indicada.
 */
function goBack(): void {
  if (window.history.state?.back) {
    router.back()
    return
  }
  if (props.backTo) router.push(props.backTo)
}
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  margin-bottom: var(--app-space-5);
}

.page-header__main {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  min-width: 0;
  flex: 1 1 18rem;
}

.page-header__back {
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--app-radius-xs);
  background: transparent;
  color: rgb(var(--v-theme-on-surface-variant));
  cursor: pointer;
  transition: background-color var(--app-transition);
}

.page-header__back:hover {
  background: rgba(var(--v-theme-on-surface), 0.06);
  color: rgb(var(--v-theme-on-surface));
}

.page-header__text {
  min-width: 0;
}

.page-header__title {
  font-size: var(--app-text-xl);
  font-weight: 600;
  letter-spacing: var(--app-tracking-tighter);
  line-height: 1.25;
  margin: 0;
}

.page-header__subtitle {
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--app-text-sm);
  line-height: 1.4;
  margin: 2px 0 0;
}

.page-header__actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-2);
}

@media (max-width: 600px) {
  .page-header__actions {
    width: 100%;
  }

  .page-header__actions :deep(> *) {
    flex: 1 1 auto;
  }
}
</style>
