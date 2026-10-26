<!--
  src/components/Users/ScheduleFormDialog.vue

  Alta / edición de un horario.
  - Fijo: recurrente semana a semana; fecha de inicio y (opcional) de término.
  - Variable: un periodo libre (de una fecha a otra); cada FECHA tiene su propio
    horario (dos semanas = 14 filas independientes).
  Los días sin marcar son descanso. Todas las horas son hora de Chicago.
-->
<template>
  <BaseDialog
    :title="dialogTitle"
    :show="show"
    :width="780"
    persistent
    :loading="saving"
    @close="requestClose"
  >
    <template #dialog-body>
      <v-form ref="formRef" @submit.prevent="submit">
        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-4"
          :text="errorMessage"
        />

        <v-alert
          v-if="isEdit && hasStarted"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-4"
          text="This schedule has already started: changes also apply to the days already worked under it. To change the schedule going forward, use “Replace from date…” instead. Every change is recorded in the history."
        />

        <!-- Tipo -->
        <v-label class="sched-form__label">Type</v-label>
        <v-btn-toggle
          v-model="form.type"
          mandatory
          divided
          variant="outlined"
          density="comfortable"
          class="mb-1 sched-form__toggle"
          :disabled="isEdit"
          @update:model-value="onTypeChange"
        >
          <v-btn value="fixed" prepend-icon="mdi-calendar-sync">Fixed</v-btn>
          <v-btn value="variable" prepend-icon="mdi-calendar-week">Variable</v-btn>
        </v-btn-toggle>
        <p class="sched-form__hint mb-4">
          {{
            form.type === 'fixed'
              ? 'Repeats every week until you give it an end date. To change it later, register a new fixed schedule.'
              : 'A specific period, from one date to another. Every date has its own hours, so each week can be different. Turn off the dates that are not worked, e.g. weekends.'
          }}
        </p>

        <!-- Vigencia -->
        <v-row dense>
          <v-col cols="12" sm="6">
            <v-label class="sched-form__label">
              {{ form.type === 'fixed' ? 'Starts on' : 'From' }}
            </v-label>
            <v-text-field
              v-model="form.validFrom"
              type="date"
              :rules="[rules.required]"
              :density="density"
            />
          </v-col>

          <v-col v-if="form.type === 'fixed'" cols="12" sm="6">
            <v-label class="sched-form__label">Ends on</v-label>
            <v-switch
              v-model="form.hasEnd"
              color="primary"
              density="compact"
              hide-details
              :label="form.hasEnd ? 'Has an end date' : 'No end date'"
            />
            <v-text-field
              v-if="form.hasEnd"
              v-model="form.validTo"
              type="date"
              :rules="[rules.required, rules.endAfterStart]"
              :density="density"
              :min="form.validFrom"
              class="mt-1"
            />
          </v-col>

          <v-col v-if="form.type === 'variable'" cols="12" sm="6">
            <v-label class="sched-form__label">To (included)</v-label>
            <v-text-field
              v-model="form.validTo"
              type="date"
              :rules="[rules.required, rules.endAfterStart, rules.maxSpan]"
              :min="form.validFrom"
              :density="density"
              :hint="spanText"
              persistent-hint
            />
          </v-col>
        </v-row>

        <v-alert
          v-if="closesPrevious"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-4"
          :text="`The current fixed schedule (${describeRange(closesPrevious)}) will end on ${formatDate(addDaysIso(form.validFrom, -1))}.`"
        />

        <!-- Días -->
        <div class="sched-form__days-head">
          <v-label class="sched-form__label mb-0">Working days</v-label>
          <div class="sched-form__days-actions">
            <v-btn
              v-if="hasWeekendRows"
              variant="text"
              size="small"
              :prepend-icon="weekendsExcluded ? 'mdi-calendar-plus' : 'mdi-calendar-remove'"
              @click="toggleWeekends"
            >
              {{ weekendsExcluded ? 'Include Sat & Sun' : 'Exclude Sat & Sun' }}
            </v-btn>
            <v-btn
              variant="text"
              size="small"
              prepend-icon="mdi-content-copy"
              :disabled="!firstEnabled"
              @click="copyFirstToAll"
            >
              Copy first day to all
            </v-btn>
          </div>
        </div>

        <div class="sched-form__days">
          <template v-for="row in rows" :key="row.day.date ?? row.day.weekday">
          <div v-if="row.header" class="sched-week">
            <span class="sched-week__label">{{ row.header }}</span>
            <v-btn
              variant="text"
              size="x-small"
              prepend-icon="mdi-content-copy"
              @click="copyFirstOfWeek(row.day)"
            >
              Copy first day to this week
            </v-btn>
          </div>
          <div
            class="sched-day"
            :class="{ 'sched-day--off': !row.day.enabled }"
          >
            <div class="sched-day__toggle">
              <v-switch
                v-model="row.day.enabled"
                color="primary"
                density="compact"
                hide-details
                :label="weekdayLabel(row.day.weekday)"
              />
              <span v-if="row.day.date" class="sched-day__dates">
                {{ formatShortDate(row.day.date) }}
              </span>
            </div>

            <template v-if="row.day.enabled">
              <v-text-field
                v-model="row.day.startTime"
                type="time"
                label="Start"
                :density="density"
                hide-details
                class="sched-day__time"
              />
              <v-text-field
                v-model="row.day.endTime"
                type="time"
                label="End"
                :density="density"
                hide-details
                class="sched-day__time"
              />
              <v-switch
                v-model="row.day.lunch"
                color="primary"
                density="compact"
                hide-details
                label="Lunch"
                class="sched-day__lunch"
              />
              <template v-if="row.day.lunch">
                <v-text-field
                  v-model="row.day.lunchStart"
                  type="time"
                  label="Lunch from"
                  :density="density"
                  hide-details
                  class="sched-day__time sched-day__lunch-from"
                />
                <v-text-field
                  v-model="row.day.lunchEnd"
                  type="time"
                  label="Lunch to"
                  :density="density"
                  hide-details
                  class="sched-day__time sched-day__lunch-to"
                />
              </template>
            </template>
            <span v-else class="sched-day__off text-medium-emphasis">Day off</span>

            <p v-if="dayError(row.day)" class="sched-day__error" role="alert">
              {{ dayError(row.day) }}
            </p>
          </div>
          </template>
        </div>
        <p v-if="!anyEnabled" class="sched-day__error mt-2" role="alert">
          Pick at least one working day.
        </p>

        <!-- Notas -->
        <v-label class="sched-form__label mt-4">Notes (optional)</v-label>
        <v-textarea
          v-model="form.notes"
          rows="2"
          auto-grow
          counter="500"
          :rules="[rules.notesMax]"
          :density="density"
          placeholder="e.g. Covering the Saturday class"
        />
      </v-form>
    </template>

    <template #dialog-actions>
      <v-btn variant="text" :size="btnSize" :disabled="saving" @click="requestClose">
        Cancel
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        :size="btnSize"
        :loading="saving"
        :disabled="!canSubmit"
        @click="submit"
      >
        {{ isEdit ? 'Save changes' : 'Save schedule' }}
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import { useResponsive } from '@/composables/useResponsive'
import { schedulesService } from '@/services/schedules.service'
import type {
  EmployeeSchedule,
  ScheduleDay,
  ScheduleType,
} from '@/types/schedules'
import {
  WEEKDAYS,
  MAX_VARIABLE_DAYS,
  addDaysIso,
  daysBetweenIso,
  describeRange,
  formatDate,
  formatShortDate,
  mondayOf,
  isoWeekdayOf,
  parseApiError,
  scheduleStatus,
  todayIso,
  weekdayDates,
} from '@/utils/schedule'

