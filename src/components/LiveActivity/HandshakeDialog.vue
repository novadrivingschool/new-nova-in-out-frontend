<!--
  Detalle de un handshake: captura de pantalla + actividad del equipo en ese instante.
  Se abre en cuanto el admin lo solicita (estado "Waiting") y se completa solo
  cuando llega el resultado por WebSocket (o por el sondeo de respaldo).
-->
<template>
  <v-dialog :model-value="modelValue" max-width="1000" scrollable @update:model-value="emit('update:modelValue', $event)">
    <v-card v-if="handshake">
      <v-card-title class="d-flex align-center ga-3 flex-wrap">
        <span class="text-h6">Handshake — {{ handshake.targetName ?? 'Unknown user' }}</span>
        <v-chip :color="STATUS_COLOR[handshake.status]" size="small" variant="tonal">
          {{ STATUS_LABEL[handshake.status] }}
        </v-chip>
        <v-spacer />
        <v-btn
          v-if="imageUrl && !imageLoading && !imageError"
          :href="imageUrl"
          target="_blank"
          rel="noopener noreferrer"
          prepend-icon="mdi-open-in-new"
          variant="text"
          size="small"
        >
          Open image
        </v-btn>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="Close" @click="emit('update:modelValue', false)" />
      </v-card-title>

      <v-divider />

      <v-card-text>
        <v-row>
          <!-- ── Captura ── -->
          <v-col cols="12" md="7">
            <div class="hs__image">
              <div v-if="handshake.status === 'pending'" class="hs__state">
                <v-progress-circular indeterminate color="primary" />
                <div class="text-body-2 mt-3">Waiting for the device to respond…</div>
              </div>

              <div v-else-if="handshake.status !== 'completed' || !handshake.imageKey" class="hs__state">
                <v-icon size="40" color="warning">mdi-image-off-outline</v-icon>
                <div class="text-body-2 mt-3">{{ handshake.error || 'No screenshot available.' }}</div>
              </div>

              <div v-else-if="imageLoading" class="hs__state">
                <v-progress-circular indeterminate color="primary" />
              </div>

              <div v-else-if="imageError" class="hs__state">
                <v-icon size="40" color="warning">mdi-image-broken-variant</v-icon>
                <div class="text-body-2 mt-3">{{ imageError }}</div>
              </div>

              <a
                v-else
                :href="imageUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="hs__link"
                title="Open in a new tab"
              >
                <v-img :src="imageUrl" alt="Screenshot at handshake time" class="hs__img" />
              </a>
            </div>
          </v-col>

          <!-- ── Datos ── -->
          <v-col cols="12" md="5">
            <dl class="hs__grid">
              <dt>Employee</dt>
              <dd>{{ handshake.targetName ?? '—' }}</dd>

              <dt>Employee #</dt>
              <dd class="app-mono">{{ handshake.employeeNumber ?? '—' }}</dd>

              <dt>Device</dt>
              <dd class="app-mono">{{ handshake.targetDeviceId ?? '—' }}</dd>

              <dt>Requested by</dt>
              <dd>{{ handshake.requestedByName ?? '—' }}</dd>

              <dt>Requested at</dt>
              <dd>{{ formatDateTime(handshake.requestedAt) }}</dd>

              <dt>Responded at</dt>
              <dd>{{ formatDateTime(handshake.respondedAt) }}</dd>

              <dt>Response time</dt>
              <dd>{{ formatLatency(handshake.latencyMs) }}</dd>
            </dl>

            <template v-if="handshake.activity">
              <v-divider class="my-3" />
              <div class="text-overline mb-1">Activity at that moment</div>
              <dl class="hs__grid">
                <dt>Status</dt>
                <dd>
                  <v-chip
                    size="x-small"
                    variant="tonal"
                    :color="handshake.activity.activityStatus === 'ACTIVE' ? 'success' : 'warning'"
                  >
                    {{ handshake.activity.activityStatus ?? '—' }}
                  </v-chip>
                </dd>

                <dt>Active time</dt>
                <dd>{{ formatDuration(handshake.activity.activeMs) }}</dd>

                <dt>Inactive time</dt>
                <dd>{{ formatDuration(handshake.activity.inactiveMs) }}</dd>

                <dt>Activity (slot)</dt>
                <dd>{{ activityPercent }}</dd>

                <dt>Clocked in</dt>
                <dd>{{ handshake.activity.clockedIn === undefined ? '—' : handshake.activity.clockedIn ? 'Yes' : 'No' }}</dd>

                <dt>Captured at</dt>
                <dd>{{ formatDateTime(handshake.activity.capturedAt) }}</dd>
              </dl>
            </template>

            <v-alert
              v-if="handshake.error && handshake.status !== 'completed'"
              type="warning"
              variant="tonal"
              density="compact"
              class="mt-3"
            >
              {{ handshake.error }}
            </v-alert>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import NovaInOutServices from '@/services/NovaInOutServices'
import type { HandshakeView } from '@/types/handshake'
import {
  STATUS_COLOR,
  STATUS_LABEL,
  formatDateTime,
  formatDuration,
  formatLatency,
} from './handshakeFormat'

const props = defineProps<{
  modelValue: boolean
  handshake: HandshakeView | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const imageUrl = ref('')
const imageLoading = ref(false)
const imageError = ref('')

const activityPercent = computed(() => {
  const a = props.handshake?.activity
  if (!a || a.activeMs === undefined || a.inactiveMs === undefined) return '—'
  const total = a.activeMs + a.inactiveMs
  return total > 0 ? `${Math.round((a.activeMs / total) * 100)}% active` : '—'
})

/** La URL firmada se pide solo cuando hay imagen y cambia la key. */
watch(
  () => props.handshake?.imageKey,
  async (key) => {
    imageUrl.value = ''
    imageError.value = ''
    if (!key) return
    imageLoading.value = true
    try {
      imageUrl.value = await NovaInOutServices.getSignedUrl(key)
    } catch {
      imageError.value = 'Could not load the screenshot.'
    } finally {
      imageLoading.value = false
    }
  },
  { immediate: true },
)
</script>

<style scoped>
.hs__image {
  min-height: 280px;
  border-radius: var(--app-radius-xs, 4px);
  background: rgba(var(--v-theme-on-surface), 0.04);
  display: grid;
  place-items: center;
  overflow: hidden;
}

.hs__link {
  display: block;
  width: 100%;
  cursor: zoom-in;
}

.hs__img {
  width: 100%;
  max-height: 60vh;
}

.hs__state {
  display: grid;
  place-items: center;
  padding: 32px 16px;
  text-align: center;
  color: rgb(var(--v-theme-on-surface-variant));
}

.hs__grid {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 6px 16px;
  margin: 0;
  font-size: var(--app-text-sm, 0.875rem);
}

.hs__grid dt {
  color: rgb(var(--v-theme-on-surface-variant));
}

.hs__grid dd {
  margin: 0;
  min-width: 0;
  overflow-wrap: anywhere;
}
</style>
