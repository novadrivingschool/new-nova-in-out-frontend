<!--
  src/components/common/ActivityLoader.vue

  Indicador de carga centrado. `role="status"` + `aria-live` hacen que un
  lector de pantalla anuncie el cambio de estado sin robar el foco.
-->
<template>
  <div class="activity-loader" role="status" aria-live="polite">
    <v-progress-circular :color="color" :size="size" :width="width" indeterminate />
    <p v-if="label" class="activity-loader__label">{{ label }}</p>
  </div>
</template>

<script lang="ts" setup>
withDefaults(
  defineProps<{
    color?: string
    label?: string
    size?: number
    width?: number
  }>(),
  {
    color: 'primary',
    label: 'Loading…',
    size: 36,
    width: 3,
  },
)
</script>

<style scoped>
.activity-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-4);
  padding: var(--app-space-10) var(--app-space-4);
}

.activity-loader__label {
  margin: 0;
  font-size: var(--app-text-base);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