interface DayForm {
  weekday: number
  /** variable: fecha concreta de la fila · fixed: null. */
  date: string | null
  enabled: boolean
  startTime: string
  endTime: string
  lunch: boolean
  lunchStart: string
  lunchEnd: string
}

/** Valores iniciales cuando se parte de un horario existente (duplicar/reemplazar). */
export interface ScheduleTemplate {
  type: ScheduleType
  validFrom: string
  validTo?: string | null
  days: ScheduleDay[]
  notes?: string | null
}

const props = defineProps<{
  show: boolean
  userId: string
  /** Si viene, se edita este horario; si no, se crea uno nuevo. */
  schedule?: EmployeeSchedule | null
  template?: ScheduleTemplate | null
  /** Horarios actuales del usuario, para avisar si uno fijo será cerrado. */
  existing: EmployeeSchedule[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', schedule: EmployeeSchedule): void
}>()

const { density, btnSize } = useResponsive()

const formRef = ref<any>(null)
const saving = ref(false)
const errorMessage = ref('')
const dirty = ref(false)

const isEdit = computed(() => !!props.schedule)
const hasStarted = computed(
  () => !!props.schedule && scheduleStatus(props.schedule) !== 'upcoming',
)

const dialogTitle = computed(() => {
  if (isEdit.value) return 'Edit schedule'
  return props.template ? 'New schedule from a previous one' : 'Add schedule'
})

const form = reactive({
  type: 'fixed' as ScheduleType,
  validFrom: '',
  hasEnd: false,
  validTo: '',
  notes: '',
  /** fixed: 7 filas, una por día de la semana. */
  days: [] as DayForm[],
  /** variable: una fila por fecha del periodo. */
  dated: [] as DayForm[],
})

/**
 * Todas las filas por fecha que se han creado, indexadas por fecha: al mover el
 * rango no se pierde lo capturado en fechas que salen y vuelven a entrar.
 */
let datedCache = new Map<string, DayForm>()
let initializing = false

function defaultDays(): DayForm[] {
  return WEEKDAYS.map((d) => ({
    weekday: d.value,
    date: null,
    enabled: d.value <= 5,
    startTime: '09:00',
    endTime: '18:00',
    lunch: false,
    lunchStart: '14:00',
    lunchEnd: '15:00',
  }))
}

function daysFrom(source: ScheduleDay[]): DayForm[] {
  const byWeekday = new Map(source.map((d) => [d.weekday, d]))
  return WEEKDAYS.map((w) => {
    const d = byWeekday.get(w.value)
    return {
      weekday: w.value,
      date: null,
      enabled: !!d,
      startTime: d?.startTime ?? '09:00',
      endTime: d?.endTime ?? '18:00',
      lunch: !!(d?.lunchStart && d?.lunchEnd),
      lunchStart: d?.lunchStart ?? '14:00',
      lunchEnd: d?.lunchEnd ?? '15:00',
    }
  })
}

function datedRowFor(date: string, source?: ScheduleDay): DayForm {
  const cached = datedCache.get(date)
  if (cached) return cached
  const weekday = isoWeekdayOf(date)
  const row: DayForm = {
    weekday,
    date,
    enabled: source ? true : weekday <= 5,
    startTime: source?.startTime ?? '09:00',
    endTime: source?.endTime ?? '18:00',
    lunch: !!(source?.lunchStart && source?.lunchEnd),
    lunchStart: source?.lunchStart ?? '14:00',
    lunchEnd: source?.lunchEnd ?? '15:00',
  }
  datedCache.set(date, row)
  return row
}

/** Reconstruye las filas por fecha según el rango actual (si es válido). */
function rebuildDated(): void {
  if (form.type !== 'variable') return
  const end = form.validTo
  if (!form.validFrom || !end || end < form.validFrom || daysBetweenIso(form.validFrom, end) > MAX_VARIABLE_DAYS) {
    form.dated = []
    return
  }
  const total = daysBetweenIso(form.validFrom, end)
  form.dated = Array.from({ length: total }, (_, i) => datedRowFor(addDaysIso(form.validFrom, i)))
}

function init(): void {
  initializing = true
  errorMessage.value = ''
  datedCache = new Map()
  const source = props.schedule ?? props.template ?? null

  if (props.schedule) {
    form.type = props.schedule.type
    form.validFrom = props.schedule.validFrom
    form.hasEnd = props.schedule.type === 'fixed' && props.schedule.validTo !== null
    form.validTo = props.schedule.validTo ?? ''
    form.notes = props.schedule.notes ?? ''
    form.days = daysFrom(props.schedule.type === 'fixed' ? props.schedule.days : [])
  } else {
    form.type = source?.type ?? 'fixed'
    form.validFrom = source?.validFrom ?? defaultStart(form.type)
    form.hasEnd = form.type === 'fixed' && !!props.template?.validTo
    form.validTo =
      props.template?.validTo ??
      (form.type === 'variable' ? addDaysIso(form.validFrom, 6) : '')
    form.notes = source?.notes ?? ''
    form.days = source && source.type === 'fixed' ? daysFrom(source.days) : defaultDays()
  }

  // Un variable existente/plantilla aporta sus bloques por fecha a la caché.
  if (source?.type === 'variable') {
    for (const d of source.days) if (d.date) datedRowFor(d.date, d)
  }
  form.dated = []
  rebuildDated()

  initializing = false
  // El watcher de `form` es síncrono: al llegar aquí ya marcó "sucio" por la
  // carga inicial, así que se limpia al final.
  dirty.value = false
}

function defaultStart(type: ScheduleType): string {
  const next = mondayOf(addDaysIso(todayIso(), 7))
  return type === 'variable' ? next : todayIso()
}

watch(
  () => props.show,
  (open) => {
    if (open) init()
  },
  { immediate: true },
)

// Cualquier cambio posterior a abrir el diálogo cuenta como "sin guardar".
watch(form, () => (dirty.value = true), { deep: true, flush: 'sync' })

// Al cambiar el rango de un variable, las filas siguen las fechas del periodo.
watch(
  () => [form.type, form.validFrom, form.validTo],
  () => {
    if (!initializing) rebuildDated()
  },
  { flush: 'sync' },
)

function onTypeChange(): void {
  // Un variable siempre lleva fecha de término: por defecto, 7 días.
  if (form.type === 'variable' && (!form.validTo || form.validTo < form.validFrom)) {
    form.validTo = addDaysIso(form.validFrom, 6)
  }
}

/** Fin del periodo si ya está definido y es coherente; null si todavía no. */
const periodEnd = computed(() => {
  const end = form.type === 'variable' ? form.validTo : form.hasEnd ? form.validTo : ''
  return end && form.validFrom && end >= form.validFrom ? end : null
})

const spanDays = computed(() =>
  form.validFrom && periodEnd.value ? daysBetweenIso(form.validFrom, periodEnd.value) : 0,
)

const spanText = computed(() =>
  spanDays.value ? `${spanDays.value} ${spanDays.value === 1 ? 'day' : 'days'}` : '',
)

/** Fixed con término: solo existen filas para los días que ocurren en el periodo. */
const periodDates = computed(() =>
  form.type === 'fixed' && periodEnd.value
    ? weekdayDates(form.validFrom, periodEnd.value)
    : null,
)

/** fixed: una fila por día de la semana · variable: una fila por fecha. */
const visibleDays = computed(() => {
  if (form.type === 'variable') return form.dated
  return periodDates.value
    ? form.days.filter((d) => periodDates.value!.has(d.weekday))
    : form.days
})

/** Encabezado por semana (variable): 'Oct 26 – Nov 1'. */
function weekHeader(day: DayForm): string {
  const sunday = addDaysIso(day.date as string, 7 - day.weekday)
  const last = periodEnd.value && periodEnd.value < sunday ? periodEnd.value : sunday
  return `${formatShortDate(day.date as string)} – ${formatShortDate(last)}`
}

const rows = computed(() =>
  visibleDays.value.map((day, i) => ({
    day,
    header:
      form.type === 'variable' && (i === 0 || day.weekday === 1) ? weekHeader(day) : null,
  })),
)

const hasWeekendRows = computed(() => visibleDays.value.some((d) => d.weekday >= 6))
const weekendsExcluded = computed(() =>
  visibleDays.value.filter((d) => d.weekday >= 6).every((d) => !d.enabled),
)

function toggleWeekends(): void {
  const enable = weekendsExcluded.value
  for (const day of visibleDays.value) if (day.weekday >= 6) day.enabled = enable
}

const weekdayLabel = (weekday: number) => WEEKDAYS[weekday - 1].label

const anyEnabled = computed(() => visibleDays.value.some((d) => d.enabled))
const firstEnabled = computed(() => visibleDays.value.find((d) => d.enabled) ?? null)

function copyBlock(source: DayForm, targets: DayForm[]): void {
  for (const day of targets) {
    if (!day.enabled || day === source) continue
    day.startTime = source.startTime
    day.endTime = source.endTime
    day.lunch = source.lunch
    day.lunchStart = source.lunchStart
    day.lunchEnd = source.lunchEnd
  }
}

function copyFirstToAll(): void {
  const source = firstEnabled.value
  if (source) copyBlock(source, visibleDays.value)
}

/** Copia el primer día trabajado de la semana de `weekStart` al resto de esa semana. */
function copyFirstOfWeek(weekStart: DayForm): void {
  const list = visibleDays.value
  const from = list.indexOf(weekStart)
  let to = from + 1
  while (to < list.length && list[to].weekday !== 1) to++
  const week = list.slice(from, to)
  const source = week.find((d) => d.enabled)
  if (source) copyBlock(source, week)
}

/** Mismas reglas que el backend (que sigue siendo la fuente de verdad). */
function dayError(day: DayForm): string | null {
  if (!day.enabled) return null
  if (!day.startTime || !day.endTime) return 'Start and end are required'
  if (day.endTime <= day.startTime) return 'End must be after start'
  if (day.lunch) {
    if (!day.lunchStart || !day.lunchEnd) return 'Lunch needs a start and an end'
    if (day.lunchEnd <= day.lunchStart) return 'Lunch end must be after lunch start'
    if (day.lunchStart <= day.startTime || day.lunchEnd >= day.endTime) {
      return 'Lunch must fall inside the working hours'
    }
  }
  return null
}

/** Fijo vigente que este alta cerraría (mismo criterio que `closePrevious`). */
const closesPrevious = computed(() => {
  if (isEdit.value || form.type !== 'fixed' || !form.validFrom) return null
  const overlapping = props.existing.filter(
    (s) =>
      s.validFrom <= (form.hasEnd && form.validTo ? form.validTo : '9999-12-31') &&
      (s.validTo === null || s.validTo >= form.validFrom),
  )
  if (overlapping.length !== 1) return null
  const [only] = overlapping
  return only.type === 'fixed' && only.validFrom < form.validFrom ? only : null
})

const rules = {
  required: (v: unknown) => !!v || 'Required',
  endAfterStart: (v: string) =>
    !v || !form.validFrom || v >= form.validFrom || 'Must be on or after the start date',
  notesMax: (v: string) => !v || v.length <= 500 || 'Max 500 characters',
  maxSpan: () =>
    form.type !== 'variable' ||
    spanDays.value <= MAX_VARIABLE_DAYS ||
    `A variable schedule can cover at most ${MAX_VARIABLE_DAYS} days`,
}

const canSubmit = computed(
  () =>
    !saving.value &&
    !!form.validFrom &&
    anyEnabled.value &&
    visibleDays.value.every((d) => !dayError(d)) &&
    (form.type === 'fixed'
      ? !form.hasEnd || !!periodEnd.value
      : !!periodEnd.value && spanDays.value <= MAX_VARIABLE_DAYS),
)

function buildDays(): ScheduleDay[] {
  return visibleDays.value
    .filter((d) => d.enabled)
    .map((d) => ({
      weekday: d.weekday,
      ...(d.date ? { date: d.date } : {}),
      startTime: d.startTime,
      endTime: d.endTime,
      lunchStart: d.lunch ? d.lunchStart : null,
      lunchEnd: d.lunch ? d.lunchEnd : null,
    }))
}

async function submit(): Promise<void> {
  if (!canSubmit.value) return
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  errorMessage.value = ''
  try {
    const notes = form.notes.trim() || null
    const validTo = form.type === 'fixed' ? (form.hasEnd ? form.validTo : null) : form.validTo

    const saved = props.schedule
      ? await schedulesService.update(props.userId, props.schedule.id, {
          validFrom: form.validFrom,
          ...(validTo !== undefined ? { validTo } : {}),
          days: buildDays(),
          notes,
        })
      : await schedulesService.create(props.userId, {
          type: form.type,
          validFrom: form.validFrom,
          ...(validTo !== undefined ? { validTo } : {}),
          days: buildDays(),
          notes,
          closePrevious: form.type === 'fixed' ? true : undefined,
        })

    dirty.value = false
    emit('saved', saved)
  } catch (error) {
    errorMessage.value = parseApiError(error)
  } finally {
    saving.value = false
  }
}

function requestClose(): void {
  if (saving.value) return
  // `persistent` evita cerrar por clic fuera; aquí se protege el trabajo en curso.
  if (dirty.value && !window.confirm('Discard the changes you have not saved?')) return
  emit('close')
}
</script>

<style scoped>
.sched-form__label {
  display: block;
  margin-bottom: 6px;
  font-size: var(--app-text-xs);
  font-weight: 500;
  color: rgb(var(--v-theme-on-surface-variant));
  opacity: 1;
}

.sched-form__hint {
  margin: 6px 0 0;
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}

.sched-form__days-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-1);
}

