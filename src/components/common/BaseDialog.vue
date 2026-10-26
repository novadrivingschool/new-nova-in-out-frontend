<!--
  src/components/common/BaseDialog.vue

  Diálogo base. En móvil pasa a pantalla completa: un modal centrado con
  márgenes en 375px desperdicia espacio y deja los botones a media altura.
-->
<template>
  <v-dialog
    :model-value="show"
    :max-width="dialogFullscreen ? undefined : width ?? dialogWidth"
    :fullscreen="dialogFullscreen"
    :transition="dialogFullscreen ? 'dialog-bottom-transition' : 'dialog-transition'"
    scrollable
    :persistent="persistent"
    @update:model-value="onModelUpdate"
  >
    <v-card :loading="loading ?? false" class="base-dialog">
      <v-card-title class="base-dialog__header">
        <span class="base-dialog__title">{{ title }}</span>

        <v-btn
          icon="mdi-close"
          size="small"
          variant="text"
          aria-label="Close dialog"
          @click="$emit('close')"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="base-dialog__body">
        <slot name="dialog-body" />
      </v-card-text>

      <template v-if="$slots['dialog-actions']">
        <v-divider />
        <v-card-actions class="base-dialog__actions">
          <slot name="dialog-actions" />
        </v-card-actions>
      </template>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useResponsive } from '@/composables/useResponsive'

const props = withDefaults(
  defineProps<{
    title: string
    show: boolean
    /** Aceptado por compatibilidad; la cabecera ya no pinta icono. */
    icon?: string
    loading?: boolean
    /** Ancho fijo opcional; si se omite se usa el del breakpoint. */
    width?: number | string
    /** Impide cerrar al hacer clic fuera. Para formularios con cambios sin guardar. */
    persistent?: boolean
  }>(),
  {
    persistent: false,
  },
)

const emit = defineEmits<{ (e: 'close'): void }>()

const { dialogFullscreen, dialogWidth } = useResponsive()

function onModelUpdate(value: boolean): void {
  if (!value && !props.persistent) emit('close')
}
</script>

<style scoped>
.base-dialog {
  border-radius: var(--app-radius-lg);
}

.base-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  padding: var(--app-space-3) var(--app-space-4);
}

.base-dialog__title {
  font-size: var(--app-text-base);
  font-weight: 600;
  min-width: 0;
  letter-spacing: -0.01em;
  line-height: 1.3;
  overflow-wrap: anywhere;
}

.base-dialog__body {
  padding: var(--app-space-4) !important;
}

.base-dialog__actions {
  justify-content: flex-end;
  gap: var(--app-space-2);
  padding: var(--app-space-3) var(--app-space-4);
}

/* En pantalla completa los botones se estiran y son fáciles de acertar */
@media (max-width: 600px) {
  .base-dialog__actions {
    flex-wrap: wrap;
  }

  .base-dialog__actions :deep(> *) {
    flex: 1 1 auto;
  }
}
</style>
