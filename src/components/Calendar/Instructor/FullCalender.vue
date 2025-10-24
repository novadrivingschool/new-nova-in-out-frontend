<script lang="ts">
import { defineComponent } from "vue";
import FullCalendar from "@fullcalendar/vue3";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { type EventResizeDoneArg } from "@fullcalendar/interaction";
import type { CalendarOptions, DateSelectArg, EventApi, EventChangeArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import { CheckIcon } from 'vue-tabler-icons';
import { useGlobalSchedule } from '@/stores/calendar/global_schedule'
import { useInstructorsStore, type Instructor } from '@/stores/instructors/instructors'


// Date -> '2025-08-20T10:30' para v-model de <input type="datetime-local">
function toLocalDatetimeInputValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

// '2025-08-20T10:30' -> Date local
function fromLocalDateTime(dt: string): Date {
  const [ymd, hm] = dt.split('T')
  const [y, m, d] = ymd.split('-').map(Number)
  const [H, M] = hm.split(':').map(Number)
  return new Date(y, m - 1, d, H, M, 0, 0)
}

function startOfDayLocal(d: Date): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}

function addDays(d: Date, days: number): Date {
  const x = new Date(d)
  x.setDate(x.getDate() + days)
  return x
}

// Si allDay=true: normaliza a [00:00, next 00:00)
function normalizeAllDayRange(start: Date, end?: Date): { start: Date; end: Date } {
  const s = startOfDayLocal(start)
  const e = end ? startOfDayLocal(end) : addDays(s, 1)
  // si el end es el mismo día, muévelo a día siguiente (end exclusivo)
  const endFixed = e <= s ? addDays(s, 1) : e
  return { start: s, end: endFixed }
}

