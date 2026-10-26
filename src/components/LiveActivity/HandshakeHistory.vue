<!--
  Historial de handshakes de un usuario, listado dentro de la fila expandida.
  Cada entrada abre el detalle (imagen + actividad).
-->
<template>
  <div class="hh">
    <div v-if="loading" class="hh__state">
      <v-progress-circular indeterminate size="20" width="2" />
    </div>

    <p v-else-if="error" class="hh__state text-error">{{ error }}</p>

    <p v-else-if="!items.length" class="hh__state text-medium-emphasis">No handshakes yet.</p>

    <v-list v-else density="compact" class="hh__list" lines="one">
      <v-list-item
        v-for="h in items"
        :key="h.id"
        class="hh__item"
        @click="emit('open', h)"
      >
        <template #prepend>
          <v-chip :color="STATUS_COLOR[h.status]" size="x-small" variant="tonal" class="mr-3">
            {{ STATUS_LABEL[h.status] }}
          </v-chip>
        </template>

        <v-list-item-title class="text-body-2">
          {{ formatDateTime(h.requestedAt) }}
          <span class="text-medium-emphasis"> · by {{ h.requestedByName ?? '—' }}</span>
        </v-list-item-title>

        <template #append>
          <span class="text-caption text-medium-emphasis mr-3">{{ formatLatency(h.latencyMs) }}</span>
          <v-icon size="small">mdi-chevron-right</v-icon>
        </template>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { http } from '@/lib/http'
import type { HandshakeView } from '@/types/handshake'
import { STATUS_COLOR, STATUS_LABEL, formatDateTime, formatLatency } from './handshakeFormat'

const props = defineProps<{
  userId: string
  /** Cambia cuando hay que recargar (nuevo resultado de un handshake). */
  refreshKey?: number
}>()

const emit = defineEmits<{
  (e: 'open', handshake: HandshakeView): void
}>()

const items = ref<HandshakeView[]>([])
const loading = ref(false)
const error = ref('')

async function load(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const res = await http.get<HandshakeView[]>('/handshakes', { params: { userId: props.userId } })
    items.value = Array.isArray(res.data) ? res.data : []
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Could not load the history.'
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(() => [props.userId, props.refreshKey], load, { immediate: true })
</script>

<style scoped>
.hh {
  padding: var(--app-space-2, 8px) var(--app-space-4, 16px) var(--app-space-3, 12px);
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.hh__state {
  margin: 0;
  padding: var(--app-space-3, 12px) 0;
  font-size: var(--app-text-sm, 0.875rem);
}

.hh__list {
  background: transparent;
  padding: 0;
}

.hh__item {
  cursor: pointer;
  border-radius: var(--app-radius-xs, 4px);
}
</style>
