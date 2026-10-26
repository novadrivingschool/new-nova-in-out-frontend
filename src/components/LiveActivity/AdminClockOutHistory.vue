<!--
  Historial de clock-outs hechos por un admin para un empleado.
  Independiente del historial de handshakes.
-->
<template>
  <div class="ah">
    <div v-if="loading" class="ah__state">
      <v-progress-circular indeterminate size="20" width="2" />
    </div>

    <p v-else-if="error" class="ah__state text-error">{{ error }}</p>

    <p v-else-if="!items.length" class="ah__state text-medium-emphasis">No admin clock outs yet.</p>

    <v-list v-else density="compact" class="ah__list" lines="two">
      <v-list-item v-for="h in items" :key="h.id" class="ah__item">
        <template #prepend>
          <v-chip color="warning" size="x-small" variant="tonal" class="mr-3">
            {{ reasonLabel(h.reason) }}
          </v-chip>
        </template>

        <v-list-item-title class="text-body-2">
          {{ formatDateTime(h.created_at) }}
          <span class="text-medium-emphasis"> · by {{ h.admin_name || '—' }}</span>
        </v-list-item-title>
        <v-list-item-subtitle>
          Last activity: {{ lastActivity(h) }}<template v-if="h.note"> · {{ h.note }}</template>
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import NovaInOutServices from '@/services/NovaInOutServices'
import {
  FORCE_CLOCK_OUT_REASON_LABEL,
  type AdminClockOutView,
  type ForceClockOutReason,
} from '@/types/adminClockOut'
import { formatDateTime } from './handshakeFormat'

const props = defineProps<{
  employeeNumber: string
  /** Cambia cuando hay que recargar (nuevo clock out de admin). */
  refreshKey?: number
}>()

const items = ref<AdminClockOutView[]>([])
const loading = ref(false)
const error = ref('')

function reasonLabel(reason: string): string {
  return FORCE_CLOCK_OUT_REASON_LABEL[reason as ForceClockOutReason] ?? reason
}

function lastActivity(h: AdminClockOutView): string {
  if (!h.last_activity_time) return '—'
  return `${h.last_activity_date ?? ''} ${h.last_activity_time.slice(0, 5)}`.trim()
}

async function load(): Promise<void> {
  if (!props.employeeNumber) {
    items.value = []
    return
  }
  loading.value = true
  error.value = ''
  try {
    items.value = await NovaInOutServices.getAdminClockOutHistory(props.employeeNumber)
  } catch (e: any) {
    error.value = e?.response?.data?.message ?? 'Could not load the history.'
    items.value = []
  } finally {
    loading.value = false
  }
}

watch(() => [props.employeeNumber, props.refreshKey], load, { immediate: true })
</script>

<style scoped>
.ah {
  padding: var(--app-space-2, 8px) var(--app-space-4, 16px) var(--app-space-3, 12px);
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.ah__state {
  margin: 0;
  padding: var(--app-space-3, 12px) 0;
  font-size: var(--app-text-sm, 0.875rem);
}

.ah__list {
  background: transparent;
  padding: 0;
}
</style>
