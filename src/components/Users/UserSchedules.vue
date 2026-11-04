<!--
  src/components/Users/UserSchedules.vue

  Horario laboral de un usuario, con historial.
  - Fijo: se repite cada semana con fecha de inicio y de término opcional.
    Para cambiarlo hacia adelante se registra uno nuevo ("Replace from date…"),
    lo que deja el anterior cerrado y conserva el historial.
  - Variable: un periodo concreto con horario por fecha.
  Se muestra el horario vigente (o el próximo) como tira semanal y el resto en
  una lista plegable. El horario se edita en el diálogo de persona de Master
  Schedule; con `viewOnly` (ficha del usuario) solo se muestra, con un enlace
  para administrarlo allá. `embedded` quita la tarjeta y el título (el diálogo
  ya los aporta).
-->
<template>
  <v-card :variant="embedded ? 'flat' : 'elevated'" :class="embedded ? 'sched--embedded' : 'mb-4'">
    <div class="sched__head">
      <div class="sched__heading">
        <h2 v-if="!embedded" class="sched__title">Work schedule</h2>
        <p class="sched__subtitle">All times are Chicago time (CT).</p>
      </div>

      <div class="sched__head-actions">
        <v-btn
          variant="text"
          size="small"
          prepend-icon="mdi-history"
          @click="historyOpen = true"
        >
          Change log
        </v-btn>
        <v-btn
          v-if="!viewOnly"
          color="primary"
          variant="flat"
          size="small"
          prepend-icon="mdi-plus"
          :disabled="forbidden"
          @click="openCreate()"
        >
          New schedule
        </v-btn>
      </div>
    </div>
    <v-divider v-if="!embedded" />

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
      v-else-if="!featured"
      title="No schedule registered"
      :description="
        viewOnly
          ? 'Work schedules are managed in Master Schedule.'
          : 'Create a fixed schedule (repeats every week) or a variable one (a specific period).'
      "
    >
      <template v-if="!viewOnly" #actions>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreate()">
          New schedule
        </v-btn>
      </template>
    </EmptyState>

    <div v-else class="sched__body">
      <p v-if="featuredStatus !== 'current'" class="sched__note">
        {{
          featuredStatus === 'upcoming'
            ? 'No schedule is in effect today. The next one is shown.'
            : 'No schedule is in effect today. The latest one is shown.'
        }}
      </p>

      <UserScheduleSummary :schedule="featured" :compact="viewOnly">
        <template v-if="!viewOnly" #actions>
          <v-btn
            variant="tonal"
            size="small"
            prepend-icon="mdi-pencil-outline"
            @click="openEdit(featured)"
          >
            Edit
          </v-btn>
          <UserScheduleMenu
            :schedule="featured"
            :status="featuredStatus"
            @edit="openEdit(featured)"
            @replace="openReplace(featured)"
            @copy="openCopyPeriod(featured)"
            @delete="openDelete(featured)"
          />
        </template>
      </UserScheduleSummary>

      <UserScheduleHistoryList
        :schedules="others"
        :view-only="viewOnly"
        @edit="openEdit"
        @replace="openReplace"
        @copy="openCopyPeriod"
        @delete="openDelete"
      />
    </div>

    <ScheduleFormDialog
      v-if="!viewOnly"
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

    <UserScheduleDeleteDialog
      v-if="!viewOnly"
      :schedule="deleteTarget"
      :loading="deleting"
      :error="deleteError"
      @close="closeDelete"
      @confirm="confirmDelete"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">
      {{ snackbar.text }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import ActivityLoader from '@/components/common/ActivityLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ScheduleFormDialog, {
  type ScheduleTemplate,
} from '@/components/Users/ScheduleFormDialog.vue'
import ScheduleHistoryDialog from '@/components/Users/ScheduleHistoryDialog.vue'
import UserScheduleDeleteDialog from '@/components/Users/UserScheduleDeleteDialog.vue'
import UserScheduleHistoryList from '@/components/Users/UserScheduleHistoryList.vue'
import UserScheduleMenu from '@/components/Users/UserScheduleMenu.vue'
import UserScheduleSummary from '@/components/Users/UserScheduleSummary.vue'
import { schedulesService } from '@/services/schedules.service'
import type { EmployeeSchedule } from '@/types/schedules'
import {
  addDaysIso,
  daysBetweenIso,
  mondayOf,
  parseApiError,
  scheduleStatus,
  todayIso,
} from '@/utils/schedule'
import { orderHistory, pickFeatured } from '@/utils/user-schedule-view'

const props = withDefaults(
  defineProps<{ userId: string; viewOnly?: boolean; embedded?: boolean }>(),
  { viewOnly: false, embedded: false },
)

const emit = defineEmits<{
  /** El horario base cambió (alta, edición o borrado). */
  (e: 'changed'): void
  /** Horarios cargados (primera carga y tras cada cambio). */
  (e: 'loaded', schedules: EmployeeSchedule[]): void
}>()

// El enlace a Master Schedule solo lo ve quien tiene esa vista (si no, iría a /forbidden).

const schedules = ref<EmployeeSchedule[]>([])
const loading = ref(true)
const errorMessage = ref('')
const forbidden = ref(false)

const formOpen = ref(false)
const editing = ref<EmployeeSchedule | null>(null)
const template = ref<ScheduleTemplate | null>(null)
const historyOpen = ref(false)

const deleteTarget = ref<EmployeeSchedule | null>(null)
const deleting = ref(false)
const deleteError = ref('')

const snackbar = reactive({ show: false, text: '', color: 'success' })

const featured = computed(() => pickFeatured(schedules.value))
const featuredStatus = computed(() =>
  featured.value ? scheduleStatus(featured.value) : ('current' as const),
)
const others = computed(() => orderHistory([...schedules.value], featured.value?.id ?? null))

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
    emit('loaded', schedules.value)
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
  emit('changed')
  notify(wasEdit ? 'Schedule updated.' : 'Schedule saved.')
}

function openDelete(item: EmployeeSchedule): void {
  deleteError.value = ''
  deleteTarget.value = item
}

function closeDelete(): void {
  if (deleting.value) return
  deleteTarget.value = null
}

async function confirmDelete(): Promise<void> {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await schedulesService.remove(props.userId, deleteTarget.value.id)
    deleteTarget.value = null
    await load()
    emit('changed')
    notify('Schedule deleted.')
  } catch (error) {
    deleteError.value = parseApiError(error)
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.sched--embedded {
  background: transparent;
}

.sched--embedded .sched__head,
.sched--embedded .sched__body {
  padding-left: 0;
  padding-right: 0;
}

.sched__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-3);
  flex-wrap: wrap;
  padding: var(--app-space-3) var(--app-space-4);
}

.sched__title {
  margin: 0;
  font-size: var(--app-text-md);
  font-weight: 600;
}

.sched__subtitle {
  margin: 2px 0 0;
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
}

.sched__head-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-2);
}

.sched__body {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-3);
  padding: var(--app-space-3) var(--app-space-4) var(--app-space-4);
}

.sched__note {
  margin: 0;
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