export default defineComponent({
  components: {
    FullCalendar,
    CheckIcon
  },
  data() {
    const schedule = useGlobalSchedule()
    const instructorsStore = useInstructorsStore()

    return {
      instructorsStore,

      selectAll: true,
      people: [],
      //selectedPeople: [] as string[],
      selectedPeople: [] as number[],

      menu1: false, // For Start Date
      menu2: false, // For End Date
      updateModalShow: false,
      addModalShow: false,
      selectedEvent: {
        id: "",
        title: "",
        color: "",
        start: "",
        end: "",
        allDay: false,
        person: null as Instructor | null,
      },
      newEvent: {
        title: "",
        color: "",
        start: "",
        end: "",
        allDay: true,
        person: null as Instructor | null,
      },
      updatedTitle: "",
      updatedColor: "",
      calendarOptions: {
        plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
        initialView: 'timeGridWeek',
        initialEvents: schedule.getAll().map(e => ({
          id: e.id,
          title: e.title,
          start: e.start,
          end: e.end,
          allDay: e.allDay,
          color: e.color,
          extendedProps: { person: e.person },   // <-- person va aquí
        })) as EventInput[],
        editable: true,
        selectable: true,
        selectMirror: true,
        dayMaxEvents: true,
        weekends: true,

        // 👇 pasa funciones con la firma correcta
        select: (arg: DateSelectArg) => this.handleDateSelect(arg),
        eventClick: (arg: EventClickArg) => this.handleEventClick(arg),
        eventsSet: (events: EventApi[]) => this.handleEvents(events),

        eventChange: (arg: EventChangeArg) => this.onEventChange(arg),
        eventDrop: (arg: EventDropArg) => this.onEventDrop(arg),
        eventResize: (arg: EventResizeDoneArg) => this.onEventResize(arg),

        slotMinTime: '05:00:00',
        slotMaxTime: '24:00:00',
        scrollTime: '05:00:00',
        slotDuration: '00:30:00',
        contentHeight: 1020,
        expandRows: true,
      } as CalendarOptions,

      activeColor: {
        newEvent: "", // Store the active color for the new event
        updateEvent: "", // Store the active color for the update event
      },
      //currentEvents: [],
      currentEvents: [] as EventApi[],
      colorOptions: [
        { id: 1, label: "Primary", value: "#615dff" },
        { id: 2, label: "Success", value: "#39b69a" },
        { id: 3, label: "Error", value: "#fc4b6c" },
        { id: 4, label: "Secondary", value: "#1a97f5" },
        { id: 5, label: "Warning", value: "#fdd43f" },
      ],
      onResizeThrottled: null as null | (() => void), // <- aquí
      resizeObserver: null as ResizeObserver | null,
    };
  },
  mounted() {
    console.log('[mounted] Inicializando observadores...');
    this.observeCalendarResize();
    this.addResizeListener();
    window.addEventListener('drawer-toggled', this.delayedRenderCalendar);

    if (!this.instructorsStore.instructors.length) {
      this.instructorsStore.loadMockData()
    }
    this.$nextTick(() => {
      this.selectedPeople = this.peopleList.map(p => p.value) // todos
      this.filterEventsByPeople()
    })
  },

  computed: {
    instructorItems() {
      return this.instructorsStore.instructors.map(i => ({
        ...i,
        fullName: `${i.name} ${i.lastName}`.trim(),
      }))
    },
    peopleList(): { label: string; value: number }[] {
      return this.instructorsStore.instructors.map(i => ({
        label: `${i.name} ${i.lastName}`,
        value: i.id,                           // ← id numérico
      }))
    },
    selectAllModel: {
      get(): boolean {
        const total = this.peopleList.length
        return total > 0 && this.selectedPeople.length === total
      },
      set(val: boolean) {
        this.selectedPeople = val ? this.peopleList.map(p => p.value) : []
      }
    },
    selectAllIndeterminate(): boolean {
      const total = this.peopleList.length
      const sel = this.selectedPeople.length
      return sel > 0 && sel < total
    },
  },

  beforeUnmount() {
    console.log('[beforeUnmount] Limpiando listeners...');
    window.removeEventListener('drawer-toggled', this.delayedRenderCalendar);
    window.removeEventListener('resize', this.onResizeThrottled!);
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      console.log('[beforeUnmount] ResizeObserver desconectado.');
    }
  },
  watch: {
    selectedPeople(val: number[]) {            // ← number[]
      this.selectAll = val.length === this.peopleList.length
      this.filterEventsByPeople()
    }
  },

  methods: {
    handleEvents(events: EventApi[]) {
      this.currentEvents = events
    },
    onEventDrop(info: any) {
      console.group('[eventDrop]')
      console.log('id:', info.event.id, 'start:', info.event.start, 'end:', info.event.end, 'allDay:', info.event.allDay)
      console.groupEnd()
      this.onEventChange(info) // delega
    },
    onEventResize(info: any) {
      console.group('[eventResize]')
      console.log('id:', info.event.id, 'start:', info.event.start, 'end:', info.event.end, 'allDay:', info.event.allDay)
      console.groupEnd()
      this.onEventChange(info) // delega
    },

    onEventChange(arg: any) {
      console.group('[eventChange]')
      const ev = arg.event
      const id = ev.id
      const schedule = useGlobalSchedule()

      if (!id) { console.warn('evento sin id'); console.groupEnd(); return }

      // Fechas desde FullCalendar
      let start: Date | null = ev.start ? new Date(ev.start) : null
      let end: Date | null = ev.end ? new Date(ev.end) : null

      if (!start) { console.error('start nulo'); console.groupEnd(); return }

      // Normaliza rango si es allDay (end exclusivo al día siguiente)
      if (ev.allDay) {
        const norm = normalizeAllDayRange(start, end || undefined)
        start = norm.start
        end = norm.end
      }

      const patch = {
        title: ev.title,
        color: (ev.backgroundColor as string) || undefined,
        start,
        end: end || undefined,
        allDay: !!ev.allDay,
        // person: ev.extendedProps?.person // si quieres mantenerlo también
      }

      console.log('patch -> store:', patch)
      schedule.editEvent(id, patch)
      console.groupEnd()
    },
    onTogglePerson(val: boolean | null, value: number) {
      const set = new Set<number>(this.selectedPeople)
      val ? set.add(value) : set.delete(value)
      this.selectedPeople = [...set]
    },
    toggleSelectAll() {
      this.selectAll
        ? this.selectedPeople = this.peopleList.map(p => p.value)
        : this.selectedPeople = []
    },
    async filterEventsByPeople() {
      const cal = (this.$refs.fullCalendar as any)?.getApi?.()
      if (!cal) return

      const schedule = useGlobalSchedule()
      const selectedIds = new Set<number>(this.selectedPeople)

      const all = schedule.getAll()
      const filtered = selectedIds.size
        ? all.filter(e => e.person && selectedIds.has(e.person.id))
        : []

      cal.batchRendering(() => {
        cal.removeAllEvents()
        filtered.forEach(e => {
          cal.addEvent({
            id: e.id,
            title: e.title,
            start: e.start,
            end: e.end ?? undefined,
            allDay: !!e.allDay,
            color: e.color ?? undefined,
            extendedProps: { person: e.person },  // ← objeto Instructor completo
          })
        })
      })
    },
    selectAllPeople() {
      this.selectedPeople = [...this.people];
    },
    clearPeople() {
      this.selectedPeople = [];
    },

    delayedRenderCalendar() {
      console.log('[drawer-toggled] Evento detectado. Re-render calendar con delay...');
      setTimeout(() => {
        this.forceCalendarRender();
      }, 150);
    },

    observeCalendarResize() {
      console.log('[observeCalendarResize] Observando tamaño del calendario...');
      this.resizeObserver = new ResizeObserver(() => {
        console.log('[ResizeObserver] Cambio de tamaño detectado.');
        this.forceCalendarRender();
      });
      this.resizeObserver.observe(this.$el as HTMLElement);
    },

    forceCalendarRender() {
      console.log('[forceCalendarRender] Ejecutando render del calendario...');
      this.$nextTick(() => {
        const calendarApi = (this.$refs.fullCalendar as any)?.getApi?.();
        if (calendarApi) {
          calendarApi.render();
          console.log('[forceCalendarRender] render() ejecutado correctamente.');
        } else {
          console.warn('[forceCalendarRender] No se pudo obtener calendarApi.');
        }
      });
    },

    addResizeListener() {
      this.onResizeThrottled = this.throttle(() => {
        this.forceCalendarRender();
      }, 300);
      window.addEventListener("resize", this.onResizeThrottled);
    },

    throttle(callback: Function, delay: number) {
      let timeout: number | null = null;
      return () => {
        if (timeout === null) {
          timeout = window.setTimeout(() => {
            callback();
            timeout = null;
          }, delay);
        }
      };
    },
    handleDateSelect(selectInfo: any) {
      console.group('[handleDateSelect]')
      this.addModalShow = true

      const start = selectInfo.start instanceof Date ? selectInfo.start : new Date(selectInfo.start)
      const end = selectInfo.end instanceof Date ? selectInfo.end : new Date(selectInfo.end)

      // Si el usuario selecciona en dayGrid (allDay)
      this.newEvent.allDay = !!selectInfo.allDay

      if (this.newEvent.allDay) {
        // muestra 00:00 en ambos campos; luego addEvent normaliza end a día siguiente
        const toVal = (d: Date) =>
          `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T00:00`
        this.newEvent.start = toVal(start)
        this.newEvent.end = toVal(end ?? start)
      } else {
        // con hora
        this.newEvent.start = toLocalDatetimeInputValue(start)
        this.newEvent.end = toLocalDatetimeInputValue(end ?? start)
      }

      console.log('[handleDateSelect] newEvent:', this.newEvent)
      console.groupEnd()
    },
    handleEventClick(clickInfo: any) {
      console.group('[handleEventClick]')
      this.updateModalShow = true

      const schedule = useGlobalSchedule()
      const eventStart: Date | null = clickInfo.event.start ?? null
      const eventEnd: Date | null = clickInfo.event.end ?? null

      // 👇 sacar person de extendedProps o del store
      /* const personFromExt = clickInfo.event.extendedProps?.person
      const personFromStore = schedule.getAll().find(e => e.id === clickInfo.event.id)?.person
      const person = personFromExt ?? personFromStore ?? '' */
      const personFromExt = clickInfo.event.extendedProps?.person as Instructor | undefined
      const personFromStore = schedule.getAll().find(e => e.id === clickInfo.event.id)?.person
      const person = personFromExt ?? personFromStore ?? null   // ← null, no cadena

      this.selectedEvent = {
        id: clickInfo.event.id ?? '',
        title: clickInfo.event.title,
        color: clickInfo.event.backgroundColor,
        start: eventStart ? toLocalDatetimeInputValue(eventStart) : '',
        end: eventEnd ? toLocalDatetimeInputValue(eventEnd) : '',
        allDay: clickInfo.event.allDay,
        person, // 👈 AQUI
      }

      this.updatedTitle = this.selectedEvent.title
      this.updatedColor = this.selectedEvent.color
      this.activeColor.updateEvent = this.selectedEvent.color

      console.log('[handleEventClick] selectedEvent:', this.selectedEvent)
      console.groupEnd()
    },
    async addEvent() {
      console.group('[addEvent]');

      const schedule = useGlobalSchedule();
      const ne = this.newEvent;

      console.log('[newEvent/raw]', JSON.stringify(ne, null, 2));

      if (!ne.title?.trim()) { console.warn('[addEvent] Falta title'); console.groupEnd(); return; }
      if (!ne.start) { console.warn('[addEvent] Falta start'); console.groupEnd(); return; }
      if (!ne.person) { console.warn('[addEvent] Falta person'); console.groupEnd(); return; }

      if (!ne.person || typeof ne.person.id !== 'number') {
        console.warn('[addEvent] Falta person válido'); return;
      }
      // 👉 Objeto instructor seleccionado en el combobox
      const personObj = ne.person as Instructor;
      //const personName = `${personObj.name} ${personObj.lastName}`.trim();

      // Parse base
      let baseStart: Date, baseEnd: Date | undefined;
      try {
        baseStart = fromLocalDateTime(ne.start as string);
        baseEnd = ne.end ? fromLocalDateTime(ne.end as string) : undefined;
      } catch (e) {
        console.error('[addEvent] parse datetime-local falló:', e); console.groupEnd(); return;
      }

      console.log('[parsed] baseStart ISO/local/H:M',
        baseStart.toISOString(), baseStart.toString(), baseStart.getHours(), baseStart.getMinutes());
      if (baseEnd) {
        console.log('[parsed] baseEnd   ISO/local/H:M',
          baseEnd.toISOString(), baseEnd.toString(), baseEnd.getHours(), baseEnd.getMinutes());
      } else {
        console.log('[parsed] baseEnd   = undefined');
      }

      if (!ne.allDay && !baseEnd) {
        console.warn('[addEvent] Falta end para evento con horas'); console.groupEnd(); return;
      }

      // -------- ALL DAY --------
      if (ne.allDay) {
        console.log('[addEvent] ALL-DAY');

        // SIEMPRE un solo día: usar SOLO la fecha de start
        const startDay = startOfDayLocal(baseStart);

        const payload = {
          title: ne.title.trim(),
          start: startDay,           // 00:00 del día elegido
          end: addDays(startDay, 1), // exclusivo: siguiente día 00:00
          allDay: true,
          ...(ne.color ? { color: ne.color } : {}),
          person: personObj,        // 👈 guardamos string en el store (por ahora)
        } as const;

        console.log('[allDay] payload.start', payload.start.toString());
        console.log('[allDay] payload.end  ', payload.end!.toString());
        console.log('PAYLOAD: ', JSON.stringify(payload, null, 2))


        schedule.addEvent(payload);

      } else {
        // Con horas
        if (!baseEnd) { console.warn('[addEvent] Falta end'); console.groupEnd(); return; }

        const sameDay =
          baseStart.getFullYear() === baseEnd.getFullYear() &&
          baseStart.getMonth() === baseEnd.getMonth() &&
          baseStart.getDate() === baseEnd.getDate();

        if (sameDay) {
          // Un solo evento usando EXACTAMENTE las horas elegidas (p. ej. 07:00–12:30)
          let s = baseStart;
          let e = baseEnd;
          if (e <= s) e = new Date(s.getTime() + 30 * 60 * 1000);

          const payload = {
            title: ne.title.trim(),
            start: s,
            end: e,
            allDay: false,
            ...(ne.color ? { color: ne.color } : {}),
            person: personObj,      // 👈 string en el store
          } as const;

          console.log('[addEvent] payload -> store:', payload);
          console.log('PAYLOAD: ', JSON.stringify(payload, null, 2))
          schedule.addEvent(payload);

        } else {
          // Rango de varios días: replica misma franja cada día
          const startDay = startOfDayLocal(baseStart);
          const endDay = startOfDayLocal(baseEnd);

          const startH = baseStart.getHours(), startM = baseStart.getMinutes();
          const endH = baseEnd.getHours(), endM = baseEnd.getMinutes();

          for (let cursor = startDay; cursor <= endDay; cursor = addDays(cursor, 1)) {
            let s = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), startH, startM, 0, 0);
            let e = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), endH, endM, 0, 0);
            if (e <= s) e = new Date(s.getTime() + 30 * 60 * 1000);

            const payload = {
              title: ne.title.trim(),
              start: s,
              end: e,
              allDay: false,
              ...(ne.color ? { color: ne.color } : {}),
              person: personObj,    // 👈 string en el store
            } as const;

            console.log('[addEvent] payload -> store:', payload);
            console.log('PAYLOAD: ', JSON.stringify(payload, null, 2))
            schedule.addEvent(payload);
          }
        }
      }

      // Refiltrar y repintar FC desde el store
      await this.filterEventsByPeople();

      // Reset UI
      this.addModalShow = false;
      this.newEvent = { title: '', color: '', start: '', end: '', allDay: false, person: null };
      console.groupEnd();
    },
    async updateEvent() {
      console.group('[updateEvent]')

      const cal = (this.$refs.fullCalendar as any)?.getApi?.()
      if (!cal) { console.warn('[updateEvent] calendarApi nulo'); console.groupEnd(); return }

      const schedule = useGlobalSchedule()
      const evId = this.selectedEvent.id
      if (!evId) { console.warn('[updateEvent] selectedEvent.id vacío'); console.groupEnd(); return }

      const fcEvent = cal.getEventById(evId)
      if (!fcEvent) { console.warn('[updateEvent] no existe en FC id:', evId); console.groupEnd(); return }

      let updatedStart: Date | null = null
      let updatedEnd: Date | null = null
      try {
        updatedStart = this.selectedEvent.start ? fromLocalDateTime(this.selectedEvent.start) : null
        updatedEnd = this.selectedEvent.end ? fromLocalDateTime(this.selectedEvent.end) : null
      } catch (e) {
        console.error('[updateEvent] parse datetime-local falló:', e)
        console.groupEnd(); return
      }
      if (!updatedStart) { console.error('[updateEvent] start requerido'); console.groupEnd(); return }

      // Si el usuario marcó allDay en el modal de update:
      if (this.selectedEvent.allDay) {
        const norm = normalizeAllDayRange(updatedStart, updatedEnd || undefined)
        updatedStart = norm.start
        updatedEnd = norm.end
      }

      const patch = {
        title: (this.updatedTitle?.trim() || fcEvent.title),
        color: (this.updatedColor || (fcEvent.backgroundColor as string) || undefined),
        start: updatedStart,
        end: updatedEnd || undefined,
        allDay: !!this.selectedEvent.allDay,
        person: this.selectedEvent.person || undefined,
      }
      console.log('PATCH: ', JSON.stringify(patch, null, 2))
      console.log('[updateEvent] patch -> store:', patch)
      const ok = schedule.editEvent(evId, patch)
      console.log('[updateEvent] store.editEvent ok:', ok)

      await this.filterEventsByPeople();

      this.updateModalShow = false
      this.updatedTitle = ''
      this.updatedColor = ''
      this.selectedEvent = { id: '', title: '', color: '', start: '', end: '', allDay: true, person: null }

      console.log('[updateEvent] done')
      console.groupEnd()
    },
    deleteEvent() {
      console.group('[deleteEvent]')

      const cal = (this.$refs.fullCalendar as any)?.getApi?.()
      const schedule = useGlobalSchedule()
      const id = this.selectedEvent.id

      if (!id) {
        console.warn('[deleteEvent] selectedEvent.id vacío')
        console.groupEnd()
        return
      }

      // 1) BORRAR EN EL STORE (fuente de verdad)
      const removed = schedule.deleteEvent(id) // ver paso 2 para retornar boolean
      console.log('[deleteEvent] eliminado del store:', removed)

      // 2) QUITARLO DE FULLCALENDAR (si está presente)
      if (cal) {
        const ev = cal.getEventById(id)
        if (ev) ev.remove()
      }

      // 3) RECONSTRUIR LA VISTA SEGÚN LOS FILTROS
      this.filterEventsByPeople()

      // 4) LIMPIEZA UI
      this.updateModalShow = false
      this.selectedEvent = { id: '', title: '', color: '', start: '', end: '', allDay: false, person: null }

      console.groupEnd()
    },
    selectColor(color: string, isAddModal: boolean) {
      if (isAddModal) {
        this.newEvent.color = color;
        this.activeColor.newEvent = color; // Set the active color for add modal
      } else {
        this.updatedColor = color;
        this.activeColor.updateEvent = color; // Set the active color for update modal
      }
    },
  },
});
</script>

