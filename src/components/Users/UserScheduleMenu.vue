<!--
  src/components/Users/UserScheduleMenu.vue

  Menú de acciones de un horario base (editar, reemplazar, copiar, borrar).
-->
<template>
  <v-menu>
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        icon="mdi-dots-vertical"
        variant="text"
        size="small"
        :aria-label="`Actions for schedule ${describeRange(schedule)}`"
      />
    </template>
    <v-list density="compact">
      <v-list-item prepend-icon="mdi-pencil-outline" title="Edit" @click="emit('edit')" />
      <v-list-item
        v-if="schedule.type === 'fixed' && status !== 'past'"
        prepend-icon="mdi-swap-horizontal"
        title="Replace from date…"
        @click="emit('replace')"
      />
      <v-list-item
        v-if="schedule.type === 'variable'"
        prepend-icon="mdi-content-copy"
        title="Copy to the next period…"
        @click="emit('copy')"
      />
      <v-list-item
        prepend-icon="mdi-delete-outline"
        title="Delete"
        base-color="error"
        @click="emit('delete')"
      />
    </v-list>
  </v-menu>
</template>

<script setup lang="ts">
import type { EmployeeSchedule } from '@/types/schedules'
import { describeRange, type ScheduleStatus } from '@/utils/schedule'

defineProps<{ schedule: EmployeeSchedule; status: ScheduleStatus }>()
const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'replace'): void
  (e: 'copy'): void
  (e: 'delete'): void
}>()
</script>
