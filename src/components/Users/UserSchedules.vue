<!--
  src/components/Users/UserSchedules.vue

  Horario laboral de un usuario, con historial.
  - Fijo: se repite cada semana con fecha de inicio y de término opcional.
    Para cambiarlo hacia adelante se registra uno nuevo ("Replace from date…"),
    lo que deja el anterior cerrado y conserva el historial.
  - Variable: una semana concreta; se registra una por semana.
-->
<template>
  <v-card class="mb-4">
    <div class="sched__head">
      <div>
        <span class="app-eyebrow">Work schedule</span>
        <p class="sched__subtitle">All times are Chicago time (CT).</p>
      </div>

      <div class="sched__head-actions">
        <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-history"
          @click="historyOpen = true"
        >
          History
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          prepend-icon="mdi-plus"
          :disabled="forbidden"
          @click="openCreate()"
        >
          Add schedule
        </v-btn>
      </div>
    </div>
    <v-divider />

    <ActivityLoader v-if="loading" label="Loading schedules…" />

    <v-alert
      v-else-if="errorMessage"
      type="error"
      variant="tonal"
      density="compact"
      class="ma-4"
    >
      {{ errorMessage }}
      <template v-if="!forbidden" #append>
        <v-btn size="small" variant="text" @click="load">Retry</v-btn>
      </template>
    </v-alert>

    <EmptyState
      v-else-if="!schedules.length"
      title="No schedule registered"
      description="Add a fixed schedule (repeats every week) or a variable one (one week at a time)."
    />

    <ul v-else class="sched__list">
      <li
        v-for="item in schedules"
        :key="item.id"
        class="sched__item"
        :class="`sched__item--${statusOf(item)}`"
      >
        <div class="sched__item-main">
          <div class="sched__item-top">
            <v-chip size="x-small" variant="tonal" label>
              {{ item.type === 'fixed' ? 'Fixed' : 'Variable' }}
            </v-chip>
            <v-chip
              size="x-small"
              label
              :color="STATUS_META[statusOf(item)].color"
              variant="tonal"
            >
              {{ STATUS_META[statusOf(item)].label }}
            </v-chip>
            <span class="sched__range">{{ describeRange(item) }}</span>
          </div>

          <ul class="sched__days">
            <li v-for="group in summarizeDays(item.days)" :key="group.days + group.hours">
              <span class="sched__days-label">{{ group.days }}</span>
              <span class="app-mono">{{ group.hours }}</span>
              <span class="sched__lunch">
                {{ group.lunch ? `lunch ${group.lunch}` : 'no lunch' }}
              </span>
            </li>
          </ul>

          <p v-if="item.notes" class="sched__notes">{{ item.notes }}</p>
        </div>

        <v-menu>
          <template #activator="{ props: menuProps }">
            <v-btn
              v-bind="menuProps"
              icon="mdi-dots-vertical"
              variant="text"
              size="small"
              :aria-label="`Actions for schedule ${describeRange(item)}`"
            />
          </template>
          <v-list density="compact">
            <v-list-item prepend-icon="mdi-pencil-outline" title="Edit" @click="openEdit(item)" />
            <v-list-item
              v-if="item.type === 'fixed' && statusOf(item) !== 'past'"
              prepend-icon="mdi-swap-horizontal"
              title="Replace from date…"
              @click="openReplace(item)"
            />
            <v-list-item
              v-if="item.type === 'variable'"
              prepend-icon="mdi-content-copy"
              title="Copy to the next period…"
              @click="openCopyPeriod(item)"
            />
            <v-list-item
              prepend-icon="mdi-delete-outline"
              title="Delete"
              base-color="error"
              @click="openDelete(item)"
            />
          </v-list>
        </v-menu>
      </li>
    </ul>

    <ScheduleFormDialog
      :show="formOpen"
      :user-id="userId"
      :schedule="editing"
      :template="template"
      :existing="schedules"
      @close="closeForm"
      @saved="onSaved"
    />

    <ScheduleHistoryDialog
      :show="historyOpen"
      :user-id="userId"
      @close="historyOpen = false"
    />

    <BaseDialog
      :title="deleteStep === 1 ? 'Delete schedule' : 'Confirm deletion'"
      :show="!!deleteTarget"
      :width="480"
      :loading="deleting"
      @close="closeDelete"
    >
      <template #dialog-body>
        <template v-if="deleteStep === 1">
          <p class="mb-2">
            Delete the {{ deleteTarget?.type }} schedule
            <strong>{{ deleteTarget ? describeRange(deleteTarget) : '' }}</strong>?
          </p>
          <v-alert
            v-if="deleteTarget && statusOf(deleteTarget) !== 'upcoming'"
            type="warning"
            variant="tonal"
            density="compact"
            :text="
              statusOf(deleteTarget) === 'current'
                ? 'This schedule is in effect right now.'
                : 'This schedule has already been worked.'
            "
          />
        </template>
        <template v-else>
          <v-alert
            type="error"
            variant="tonal"
            density="compact"
            class="mb-2"
            text="This cannot be undone."
          />
          <p class="mb-0">
            <strong>{{ deleteTarget ? describeRange(deleteTarget) : '' }}</strong>
            will be permanently removed from the schedule list. A record of the
            deletion (with the full schedule) stays in the history.
          </p>
        </template>
        <v-alert
          v-if="deleteError"
          type="error"
          variant="tonal"
          density="compact"
          class="mt-3"
          :text="deleteError"
        />
      </template>
      <template #dialog-actions>
        <v-btn variant="text" :disabled="deleting" @click="closeDelete">
          Cancel
        </v-btn>
        <v-btn v-if="deleteStep === 1" color="error" variant="tonal" @click="deleteStep = 2">
          Continue
        </v-btn>
        <v-btn
          v-else
          color="error"
          variant="flat"
          :loading="deleting"
          @click="confirmDelete"
        >
          Yes, delete permanently
        </v-btn>
      </template>
    </BaseDialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import ActivityLoader from '@/components/common/ActivityLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ScheduleFormDialog, {
  type ScheduleTemplate,
} from '@/components/Users/ScheduleFormDialog.vue'
import ScheduleHistoryDialog from '@/components/Users/ScheduleHistoryDialog.vue'
import { schedulesService } from '@/services/schedules.service'
import type { EmployeeSchedule } from '@/types/schedules'
import {
  addDaysIso,
  daysBetweenIso,
  describeRange,
  mondayOf,
  parseApiError,
  scheduleStatus,
  summarizeDays,
  todayIso,
  type ScheduleStatus,
} from '@/utils/schedule'

