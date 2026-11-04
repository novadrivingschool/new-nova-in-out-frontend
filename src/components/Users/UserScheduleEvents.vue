<!--
  src/components/Users/UserScheduleEvents.vue

  Eventos de calendario de un usuario (vacaciones, descansos, permisos, horas
  extra, ausencias): los de los últimos 60 días y los futuros. Los próximos van
  primero; los pasados quedan plegados.
  - viewOnly (ficha del usuario): solo informativo, compacto y sin acciones.
  - editable (Master Schedule): emite `add` y `edit` para que el padre abra el diálogo.
  - embedded: sin tarjeta ni título (lo aporta el diálogo de persona).
-->
<template>
  <v-card :variant="embedded ? 'flat' : 'elevated'" :class="embedded ? 'uev--embedded' : 'mb-4'">
    <div class="uev__head">
      <div class="uev__heading">
        <h2 v-if="!embedded" class="uev__title">Time away &amp; overtime</h2>
        <p class="uev__subtitle">
          Vacation, days off, time off requests, overtime and absences. Chicago time (CT).
        </p>
      </div>

      <v-btn
        v-if="!viewOnly"
        color="primary"
        variant="flat"
        size="small"
        prepend-icon="mdi-plus"
        @click="emit('add')"
      >
        Add event
      </v-btn>
    </div>
    <v-divider v-if="!embedded" />

    <ActivityLoader v-if="loading" label="Loading events…" />

    <v-alert
      v-else-if="errorMessage"
      type="error"
      variant="tonal"
      density="compact"
      class="ma-4"
    >
      {{ errorMessage }}
      <template #append>
        <v-btn size="small" variant="text" @click="load">Retry</v-btn>
      </template>
    </v-alert>

    <div v-else class="uev__body">
      <section v-if="upcoming.length" aria-labelledby="uev-upcoming">
        <h3 id="uev-upcoming" class="uev__group">Current &amp; upcoming</h3>
        <ul class="uev__list">
          <li v-for="item in upcoming" :key="item.id">
            <EventRow
              :item="item"
              :view-only="viewOnly"
              :compact="viewOnly"
              @edit="emit('edit', item)"
            />
          </li>
        </ul>
      </section>

      <EmptyState
        v-else
        :title="past.length ? 'Nothing coming up' : 'No events registered'"
        :description="
          viewOnly
            ? 'Nothing in the last 60 days or coming up.'
            : 'Add vacation, a day off, time off, overtime or an absence for this person.'
        "
      >
        <template v-if="!viewOnly" #actions>
          <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="emit('add')">
            Add event
          </v-btn>
        </template>
      </EmptyState>

      <section v-if="past.length">
        <v-btn
          variant="text"
          size="small"
          class="uev__toggle"
          :prepend-icon="pastOpen ? 'mdi-chevron-down' : 'mdi-chevron-right'"
          :aria-expanded="pastOpen"
          aria-controls="uev-past"
          @click="pastOpen = !pastOpen"
        >
          Past 60 days ({{ past.length }})
        </v-btn>
        <ul v-show="pastOpen" id="uev-past" class="uev__list uev__list--past">
          <li v-for="item in past" :key="item.id">
            <EventRow
              :item="item"
              :view-only="viewOnly"
              :compact="viewOnly"
              @edit="emit('edit', item)"
            />
          </li>
        </ul>
      </section>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import ActivityLoader from '@/components/common/ActivityLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import EventRow from '@/components/Users/UserScheduleEventRow.vue'
import { scheduleEventsService } from '@/services/schedule-events.service'
import type { ScheduleEvent } from '@/types/schedule-events'
import { addDaysIso, parseApiError, todayIso } from '@/utils/schedule'

const props = withDefaults(
  defineProps<{ userId: string; viewOnly?: boolean; embedded?: boolean }>(),
  { viewOnly: false, embedded: false },
)

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'edit', event: ScheduleEvent): void
  /** Eventos cargados (para mostrar conteos en el padre). */
  (e: 'loaded', events: ScheduleEvent[]): void
}>()

const events = ref<ScheduleEvent[]>([])
const loading = ref(true)
const errorMessage = ref('')
const pastOpen = ref(false)

const upcoming = computed(() => {
  const today = todayIso()
  return events.value
    .filter((e) => e.endDate >= today)
    .sort(
      (a, b) =>
        a.startDate.localeCompare(b.startDate) ||
        (a.startTime ?? '').localeCompare(b.startTime ?? ''),
    )
})
const past = computed(() => {
  const today = todayIso()
  return events.value.filter((e) => e.endDate < today) // la API ya los devuelve del más reciente al más antiguo
})

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    events.value = await scheduleEventsService.list(props.userId, {
      from: addDaysIso(todayIso(), -60),
    })
    emit('loaded', events.value)
  } catch (error) {
    errorMessage.value = parseApiError(error, 'Could not load the events.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.userId, load)

defineExpose({ reload: load })
</script>

<style scoped>
.uev--embedded {
  background: transparent;
}

.uev--embedded .uev__head,
.uev--embedded .uev__body {
  padding-left: 0;
  padding-right: 0;
}

.uev__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-3);
  flex-wrap: wrap;
  padding: var(--app-space-3) var(--app-space-4);
}

.uev__title {
  margin: 0;
  font-size: var(--app-text-md);
  font-weight: 600;
}

.uev__subtitle {
  margin: 2px 0 0;
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

.uev__body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-2);
  padding: var(--app-space-3) var(--app-space-4) var(--app-space-4);
}

.uev__group {
  margin: 0 0 var(--app-space-2);
  font-size: var(--app-text-sm);
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
}

.uev__toggle {
  margin-left: calc(var(--app-space-2) * -1);
}

.uev__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--app-space-2);
}

.uev__list > li {
  overflow: hidden;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  border-radius: var(--app-radius-md);
}

.uev__list--past {
  margin-top: var(--app-space-2);
  opacity: 0.8;
}
</style>
