<!--
  src/components/Users/ScheduleHistoryDialog.vue

  Bitácora de cambios de los horarios de un usuario (altas, ediciones, cierres
  y borrados), con quién y cuándo. Solo lectura.
-->
<template>
  <BaseDialog
    title="Schedule history"
    :show="show"
    :width="720"
    :loading="loading"
    @close="$emit('close')"
  >
    <template #dialog-body>
      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        density="compact"
        :text="errorMessage"
      />

      <EmptyState
        v-else-if="!loading && !revisions.length"
        title="No changes recorded yet"
        description="Every time a schedule is created, edited, ended or deleted it will show up here."
      />

      <ol v-else class="hist">
        <li v-for="rev in revisions" :key="rev.id" class="hist__item">
          <div class="hist__top">
            <v-chip
              size="x-small"
              variant="tonal"
              :color="ACTION_META[rev.action].color"
              label
            >
              {{ ACTION_META[rev.action].label }}
            </v-chip>
            <span class="hist__who">
              {{ rev.changedByName ?? 'Unknown user' }}
            </span>
            <time class="hist__when" :datetime="rev.changedAt">
              {{ formatDateTime(rev.changedAt) }}
            </time>
          </div>

          <p class="hist__what">
            <strong>{{ rev.snapshot.type === 'fixed' ? 'Fixed' : 'Variable' }}</strong>
            · {{ describeRange(rev.snapshot) }}
          </p>
          <p class="hist__days">{{ describeDays(rev.snapshot.days) }}</p>
          <p v-if="rev.snapshot.notes" class="hist__notes">“{{ rev.snapshot.notes }}”</p>
        </li>
      </ol>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { schedulesService } from '@/services/schedules.service'
import type { ScheduleRevision } from '@/types/schedules'
import {
  ACTION_META,
  describeDays,
  describeRange,
  formatDateTime,
  parseApiError,
} from '@/utils/schedule'

const props = defineProps<{ show: boolean; userId: string }>()
defineEmits<{ (e: 'close'): void }>()

const revisions = ref<ScheduleRevision[]>([])
const loading = ref(false)
const errorMessage = ref('')

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    revisions.value = await schedulesService.history(props.userId)
  } catch (error) {
    errorMessage.value = parseApiError(error, 'Could not load the history.')
  } finally {
    loading.value = false
  }
}

// Se recarga cada vez que se abre para no mostrar datos viejos.
watch(
  () => props.show,
  (open) => {
    if (open) load()
  },
  { immediate: true },
)
</script>

<style scoped>
.hist {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.hist__item {
  padding: var(--app-space-3) 0;
}

.hist__item + .hist__item {
  border-top: 1px solid rgba(var(--v-border-color), 1);
}

.hist__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-2) var(--app-space-3);
  font-size: var(--app-text-sm);
}

.hist__who {
  font-weight: 550;
}

.hist__when {
  color: rgb(var(--v-theme-on-surface-variant));
  margin-inline-start: auto;
}

.hist__what,
.hist__days,
.hist__notes {
  margin: var(--app-space-1) 0 0;
  font-size: var(--app-text-sm);
  overflow-wrap: anywhere;
}

.hist__days,
.hist__notes {
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
