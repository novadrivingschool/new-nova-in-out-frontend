<!--
  src/components/Screenshots/ScreenshotCard.vue

  Miniatura de una captura. Se usa dentro de `.app-autogrid`, que decide cuántas
  caben según el ancho disponible — sin `v-col` ni breakpoints, así que la
  rejilla pasa de 2 columnas en móvil a 8 o más en 4K por sí sola.
-->
<template>
  <v-card
    class="shot app-card--interactive"
    :class="{ 'shot--no-image': !hasImage }"
    role="button"
    :tabindex="0"
    :aria-label="`View screenshot from ${formatDisplayDate(image.clock_date)} at ${image.clock_time}`"
    @click="$emit('open', image)"
    @keydown.enter="$emit('open', image)"
    @keydown.space.prevent="$emit('open', image)"
  >
    <div class="shot__media">
      <div v-if="!hasImage" class="shot__placeholder">
        <v-icon size="26" color="secondary">mdi-image-off-outline</v-icon>
        <span class="shot__placeholder-text">No screen</span>
      </div>

      <v-img
        v-else
        :src="image.thumbnailUrl || image.imageUrl"
        :alt="`Screenshot ${image.clock_time}`"
        aspect-ratio="16/10"
        cover
        :loading="eager ? 'eager' : 'lazy'"
      >
        <template #placeholder>
          <div class="shot__loading">
            <v-progress-circular indeterminate color="primary" size="22" width="2" />
          </div>
        </template>
        <template #error>
          <div class="shot__placeholder">
            <v-icon size="24" color="secondary">mdi-image-broken-variant</v-icon>
          </div>
        </template>
      </v-img>

      <v-chip
        :color="badge.color"
        size="x-small"
        variant="flat"
        class="shot__badge"
      >
        {{ badge.label }}
      </v-chip>

      <!-- DEV ONLY: borrar registro (BD + S3). -->
      <v-btn
        v-if="deletable"
        class="shot__delete"
        icon="mdi-delete-outline"
        color="error"
        variant="flat"
        size="x-small"
        density="comfortable"
        aria-label="Delete this record (dev only)"
        @click.stop="$emit('delete', image)"
        @keydown.enter.stop
        @keydown.space.stop
      />
    </div>

    <div class="shot__body">
      <div class="shot__time-row">
        <div class="shot__time">{{ image.clock_time }}</div>
        <v-tooltip v-if="intervalLabel" location="top" text="Capture interval in effect when this record was saved">
          <template #activator="{ props: tip }">
            <span v-bind="tip" class="shot__interval">
              <v-icon size="11">mdi-timer-outline</v-icon>{{ intervalLabel }}
            </span>
          </template>
        </v-tooltip>
      </div>
      <div class="shot__date">{{ formatDisplayDate(image.clock_date) }}</div>
      <v-chip
        v-if="fromActivity"
        size="x-small"
        color="primary"
        variant="tonal"
        prepend-icon="mdi-clipboard-clock-outline"
        class="shot__origin"
      >
        From Activity Report
      </v-chip>
      <div v-if="isAdminClockOut" class="shot__reason" :title="adminTitle">
        {{ adminReason || 'Admin clock out' }}
      </div>
      <div v-else-if="isSelfClockOut" class="shot__reason" :title="adminTitle">
        Reason: {{ adminReason }}
      </div>
      <div
        v-else-if="fromLogout"
        class="shot__reason"
        title="Automatic clock out made when the employee logged out of the NIO app"
      >
        Reason: NIO app log out
      </div>

      <div v-if="showProgress" class="shot__progress">
        <div class="shot__progress-head">
          <span>Active</span>
          <span class="shot__progress-value">{{ percentage }}%</span>
        </div>
        <v-progress-linear
          :model-value="percentage"
          :color="progressColor(percentage)"
          bg-color="on-surface"
          :bg-opacity="0.14"
          height="6"
          rounded
        />
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ScreenshotImage } from '@/types/screenshots'
import {
  activePercentage,
  adminReasonLabel,
  clockTypeColor,
  formatClockType,
  formatDisplayDate,
  formatInterval,
  progressColor,
  shouldShowProgress,
  statusColor,
  statusLabel,
} from './screenshotFormat'

