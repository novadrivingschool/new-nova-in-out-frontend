<!--
  src/components/Screenshots/ScreenshotViewer.vue

  Visor a tamaño completo. A pantalla completa en móvil y con navegación por
  teclado (← → para moverse, Esc para cerrar), que en una galería de cientos de
  capturas es la diferencia entre revisarlas y no revisarlas.
-->
<template>
  <v-dialog
    :model-value="modelValue"
    :fullscreen="smAndDown"
    :max-width="smAndDown ? undefined : 'min(92vw, 1200px)'"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
    @keydown.left="$emit('prev')"
    @keydown.right="$emit('next')"
  >
    <v-card v-if="image" class="viewer">
      <v-card-title class="viewer__head">
        <div class="viewer__heading">
          <span class="viewer__title">{{ image.fullName }}</span>
          <span class="viewer__subtitle">
            {{ formatDisplayDate(image.clock_date) }} · {{ image.clock_time }}
          </span>
        </div>

        <div class="d-flex align-center ga-1">
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            size="small"
            aria-label="Previous screenshot"
            :disabled="!hasPrev"
            @click="$emit('prev')"
          />
          <v-btn
            icon="mdi-chevron-right"
            variant="text"
            size="small"
            aria-label="Next screenshot"
            :disabled="!hasNext"
            @click="$emit('next')"
          />
          <v-btn
            icon="mdi-open-in-new"
            variant="tonal"
            color="primary"
            size="small"
            aria-label="Open in new tab"
            :disabled="!image.imageUrl"
            @click="openInNewTab"
          />
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            aria-label="Close"
            @click="$emit('update:modelValue', false)"
          />
        </div>
      </v-card-title>

      <v-divider />

      <v-card-text class="viewer__body">
        <div class="viewer__image-wrap">
          <v-img
            v-if="image.imageUrl"
            :src="image.imageUrl"
            :alt="`Screenshot from ${image.clock_time}`"
            contain
            class="viewer__image"
          >
            <template #placeholder>
              <div class="viewer__loading">
                <v-progress-circular indeterminate color="primary" size="44" />
                <span class="mt-3">Loading image…</span>
              </div>
            </template>
            <template #error>
              <div class="viewer__loading">
                <v-icon size="44" color="secondary">mdi-image-broken-variant</v-icon>
                <span class="mt-3">This image could not be loaded.</span>
              </div>
            </template>
          </v-img>

          <div v-else class="viewer__loading">
            <v-icon size="44" color="secondary">mdi-image-off-outline</v-icon>
            <span class="mt-3">No screenshot was captured for this record.</span>
          </div>
        </div>

        <aside class="viewer__info">
          <div class="viewer__chips">
            <v-chip
              v-if="image.type_of_clock"
              :color="clockTypeColor(image.type_of_clock)"
              size="small"
              variant="tonal"
            >
              {{ formatClockType(image.type_of_clock) }}
            </v-chip>
            <v-chip
              v-if="image.activity_status"
              :color="statusColor(image.activity_status)"
              size="small"
              variant="tonal"
            >
              {{ statusLabel(image.activity_status) }}
            </v-chip>
          </div>

          <dl class="viewer__fields">
            <dt>Employee</dt>
            <dd>{{ image.employee_number }}</dd>
            <dt>Date</dt>
            <dd>{{ formatDisplayDate(image.clock_date) }}</dd>
            <dt>Time</dt>
            <dd>{{ image.clock_time }}</dd>
            <template v-if="image.source === 'ACTIVITY_REPORT'">
              <dt>Origin</dt>
              <dd>Activity Report (requested from the web)</dd>
            </template>
            <template v-if="image.adminClockOut">
              <dt>Closed by</dt>
              <dd>
                {{ image.adminClockOut.kind === 'SELF' ? 'The employee (Activity Report)' : image.adminClockOut.admin_name || 'Administrator' }}
              </dd>
              <dt>Reason</dt>
              <dd>{{ adminReasonLabel(image.adminClockOut.reason) }}</dd>
              <template v-if="image.adminClockOut.note">
                <dt>Note</dt>
                <dd>{{ image.adminClockOut.note }}</dd>
              </template>
            </template>
            <dt>File</dt>
            <dd class="viewer__filename">{{ imageFileName(image.image) }}</dd>
          </dl>

          <div v-if="showProgress" class="viewer__progress">
            <div class="viewer__progress-head">
              <span>Active time</span>
              <span class="viewer__progress-value">{{ percentage }}%</span>
            </div>
            <v-progress-linear
              :model-value="percentage"
              :color="progressColor(percentage)"
              bg-color="on-surface"
              :bg-opacity="0.14"
              height="10"
              rounded
            />
            <div class="viewer__progress-note">
              {{ image.active_time }}s of {{ image.slot_seconds }}s
            </div>
          </div>
        </aside>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
import type { ScreenshotImage } from '@/types/screenshots'
import {
  activePercentage,
  adminReasonLabel,
  clockTypeColor,
  formatClockType,
  formatDisplayDate,
  imageFileName,
  progressColor,
  shouldShowProgress,
  statusColor,
  statusLabel,
} from './screenshotFormat'

const props = defineProps<{
  modelValue: boolean
  image: ScreenshotImage | null
  hasPrev?: boolean
  hasNext?: boolean
}>()

defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'prev'): void
  (e: 'next'): void
}>()

const { smAndDown } = useDisplay()

const percentage = computed(() => activePercentage(props.image?.active_time, props.image?.slot_seconds))
const showProgress = computed(() => shouldShowProgress(props.image))

function openInNewTab(): void {
  if (props.image?.imageUrl) {
    window.open(props.image.imageUrl, '_blank', 'noopener,noreferrer')
  }
}
</script>

<style scoped>
.viewer__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  padding: var(--app-space-3) var(--app-space-4);
}

.viewer__heading {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.viewer__title {
  font-size: var(--app-text-md);
  font-weight: 700;
  line-height: 1.25;
  overflow-wrap: anywhere;
}

.viewer__subtitle {
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
  font-variant-numeric: tabular-nums;
}

/**
 * En escritorio la imagen y los metadatos van lado a lado; por debajo de 960px
 * se apilan, con la imagen primero.
 */
.viewer__body {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--app-space-4);
  padding: var(--app-space-4) !important;
}

@media (min-width: 960px) {
  .viewer__body {
    grid-template-columns: minmax(0, 1fr) 17rem;
  }
}

.viewer__image-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 12rem;
  border-radius: var(--app-radius-md);
  background: rgb(var(--v-theme-surface-variant));
  overflow: hidden;
}

.viewer__image {
  max-height: min(70vh, 46rem);
  width: 100%;
}

.viewer__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-10);
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--app-text-sm);
}

.viewer__info {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
}

.viewer__chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-1);
}

.viewer__fields {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--app-space-2) var(--app-space-4);
  margin: 0;
  font-size: var(--app-text-sm);
}

.viewer__fields dt {
  font-size: var(--app-text-2xs);
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
  align-self: center;
}

.viewer__fields dd {
  margin: 0;
  text-align: end;
  overflow-wrap: anywhere;
  font-variant-numeric: tabular-nums;
}

.viewer__filename {
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

.viewer__progress-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--app-text-sm);
  margin-bottom: var(--app-space-2);
}

.viewer__progress-value {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.viewer__progress-note {
  margin-top: var(--app-space-1);
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
  text-align: center;
  font-variant-numeric: tabular-nums;
}
</style>
