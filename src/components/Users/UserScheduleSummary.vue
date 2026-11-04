<!--
  src/components/Users/UserScheduleSummary.vue

  Resumen visual de un horario base: tipo, estado, vigencia, tira semanal,
  total de horas y notas. Las acciones entran por el slot `actions`.
-->
<template>
  <section class="sum" :aria-label="`${typeLabel} schedule, ${statusLabel}`">
    <div class="sum__top">
      <div class="sum__title">
        <v-chip size="small" variant="tonal" label>{{ typeLabel }}</v-chip>
        <v-chip size="small" variant="tonal" label :color="STATUS[status].color">
          {{ STATUS[status].label }}
        </v-chip>
        <span class="sum__range">{{ describeRange(schedule) }}</span>
      </div>
      <div v-if="$slots.actions" class="sum__actions"><slot name="actions" /></div>
    </div>

    <UserScheduleWeekStrip
      :days="strip"
      :show-dates="schedule.type === 'variable'"
      :compact="compact"
    />

    <p class="sum__total">
      <span class="sum__total-value">{{ formatMinutes(total) }}</span>
      {{ schedule.type === 'fixed' ? 'per week' : 'in the week shown' }}
    </p>

    <p v-if="schedule.notes" class="sum__notes">{{ schedule.notes }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import UserScheduleWeekStrip from '@/components/Users/UserScheduleWeekStrip.vue'
import type { EmployeeSchedule } from '@/types/schedules'
import { describeRange, scheduleStatus, type ScheduleStatus } from '@/utils/schedule'
import { formatMinutes } from '@/utils/schedule-events'
import { buildWeekStrip, weekMinutes } from '@/utils/user-schedule-view'

const props = defineProps<{ schedule: EmployeeSchedule; compact?: boolean }>()

const STATUS: Record<ScheduleStatus, { label: string; color: string }> = {
  current: { label: 'Current', color: 'success' },
  upcoming: { label: 'Upcoming', color: 'info' },
  past: { label: 'Past', color: 'default' },
}

const status = computed(() => scheduleStatus(props.schedule))
const statusLabel = computed(() => STATUS[status.value].label.toLowerCase())
const typeLabel = computed(() => (props.schedule.type === 'fixed' ? 'Fixed' : 'Variable'))
const strip = computed(() => buildWeekStrip(props.schedule))
const total = computed(() => weekMinutes(strip.value))
</script>

<style scoped>
.sum {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
}

.sum__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-2) var(--app-space-3);
}

.sum__title {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-2);
  min-width: 0;
}

.sum__range {
  font-size: var(--app-text-md);
  font-weight: 550;
}

.sum__actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-1);
}

.sum__total {
  margin: 0;
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}

.sum__total-value {
  font-weight: 600;
  font-size: var(--app-text-md);
  color: rgb(var(--v-theme-on-surface));
}

.sum__notes {
  margin: 0;
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
  overflow-wrap: anywhere;
}
</style>