.sched-day__dates {
  display: block;
  margin-inline-start: 3.1rem;
  margin-top: -2px;
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

.sched-form__days-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-2);
  flex-wrap: wrap;
  margin-bottom: var(--app-space-2);
}

.sched-form__days {
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(var(--v-border-color), 1);
  border-radius: var(--app-radius-md, 8px);
}

.sched-week {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-2);
  padding: var(--app-space-1) var(--app-space-3);
  background: rgba(var(--v-theme-on-surface), 0.06);
  border-top: 1px solid rgba(var(--v-border-color), 1);
}

.sched-week:first-child {
  border-top: 0;
  border-radius: var(--app-radius-md, 8px) var(--app-radius-md, 8px) 0 0;
}

.sched-week__label {
  font-size: var(--app-text-xs);
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface-variant));
}

.sched-day {
  display: grid;
  grid-template-columns: 9.5rem minmax(0, 1fr) minmax(0, 1fr) 7.5rem;
  align-items: center;
  gap: var(--app-space-2);
  padding: var(--app-space-2) var(--app-space-3);
}

.sched-day + .sched-day {
  border-top: 1px solid rgba(var(--v-border-color), 1);
}

.sched-day--off {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.sched-day__off {
  grid-column: 2 / -1;
  font-size: var(--app-text-sm);
}

/* El almuerzo va en una segunda línea, alineado bajo inicio y fin. */
.sched-day__lunch-from {
  grid-column: 2;
}

.sched-day__lunch-to {
  grid-column: 3;
}

.sched-day__lunch :deep(.v-label) {
  white-space: nowrap;
}

.sched-day__error {
  grid-column: 1 / -1;
  margin: 0;
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-error));
}

@media (max-width: 700px) {
  .sched-day {
    grid-template-columns: 1fr 1fr;
  }

  .sched-day__toggle,
  .sched-day__lunch,
  .sched-day__off {
    grid-column: 1 / -1;
  }

  .sched-day__lunch-from,
  .sched-day__lunch-to {
    grid-column: auto;
  }
}
</style>
