<!--
  src/components/Users/UserScheduleHistoryList.vue

  Otros horarios de la persona (vigentes en paralelo, próximos y pasados) en
  una lista plegable. Con acciones solo cuando no es viewOnly.
-->
<template>
  <section v-if="schedules.length" class="hist">
    <v-btn
      variant="text"
      size="small"
      class="hist__toggle"
      :prepend-icon="open ? 'mdi-chevron-down' : 'mdi-chevron-right'"
      :aria-expanded="open"
      :aria-controls="listId"
      @click="open = !open"
    >
      Other schedules ({{ schedules.length }})
    </v-btn>

    <ul v-show="open" :id="listId" class="hist__list">
      <li
        v-for="item in schedules"
        :key="item.id"
        class="hist__item"
        :class="{ 'hist__item--past': statusOf(item) === 'past' }"
      >
        <div class="hist__main">
          <div class="hist__top">
            <v-chip size="x-small" variant="tonal" label>
              {{ item.type === 'fixed' ? 'Fixed' : 'Variable' }}
            </v-chip>
            <v-chip size="x-small" variant="tonal" label :color="STATUS[statusOf(item)].color">
              {{ STATUS[statusOf(item)].label }}
            </v-chip>
            <span class="hist__range">{{ describeRange(item) }}</span>
          </div>
          <ul class="hist__days">
            <li v-for="group in summarizeDays(item.days)" :key="group.days + group.hours">
              <span class="hist__days-label">{{ group.days }}</span>
              <span class="app-mono">{{ group.hours }}</span>
              <span class="hist__lunch">
                {{ group.lunch ? `lunch ${group.lunch}` : 'no lunch' }}
              </span>
            </li>
          </ul>
          <p v-if="item.notes" class="hist__notes">{{ item.notes }}</p>
        </div>

        <UserScheduleMenu
          v-if="!viewOnly"
          :schedule="item"
          :status="statusOf(item)"
          @edit="emit('edit', item)"
          @replace="emit('replace', item)"
          @copy="emit('copy', item)"
          @delete="emit('delete', item)"
        />
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import UserScheduleMenu from '@/components/Users/UserScheduleMenu.vue'
import type { EmployeeSchedule } from '@/types/schedules'
import {
  describeRange,
  scheduleStatus,
  summarizeDays,
  type ScheduleStatus,
} from '@/utils/schedule'

defineProps<{ schedules: EmployeeSchedule[]; viewOnly?: boolean }>()
const emit = defineEmits<{
  (e: 'edit', item: EmployeeSchedule): void
  (e: 'replace', item: EmployeeSchedule): void
  (e: 'copy', item: EmployeeSchedule): void
  (e: 'delete', item: EmployeeSchedule): void
}>()

const STATUS: Record<ScheduleStatus, { label: string; color: string }> = {
  current: { label: 'Current', color: 'success' },
  upcoming: { label: 'Upcoming', color: 'info' },
  past: { label: 'Past', color: 'default' },
}

const open = ref(false)
const listId = `hist-${Math.random().toString(36).slice(2, 8)}`
const statusOf = (item: EmployeeSchedule) => scheduleStatus(item)
</script>

<style scoped>
.hist__toggle {
  margin-left: calc(var(--app-space-2) * -1);
}

.hist__list {
  list-style: none;
  margin: var(--app-space-2) 0 0;
  padding: 0;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--app-radius-md);
}

.hist__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-3);
  padding: var(--app-space-3);
}

.hist__item + .hist__item {
  border-top: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.hist__item--past {
  opacity: 0.75;
}

.hist__main {
  min-width: 0;
}

.hist__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-2);
}

.hist__range {
  font-size: var(--app-text-base);
  font-weight: 550;
}

.hist__days {
  list-style: none;
  margin: var(--app-space-2) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--app-text-sm);
}

.hist__days li {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-1) var(--app-space-3);
}

.hist__days-label {
  min-width: 7.5rem;
  font-weight: 500;
}

.hist__lunch,
.hist__notes {
  color: rgb(var(--v-theme-on-surface-variant));
}

.hist__notes {
  margin: var(--app-space-2) 0 0;
  font-size: var(--app-text-sm);
  overflow-wrap: anywhere;
}
</style>
