<!--
  src/components/Users/UserScheduleWeekStrip.vue

  Semana L–D de un horario: horas y lunch por día; el descanso va rayado.
  En pantallas estrechas pasa de 7 columnas a una fila por día.
-->
<template>
  <ul class="wk" :class="{ 'wk--compact': compact }" aria-label="Weekly schedule">
    <li
      v-for="day in days"
      :key="day.weekday"
      class="wk__day"
      :class="{ 'wk__day--rest': day.rest, 'wk__day--today': day.isToday }"
      :aria-label="ariaFor(day)"
      :aria-current="day.isToday ? 'date' : undefined"
    >
      <span class="wk__name" aria-hidden="true">
        {{ day.short }}
        <span v-if="showDates" class="wk__date">{{ shortDate(day.date) }}</span>
      </span>

      <template v-if="day.rest">
        <span class="wk__rest" aria-hidden="true">Rest</span>
      </template>
      <template v-else>
        <span class="wk__hours app-mono" aria-hidden="true">
          <span>{{ day.startTime }}</span>
          <span class="wk__dash">–</span>
          <span>{{ day.endTime }}</span>
        </span>
        <span class="wk__meta" aria-hidden="true">
          <span v-if="day.lunch" class="wk__lunch">Lunch {{ day.lunch }}</span>
          <span v-else class="wk__lunch">No lunch</span>
          <span class="wk__total">{{ formatMinutes(day.minutes) }}</span>
        </span>
      </template>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { formatShortDate } from '@/utils/schedule'
import { formatMinutes } from '@/utils/schedule-events'
import type { WeekStripDay } from '@/utils/user-schedule-view'

defineProps<{
  days: WeekStripDay[]
  /** Muestra la fecha bajo el día (horarios variables). */
  showDates?: boolean
  compact?: boolean
}>()

const shortDate = formatShortDate

function ariaFor(day: WeekStripDay): string {
  if (day.rest) return `${day.label}: rest day`
  const lunch = day.lunch ? `, lunch ${day.lunch.replace('–', ' to ')}` : ', no lunch'
  return `${day.label}: ${day.startTime} to ${day.endTime}${lunch}, ${formatMinutes(day.minutes)}`
}
</script>

<style scoped>
.wk {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: var(--app-space-2);
}

.wk__day {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-1);
  min-width: 0;
  padding: var(--app-space-2);
  border: 1px solid rgba(var(--v-theme-primary), 0.28);
  border-radius: var(--app-radius-md);
  background: rgba(var(--v-theme-primary), 0.08);
  font-size: var(--app-text-xs);
}

.wk__day--rest {
  border-color: rgba(var(--v-border-color), var(--v-border-opacity));
  background: repeating-linear-gradient(
    135deg,
    rgba(var(--v-theme-on-surface), 0.06) 0 6px,
    transparent 6px 12px
  );
  color: rgb(var(--v-theme-on-surface-variant));
}

.wk__day--today {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 1px;
}

.wk__name {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0 var(--app-space-2);
  font-weight: 600;
  font-size: var(--app-text-sm);
}

.wk__date {
  font-weight: 400;
  font-size: var(--app-text-2xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

.wk__hours {
  display: flex;
  flex-direction: column;
  font-size: var(--app-text-sm);
  line-height: 1.25;
}

.wk__dash {
  display: none;
}

.wk__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: rgb(var(--v-theme-on-surface-variant));
  font-size: var(--app-text-2xs);
  line-height: 1.3;
}

.wk__total {
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
}

.wk__rest {
  font-size: var(--app-text-xs);
  font-style: italic;
}

.wk--compact .wk__day {
  padding: var(--app-space-1) var(--app-space-2);
}

@media (max-width: 720px) {
  .wk {
    grid-template-columns: 1fr;
    gap: var(--app-space-1);
  }

  .wk__day {
    flex-direction: row;
    align-items: center;
    gap: var(--app-space-3);
    padding: var(--app-space-2) var(--app-space-3);
  }

  .wk__name {
    flex: none;
    width: 4.5rem;
    flex-direction: column;
    gap: 0;
  }

  .wk__hours {
    flex-direction: row;
    gap: 2px;
    flex: none;
  }

  .wk__dash {
    display: inline;
  }

  .wk__meta {
    flex: 1;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: var(--app-space-2);
  }
}
</style>