const props = withDefaults(
  defineProps<{
    image: ScreenshotImage
    /** Carga la miniatura con prioridad; sólo para las primeras de la rejilla. */
    eager?: boolean
    /** DEV ONLY: muestra el botón de borrar. */
    deletable?: boolean
  }>(),
  { eager: false, deletable: false },
)

defineEmits<{
  (e: 'open', image: ScreenshotImage): void
  (e: 'delete', image: ScreenshotImage): void
}>()

const hasImage = computed(
  () => !!(props.image.thumbnailUrl || props.image.imageUrl),
)

const percentage = computed(() => activePercentage(props.image.active_time, props.image.slot_seconds))
const intervalLabel = computed(() => formatInterval(props.image.slot_seconds))
const showProgress = computed(() => shouldShowProgress(props.image))

/** Clock pedido desde el Activity Report (web), tanto Clock In como Clock Out. */
const fromActivity = computed(() => props.image.source === 'ACTIVITY_REPORT')

/** Clock out automático por cerrar sesión en la app NIO (source APP_LOGOUT). */
const fromLogout = computed(() => props.image.source === 'APP_LOGOUT')

/** CLOCK_OUT hecho por un admin (FORCE_CLOCK_OUT). */
const isSelfClockOut = computed(() => props.image.adminClockOut?.kind === 'SELF')
const isAdminClockOut = computed(
  () =>
    props.image.activity_status?.toUpperCase() === 'FORCE_CLOCK_OUT' ||
    (!!props.image.adminClockOut && !isSelfClockOut.value),
)
const adminReason = computed(() => adminReasonLabel(props.image.adminClockOut?.reason))
const adminTitle = computed(() => {
  const a = props.image.adminClockOut
  if (!a) return 'Clock out made by an administrator'
  const who = a.kind === 'SELF' ? 'Closed by the employee' : `By ${a.admin_name || 'an administrator'}`
  return [who, a.note].filter(Boolean).join(' · ')
})

/** Un fichaje se etiqueta por su tipo; el resto, por su estado de actividad. */
const badge = computed(() => {
  if (isAdminClockOut.value) return { label: 'CLOCK OUT · ADMIN', color: 'warning' }
  const clockType = props.image.type_of_clock?.trim()
  if (clockType) {
    return {
      label: formatClockType(clockType),
      color: clockTypeColor(clockType),
    }
  }
  return {
    label: statusLabel(props.image.activity_status),
    color: statusColor(props.image.activity_status),
  }
})
</script>

<style scoped>
/* El borde global de `.v-card` (#E4E6EA) casi no se distingue sobre el fondo
   claro; aquí se refuerza con el color del texto para que funcione en ambos temas. */
.shot.v-card {
  overflow: hidden;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.22);
}

.shot.v-card:hover,
.shot.v-card:focus-visible {
  border-color: rgb(var(--v-theme-primary));
}

.shot__media {
  position: relative;
  background: rgb(var(--v-theme-surface-variant));
}

.shot__placeholder,
.shot__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-1);
  /* `aspect-ratio` mantiene la rejilla alineada aunque falte la imagen */
  aspect-ratio: 16 / 10;
}

.shot__placeholder-text {
  font-size: var(--app-text-2xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

.shot__badge {
  position: absolute;
  top: var(--app-space-2);
  left: var(--app-space-2);
  font-size: var(--app-text-2xs) !important;
}

.shot__delete {
  position: absolute;
  top: var(--app-space-2);
  right: var(--app-space-2);
}

.shot__body {
  padding: var(--app-space-3);
}

.shot__time-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-2);
}

.shot__interval {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 1px var(--app-space-2);
  border-radius: var(--app-radius-full);
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--app-text-2xs);
  font-weight: 600;
  white-space: nowrap;
  cursor: default;
}

.shot__time {
  font-size: var(--app-text-base);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
}

.shot__origin {
  margin-top: 4px;
}

.shot__reason {
  margin-top: 4px;
  font-size: var(--app-text-xs);
  font-weight: 600;
  color: rgb(var(--v-theme-warning));
}

.shot__date {
  font-size: var(--app-text-2xs);
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 2px;
}

.shot__progress {
  margin-top: var(--app-space-3);
}

.shot__progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--app-text-2xs);
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: var(--app-space-1);
}

.shot__progress-value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  color: rgb(var(--v-theme-on-surface));
}
</style>
