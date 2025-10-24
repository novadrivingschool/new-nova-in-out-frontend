<template>
  <v-container>
    <v-row>
      <v-col>
        <v-calendar ref="calendar" :focus="focus" :events="events" type="week" event-color="blue"
          @click:event="onEventClick" @click:more="onMoreClick" @click:day="onDayClick" color="primary" />
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="400">
      <v-card>
        <v-card-title>
          <span class="text-h6">{{ editedEvent.id ? 'Editar Clase' : 'Nueva Clase' }}</span>
        </v-card-title>

        <v-card-text>
          <v-form ref="form">
            <v-text-field v-model="editedEvent.teacher" label="Profesor" required />
            <v-text-field v-model="editedEvent.title" label="Nombre de la clase" required />

            <!-- Selector Fecha y Hora INICIO -->
            <v-menu v-model="startMenu" :close-on-content-click="false" transition="scale-transition" offset-y
              max-width="290" min-width="auto">
              <template #activator="{ props }">
                <v-text-field v-bind="props" readonly label="Inicio" :value="formatDateTime(editedEvent.start)"
                  required />
              </template>

              <v-card>
                <v-date-picker v-model="startDate" @input="onStartDateChange" no-title scrollable />
                <v-time-picker v-model="startTime" format="24hr" @input="onStartTimeChange" no-title />
                <v-card-actions>
                  <v-spacer />
                  <v-btn text @click="startMenu = false">Cerrar</v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>

            <!-- Selector Fecha y Hora FIN -->
            <v-menu v-model="endMenu" :close-on-content-click="false" transition="scale-transition" offset-y
              max-width="290" min-width="auto">
              <template #activator="{ props }">
                <v-text-field v-bind="props" readonly label="Fin" :value="formatDateTime(editedEvent.end)" required />
              </template>

              <v-card>
                <v-date-picker v-model="endDate" @input="onEndDateChange" no-title scrollable />
                <v-time-picker v-model="endTime" format="24hr" @input="onEndTimeChange" no-title />
                <v-card-actions>
                  <v-spacer />
                  <v-btn text @click="endMenu = false">Cerrar</v-btn>
                </v-card-actions>
              </v-card>
            </v-menu>

            <v-alert v-if="overlapError" type="error" dense text class="mt-3">
              El horario se solapa con otra clase del mismo profesor.
            </v-alert>
          </v-form>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn color="blue darken-1" text @click="closeDialog">Cancelar</v-btn>
          <v-btn color="blue darken-1" text
            :disabled="overlapError || !editedEvent.title || !editedEvent.teacher || !editedEvent.start || !editedEvent.end"
            @click="saveEvent">
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
import { ref, watch } from 'vue'

// Helper para formatear Date a 'YYYY-MM-DD'
function formatDateToYMD(date) {
  const y = date.getFullYear()
  const m = (date.getMonth() + 1).toString().padStart(2, '0')
  const d = date.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Inicializamos focus como string 'YYYY-MM-DD'
const focus = ref(formatDateToYMD(new Date()))

const events = ref([
  {
    id: 1,
    title: 'Matemáticas',
    start: new Date('2025-05-26T10:00:00'),
    end: new Date('2025-05-26T11:00:00'),
    teacher: 'Juan Pérez',
  },
  {
    id: 2,
    title: 'Historia',
    start: new Date('2025-05-26T11:00:00'),
    end: new Date('2025-05-26T12:00:00'),
    teacher: 'Ana Gómez',
  },
])

const dialog = ref(false)
const startMenu = ref(false)
const endMenu = ref(false)

const editedEvent = ref({
  id: null,
  title: '',
  start: null,
  end: null,
  teacher: '',
})

const startDate = ref(null)
const startTime = ref(null)

const endDate = ref(null)
const endTime = ref(null)

const overlapError = ref(false)

// Revisa si hay solapamiento de clases del mismo profesor
function checkOverlap(event) {
  return events.value.some((e) => {
    if (e.id === event.id) return false
    if (e.teacher !== event.teacher) return false

    const eStart = e.start.getTime()
    const eEnd = e.end.getTime()
    const eventStart = event.start.getTime()
    const eventEnd = event.end.getTime()

    return eventStart < eEnd && eventEnd > eStart
  })
}

// Sincroniza fechas y horas auxiliares cuando editedEvent cambia
watch(
  editedEvent,
  (newEvent) => {
    if (newEvent.start) {
      startDate.value = new Date(newEvent.start)
      startTime.value = new Date(newEvent.start)
    } else {
      startDate.value = null
      startTime.value = null
    }

    if (newEvent.end) {
      endDate.value = new Date(newEvent.end)
      endTime.value = new Date(newEvent.end)
    } else {
      endDate.value = null
      endTime.value = null
    }

    if (!newEvent.start || !newEvent.end || !newEvent.teacher) {
      overlapError.value = false
      return
    }
    overlapError.value = checkOverlap(newEvent)
  },
  { deep: true, immediate: true }
)

// Cambios en la fecha y hora de inicio
function onStartDateChange(val) {
  if (!val) return
  const newStart = new Date(editedEvent.value.start || new Date())
  newStart.setFullYear(val.getFullYear(), val.getMonth(), val.getDate())
  editedEvent.value.start = newStart
}
function onStartTimeChange(val) {
  if (!val) return
  const newStart = new Date(editedEvent.value.start || new Date())
  newStart.setHours(val.getHours(), val.getMinutes())
  editedEvent.value.start = newStart
}

// Cambios en la fecha y hora de fin
function onEndDateChange(val) {
  if (!val) return
  const newEnd = new Date(editedEvent.value.end || new Date())
  newEnd.setFullYear(val.getFullYear(), val.getMonth(), val.getDate())
  editedEvent.value.end = newEnd
}
function onEndTimeChange(val) {
  if (!val) return
  const newEnd = new Date(editedEvent.value.end || new Date())
  newEnd.setHours(val.getHours(), val.getMinutes())
  editedEvent.value.end = newEnd
}

function formatDateTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleString([], {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function onDayClick({ date }) {
  const d = new Date(date)
  editedEvent.value = {
    id: null,
    title: '',
    start: new Date(d.setHours(9, 0, 0, 0)),
    end: new Date(d.setHours(10, 0, 0, 0)),
    teacher: '',
  }
  dialog.value = true
}

function onEventClick({ event }) {
  editedEvent.value = { ...event }
  dialog.value = true
}

function saveEvent() {
  if (editedEvent.value.id) {
    const index = events.value.findIndex((e) => e.id === editedEvent.value.id)
    if (index !== -1) events.value[index] = { ...editedEvent.value }
  } else {
    editedEvent.value.id = Date.now()
    events.value.push({ ...editedEvent.value })
  }
  dialog.value = false
}

function closeDialog() {
  dialog.value = false
}

function onMoreClick() {
  // Opcional: funcionalidad para "más eventos"
}
</script>
