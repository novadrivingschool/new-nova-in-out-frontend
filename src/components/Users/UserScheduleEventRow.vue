<!--
  src/components/Users/UserScheduleEventRow.vue

  Una fila de la lista de eventos de un usuario: barra e ícono del color del
  tipo, rango de fechas legible, status solo si no está aprobado y justified
  solo en ausencias. Con `viewOnly` no hay acciones y el motivo es texto
  secundario.
-->
<template>
  <div class="evr" :class="{ 'evr--compact': compact }" :style="{ '--ev': meta.hex }">
    <span class="evr__icon" aria-hidden="true"><v-icon size="18">{{ meta.icon }}</v-icon></span>

    <div class="evr__main">
      <div class="evr__top">
        <strong class="evr__label">{{ meta.label }}</strong>
        <v-chip
          v-if="item.status !== 'approved'"
          size="x-small"
          label
          variant="tonal"
          :color="STATUS_META[item.status].color"
        >
          {{ STATUS_META[item.status].label }}
        </v-chip>
        <v-chip
          v-if="item.type === 'absence'"
          size="x-small"
          label
          variant="tonal"
          :color="item.justified ? 'success' : 'error'"
        >
          {{ item.justified ? 'Justified' : 'Unjustified' }}
        </v-chip>
        <span v-if="inProgress" class="evr__now">In progress</span>
      </div>
      <div class="evr__when">{{ when }}</div>
      <p v-if="item.reason" class="evr__reason">{{ item.reason }}</p>
    </div>

    <v-btn
      v-if="!viewOnly"
      class="evr__action"
      icon="mdi-pencil-outline"
      variant="text"
      size="small"
      :aria-label="`Edit ${meta.label}, ${when}`"
      @click="emit('edit')"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ScheduleEvent } from '@/types/schedule-events'
import { todayIso } from '@/utils/schedule'
import { EVENT_META, STATUS_META } from '@/utils/schedule-events'
import { describeEventRange } from '@/utils/user-schedule-view'

const props = defineProps<{ item: ScheduleEvent; viewOnly?: boolean; compact?: boolean }>()
const emit = defineEmits<{ (e: 'edit'): void }>()

const meta = computed(() => EVENT_META[props.item.type])
const when = computed(() => describeEventRange(props.item))
const inProgress = computed(() => {
  const today = todayIso()
  return props.item.startDate <= today && props.item.endDate >= today
})
</script>

<style scoped>
.evr {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-3);
  padding: var(--app-space-3);
  border-left: 4px solid var(--ev);
}

.evr--compact {
  padding: var(--app-space-2) var(--app-space-3);
}

.evr__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 28px;
  height: 28px;
  color: var(--ev);
  background: color-mix(in srgb, var(--ev) 14%, transparent);
  border-radius: var(--app-radius-sm);
}

.evr__main {
  flex: 1;
  min-width: 0;
}

.evr__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-1) var(--app-space-2);
  font-size: var(--app-text-base);
}

.evr__now {
  font-size: var(--app-text-xs);
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.evr__when {
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}

.evr__reason {
  margin: var(--app-space-1) 0 0;
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
  overflow-wrap: anywhere;
}

.evr__action {
  flex: none;
  margin-top: -2px;
}
</style>