const props = defineProps<{ userId: string }>()

const STATUS_META: Record<ScheduleStatus, { label: string; color: string }> = {
  current: { label: 'Current', color: 'success' },
  upcoming: { label: 'Upcoming', color: 'info' },
  past: { label: 'Past', color: 'default' },
}

const schedules = ref<EmployeeSchedule[]>([])
const loading = ref(true)
const errorMessage = ref('')
const forbidden = ref(false)

const formOpen = ref(false)
const editing = ref<EmployeeSchedule | null>(null)
const template = ref<ScheduleTemplate | null>(null)
const historyOpen = ref(false)

const deleteTarget = ref<EmployeeSchedule | null>(null)
const deleteStep = ref<1 | 2>(1)
const deleting = ref(false)
const deleteError = ref('')

const snackbar = reactive({ show: false, text: '', color: 'success' })

const statusOf = (item: EmployeeSchedule) => scheduleStatus(item)

function notify(text: string, color: 'success' | 'error' = 'success'): void {
  snackbar.text = text
  snackbar.color = color
  snackbar.show = true
}

async function load(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  forbidden.value = false
  try {
    schedules.value = await schedulesService.list(props.userId)
  } catch (error: any) {
    forbidden.value = error?.statusCode === 403
    errorMessage.value = parseApiError(error, 'Could not load the schedules.')
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.userId, load)

function openCreate(): void {
  editing.value = null
  template.value = null
  formOpen.value = true
}

function openEdit(item: EmployeeSchedule): void {
  editing.value = item
  template.value = null
  formOpen.value = true
}

/** Nuevo fijo a partir del vigente; el alta cierra el anterior el día previo. */
function openReplace(item: EmployeeSchedule): void {
  editing.value = null
  template.value = {
    type: 'fixed',
    validFrom: mondayOf(addDaysIso(todayIso(), 7)),
    days: item.days,
    notes: item.notes,
  }
  formOpen.value = true
}

/** Mismo largo y mismos horarios, empezando el día siguiente al periodo. */
function openCopyPeriod(item: EmployeeSchedule): void {
  const end = item.validTo ?? item.validFrom
  const length = daysBetweenIso(item.validFrom, end)
  const validFrom = addDaysIso(end, 1)
  editing.value = null
  template.value = {
    type: 'variable',
    validFrom,
    validTo: addDaysIso(validFrom, length - 1),
    // Cada fecha se desplaza lo mismo que el periodo: conserva el horario por día.
    days: item.days.map((d) => (d.date ? { ...d, date: addDaysIso(d.date, length) } : d)),
    notes: null,
  }
  formOpen.value = true
}

function closeForm(): void {
  formOpen.value = false
  editing.value = null
  template.value = null
}

async function onSaved(): Promise<void> {
  const wasEdit = !!editing.value
  closeForm()
  await load()
  notify(wasEdit ? 'Schedule updated.' : 'Schedule saved.')
}

function openDelete(item: EmployeeSchedule): void {
  deleteStep.value = 1
  deleteError.value = ''
  deleteTarget.value = item
}

function closeDelete(): void {
  if (deleting.value) return
  deleteTarget.value = null
  deleteStep.value = 1
}

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value || deleteStep.value !== 2) return
  deleting.value = true
  deleteError.value = ''
  try {
    await schedulesService.remove(props.userId, deleteTarget.value.id)
    deleteTarget.value = null
    deleteStep.value = 1
    await load()
    notify('Schedule deleted.')
  } catch (error) {
    deleteError.value = parseApiError(error)
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.sched__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-3);
  flex-wrap: wrap;
  padding: var(--app-space-3) var(--app-space-4);
}

.sched__subtitle {
  margin: 2px 0 0;
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

.sched__head-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
}

.sched__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.sched__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-3);
  padding: var(--app-space-3) var(--app-space-4);
}

.sched__item + .sched__item {
  border-top: 1px solid rgba(var(--v-border-color), 1);
}

.sched__item--past {
  opacity: 0.7;
}

.sched__item-main {
  min-width: 0;
}

.sched__item-top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-2);
}

.sched__range {
  font-size: var(--app-text-md);
  font-weight: 550;
}

.sched__days {
  list-style: none;
  margin: var(--app-space-2) 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: var(--app-text-sm);
}

.sched__days li {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-1) var(--app-space-3);
}

.sched__days-label {
  min-width: 7.5rem;
  font-weight: 500;
}

.sched__lunch {
  color: rgb(var(--v-theme-on-surface-variant));
}

.sched__notes {
  margin: var(--app-space-2) 0 0;
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
  overflow-wrap: anywhere;
}
</style>
