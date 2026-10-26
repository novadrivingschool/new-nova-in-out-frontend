<!--
  src/components/common/EmptyState.vue

  Estado vacío. Un texto centrado, sin ilustración ni icono gigante.
-->
<template>
  <div class="empty">
    <p class="empty__title">{{ title }}</p>
    <p v-if="description" class="empty__description">{{ description }}</p>

    <div v-if="$slots.actions" class="empty__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  /**
   * Aceptado por compatibilidad con las llamadas existentes. No se pinta: un
   * icono de 64px en un panel vacío es ornamento, no información.
   */
  icon?: string
}>()
</script>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-2);
  padding: var(--app-space-12) var(--app-space-6);
  text-align: center;
}

.empty__title {
  font-size: var(--app-text-base);
  font-weight: 550;
  margin: 0;
}

.empty__description {
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
  max-width: 30rem;
  line-height: 1.5;
  margin: 0;
}

.empty__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--app-space-2);
  margin-top: var(--app-space-4);
}
</style>