<template>
  <v-container fluid class="pa-4">
    <v-card elevation="2" class="pa-6">
      <v-row>
        <!-- CALENDARIO -->
        <v-col cols="12" md="9">
          <FullCalendar ref="fullCalendar" class="rounded-lg elevation-1 mb-6" :options="calendarOptions" />

        </v-col>

        <!-- PANEL DE PERSONAS -->
        <v-col cols="12" md="3">
          <v-card elevation="1" class="pa-4">
            <h4 class="text-h6 font-weight-bold mb-4">Filter by person</h4>

            <v-divider class="mb-4"></v-divider>

            <!-- Checkbox general -->
            <v-checkbox v-model="selectAllModel" :indeterminate="selectAllIndeterminate" label="Select All" hide-details
              class="mb-3" />

            <v-divider class="mb-4"></v-divider>

            <!-- Cada persona -->
            <v-checkbox v-for="p in peopleList" :key="p.value" :label="p.label"
              :model-value="selectedPeople.includes(p.value)" hide-details density="compact" class="mb-2"
              @update:model-value="val => onTogglePerson(val, p.value)" />
          </v-card>
        </v-col>
      </v-row>

      <!-- Add Event Modal -->
      <v-dialog v-model="addModalShow" max-width="500px">
        <v-card class="pa-4" color="grey-lighten-4">
          <v-card-text>

            <v-label class="mb-2 font-weight-medium">Person</v-label>
            <!-- <v-combobox v-model="newEvent.person" :items="instructorNames" variant="outlined" hide-details clearable
              required class="mb-4" autocomplete="off" /> -->
            <!-- <v-combobox v-model="newEvent.person" :items="instructorsStore.instructors"
              :item-title="i => `${i.name} ${i.lastName}`" :item-value="i => i.id" return-object variant="outlined"
              hide-details clearable required class="mb-4" autocomplete="off" /> -->

            <!-- <v-label class="mb-2 font-weight-medium">Event Title</v-label>
            <v-text-field v-model="newEvent.title" outlined required /> -->

            <!-- ALL DAY SWITCH -->
            <!-- <v-switch v-model="newEvent.allDay" inset hide-details label="All day" class="mb-2" /> -->

            <!-- Start (day and time) -->
            <v-label v-if="!newEvent.allDay" class="mb-2 font-weight-medium">Start (day and time)</v-label>
            <v-text-field v-if="!newEvent.allDay" :model-value="newEvent.start"
              @update:model-value="v => newEvent.start = String(v)" type="datetime-local" label="Start (day and time)"
              variant="outlined" hide-details required class="mb-4" />


            <!-- End (day and time) -->
            <v-label v-if="!newEvent.allDay" class="mb-2 font-weight-medium">
              End (day and time)
            </v-label>
            <v-text-field v-if="!newEvent.allDay" :model-value="newEvent.end"
              @update:model-value="v => newEvent.end = String(v)" :min="newEvent.start" type="datetime-local"
              step="1800" label="End (day and time)" variant="outlined" hide-details required class="mb-4" />

            <v-divider class="mb-4"></v-divider>

            <v-label class="mb-2 font-weight-medium">Event Color</v-label>
            <v-list class="d-flex ga-3 pa-0">
              <v-list-item v-for="option in colorOptions" :key="option.id" class="px-0 py-0" :ripple="false"
                @click="selectColor(option.value, true)">
                <div class="rounded-circle d-flex justify-center align-center elevation-1"
                  style="width: 30px; height: 30px" :style="{ backgroundColor: option.value }">
                  <CheckIcon size="18" color="#fff" v-if="activeColor.newEvent === option.value" />
                </div>
              </v-list-item>
            </v-list>

            <v-btn @click="addEvent" color="primary" class="mt-6 text-white px-6 py-3 rounded-lg" elevation="2">
              <v-icon start>mdi-plus</v-icon>
              Add Event
            </v-btn>
          </v-card-text>
        </v-card>
      </v-dialog>

      <!-- Update Event Modal -->
      <v-dialog v-model="updateModalShow" max-width="500px">
        <v-card class="pa-4" color="grey-lighten-4">
          <v-card-text>
            <v-label class="mb-2 font-weight-medium">Person</v-label>
            <!-- <v-combobox v-model="selectedEvent.person" :items="instructorNames" variant="outlined" hide-details
              clearable required class="mb-4" autocomplete="off" /> -->
            <v-combobox v-model="selectedEvent.person" :items="instructorsStore.instructors"
              :item-title="i => `${i.name} ${i.lastName}`" :item-value="i => i.id" return-object variant="outlined"
              hide-details clearable required class="mb-4" autocomplete="off" />

            <v-label class="mb-2 font-weight-medium">Event Title</v-label>
            <v-text-field v-model="updatedTitle" outlined required />

            <!-- ALL DAY SWITCH -->
            <!-- <v-switch v-model="selectedEvent.allDay" inset hide-details label="All day" class="mb-2" /> -->

            <div v-if="!selectedEvent.allDay">
              <v-label class="mb-2 font-weight-medium">Start Date</v-label>
              <v-text-field v-model="selectedEvent.start" type="datetime-local" variant="outlined" hide-details required
                class="mb-4" />
            </div>

            <div v-if="!selectedEvent.allDay">
              <v-label class="mb-2 font-weight-medium">End Date</v-label>
              <v-text-field v-model="selectedEvent.end" type="datetime-local" variant="outlined" hide-details required
                class="mb-4" />
            </div>


            <v-label class="mb-2 font-weight-medium">Event Color</v-label>
            <v-list class="d-flex ga-3 pa-0">
              <v-list-item v-for="option in colorOptions" :key="option.id" class="px-0 py-0" :ripple="false"
                @click="selectColor(option.value, false)">
                <div class="rounded-circle d-flex justify-center align-center elevation-1"
                  style="width: 30px; height: 30px" :style="{ backgroundColor: option.value }">
                  <CheckIcon size="18" color="#fff" v-if="activeColor.updateEvent === option.value" />
                </div>
              </v-list-item>
            </v-list>

            <div class="d-flex mt-6">
              <v-btn @click="updateEvent" color="primary" class="text-white px-6 py-3 rounded-lg" elevation="2">
                <v-icon start>mdi-content-save</v-icon>
                Update
              </v-btn>

              <v-btn @click="deleteEvent" color="error" class="ms-4 text-white px-6 py-3 rounded-lg" elevation="2">
                <v-icon start>mdi-delete</v-icon>
                Delete
              </v-btn>
            </div>
          </v-card-text>
        </v-card>
      </v-dialog>
    </v-card>
  </v-container>
</template>

<style>
.fc .fc-timegrid-event-harness {
  overflow: visible !important;
}

.fc-timegrid-event {
  white-space: normal !important;
  height: auto !important;
  min-height: 100% !important;
  padding: 2px 4px;
  line-height: 1.0;
}

.fc-v-event .fc-event-title {
  white-space: normal !important;
  overflow: visible !important;
  text-overflow: unset !important;
}

.fc .fc-timegrid-slot {
  height: 36px !important;
  /* Ajusta según lo que necesites */
}
</style>