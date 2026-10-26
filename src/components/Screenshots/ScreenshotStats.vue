<!--
  src/components/Screenshots/ScreenshotStats.vue

  Resumen del rango buscado (no de la página visible): KPIs, gráficas, tabla y
  anomalías de fichaje. Los números los calcula el backend. Con un solo día
  muestra el historial de sesiones clock in → clock out; con varios, el
  resumen por día y oculta el desglose de fichajes.
-->
<template>
  <section class="stats" aria-label="Summary for the selected range">
    <v-divider class="stats__divider" />

    <header class="stats__header">
      <div>
        <h2 class="stats__title">Analytics</h2>
        <p class="stats__subtitle">
          Resumen del rango consultado: tiempo trabajado, rendimiento y actividad.
        </p>
      </div>
      <v-btn
        variant="outlined"
        size="small"
        prepend-icon="mdi-file-pdf-box"
        :loading="downloading"
        :disabled="!canDownload"
        @click="downloadReport"
      >
        Download report
      </v-btn>
    </header>

    <v-snackbar v-model="downloadError" color="error" timeout="5000">
      No se pudo generar el reporte. Inténtalo de nuevo.
    </v-snackbar>

    <v-alert v-if="error" type="warning" variant="tonal" density="compact">
      No se pudo cargar el resumen. Las capturas de arriba no se ven afectadas.
    </v-alert>

    <div v-else-if="loading || !stats" class="app-autogrid" style="--app-autogrid-min: 12rem">
      <v-skeleton-loader v-for="n in 6" :key="n" type="heading, text" class="rounded-lg" />
    </div>

    <template v-else>
      <div class="app-autogrid" style="--app-autogrid-min: 12rem">
        <StatCard
          label="Total worked"
          :value="formatDuration(stats.totalSeconds)"
          :hint="`${stats.sessions.length} ${stats.sessions.length === 1 ? 'sesión' : 'sesiones'}`"
          info="Tiempo entre cada clock in y su clock out. Una sesión sin clock out cuenta hasta el último registro del rango."
        />
        <StatCard
          label="Active time"
          :value="formatDuration(stats.activeSeconds)"
          :hint="
            stats.activeShare === null ? undefined : `${stats.activeShare}% del tiempo trabajado`
          "
          info="Tiempo con actividad real de teclado y mouse, del total que la persona estuvo con clock in."
        />
        <StatCard
          label="Performance"
          :value="stats.performance"
          unit="%"
          :tone="rating?.color"
          :badge="rating?.label"
          :hint="performanceHint"
          info="Tiempo activo entre el tiempo capturable (la suma del intervalo de cada captura). Es el mismo cálculo de la barra de cada captura, sumado."
        />
        <StatCard
          label="Connection"
          :value="stats.coverage.connectedPct"
          unit="%"
          :hint="
            stats.coverage.withoutConnection
              ? `${stats.coverage.withoutConnection} sin conexión`
              : 'Todas con conexión'
          "
          info="Porcentaje de capturas registradas con conexión. Una captura sin internet conserva su actividad real, y si fue de 0% no entra al performance. Una offline (app cerrada o equipo apagado) cuenta como 0%."
        />
        <StatCard
          label="Pauses"
          :value="stats.pauses.count"
          :hint="
            stats.pauses.count
              ? `${formatDuration(stats.pauses.totalSeconds)} en total · la más larga ${formatDuration(stats.pauses.longestSeconds)}`
              : 'Ninguna de 1 min o más'
          "
          info="Veces que la persona salió y volvió a entrar el mismo día por 1 minuto o más."
        />
        <StatCard
          label="Admin clock outs"
          :value="stats.adminClockOuts"
          :hint="stats.adminClockOuts ? 'Sesiones cerradas por un admin' : 'Ninguno en este rango'"
          info="Sesiones cuyo clock out lo hizo un administrador (por ejemplo, por un corte de luz o de internet). Cierran la sesión igual que uno normal, así que sus horas sí cuentan. El motivo se ve en la captura del clock out."
        />
        <StatCard
          label="Clock anomalies"
          :value="stats.anomalies.length"
          :hint="stats.anomalies.length ? 'Ver detalle abajo' : 'Ninguna detectada'"
          info="Clock in sin clock out, clock in duplicado, clock out sin clock in, y sesiones de menos de 1 minuto o de más de 12 horas."
        />
      </div>

      <ScreenshotCharts :key="multiDay ? 'multi' : 'single'" :stats="stats" :multi-day="multiDay" />

      <!-- Varios días: resumen diario -->
      <v-card v-if="multiDay" class="history">
        <div class="history__head">Daily summary</div>

        <EmptyState
          v-if="!stats.days.length"
          title="No activity"
          description="No hay actividad en este rango."
          icon="mdi-calendar-blank-outline"
        />

        <v-table v-else fixed-header :height="daysHeight" density="comfortable">
          <thead>
            <tr>
              <th>Date</th>
              <th class="text-right">Worked</th>
              <th class="text-right">Active</th>
              <th class="daily__perf-col">Performance</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="day in stats.days" :key="day.date">
              <td>{{ formatDisplayDate(day.date) }}</td>
              <td class="tabular text-right history__duration">
                {{ formatDuration(day.totalSeconds) }}
              </td>
              <td class="tabular text-right">
                {{ formatDuration(day.activeSeconds) }}
              </td>
              <td class="daily__perf-col">
                <div v-if="day.performance !== null" class="daily__perf">
                  <v-progress-linear
                    :model-value="day.performance"
                    :color="progressColor(day.performance)"
                    bg-color="on-surface"
                    :bg-opacity="0.14"
                    height="8"
                    rounded
                  />
                  <span class="tabular daily__perf-value">{{ day.performance }}%</span>
                </div>
                <span v-else class="history__next-day">—</span>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <!-- Un día: historial de fichajes -->
      <v-card v-else class="history">
        <div class="history__head">Clock in / out history</div>

        <EmptyState
          v-if="!stats.sessions.length"
          title="No clock sessions"
          description="No hay registros de clock in / clock out en este rango."
          icon="mdi-clock-outline"
        />

        <v-table v-else fixed-header :height="sessionsHeight" density="comfortable">
          <thead>
            <tr>
              <th>Date</th>
              <th>Clock in</th>
              <th>Clock out</th>
              <th class="text-right">Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(session, index) in sessionsDesc" :key="index">
              <td>{{ formatDisplayDate(session.startDate) }}</td>
              <td class="tabular">
                <span class="dot dot--in" aria-hidden="true" />{{ session.startTime }}
              </td>
              <td class="tabular">
                <v-chip v-if="session.open" size="x-small" color="warning" variant="tonal">
                  Open
                </v-chip>
                <template v-else>
                  <span class="dot dot--out" aria-hidden="true" />{{ session.endTime }}
                  <span v-if="session.endDate !== session.startDate" class="history__next-day">
                    {{ formatDisplayDate(session.endDate) }}
                  </span>
                  <v-chip
                    v-if="session.closedByAdmin"
                    size="x-small"
                    color="warning"
                    variant="tonal"
                    class="ml-2"
                    :title="session.adminReason ? undefined : 'Reason not recorded'"
                  >
                    Admin · {{ adminReasonLabel(session.adminReason) }}
                  </v-chip>
                </template>
              </td>
              <td class="tabular text-right history__duration">
                {{ formatDuration(session.durationSeconds) }}
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <!-- Anomalías de fichaje -->
      <v-card v-if="stats.anomalies.length" class="history">
        <div class="history__head">Clock anomalies</div>
        <v-table fixed-header :height="anomalyHeight" density="comfortable">
          <thead>
            <tr>
              <th>Type</th>
              <th>Date</th>
              <th>Time</th>
              <th>Detail</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(anomaly, index) in stats.anomalies" :key="index">
              <td>
                <v-chip size="x-small" color="warning" variant="tonal">
                  {{ ANOMALY_LABELS[anomaly.type] }}
                </v-chip>
              </td>
              <td>{{ formatDisplayDate(anomaly.date) }}</td>
              <td class="tabular">{{ anomaly.time }}</td>
              <td>{{ anomaly.detail }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-card>
    </template>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import NovaInOutServices from '@/services/NovaInOutServices'
import type { Employee } from '@/types/screenshots'
import StatCard from '@/components/common/StatCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import ScreenshotCharts from './ScreenshotCharts.vue'
import {
  adminReasonLabel,
  formatDisplayDate,
  performanceRating,
  progressColor,
} from './screenshotFormat'
import { ANOMALY_LABELS, formatDuration, type ScreenshotStats } from './screenshotStats'

const props = defineProps<{
  stats: ScreenshotStats | null
  loading?: boolean
  /** Las estadísticas no pudieron cargarse. */
  error?: boolean
  multiDay?: boolean
  employee: Employee | null
  /** Rango de la última búsqueda. */
  range: { start: string; end: string } | null
}>()

const downloading = ref(false)
const downloadError = ref(false)
/** Calificación del performance general (null si no hay capturas). */
const rating = computed(() =>
  props.stats && props.stats.performance !== null
    ? performanceRating(props.stats.performance)
    : null,
)

const canDownload = computed(() => !!props.employee?.profile && !!props.range)

async function downloadReport(): Promise<void> {
  const profile = props.employee?.profile
  if (!profile || !props.range || downloading.value) return
  downloading.value = true
  try {
    await NovaInOutServices.downloadReportPdf({
      employeeNumber: profile.employee_number,
      employeeName: `${profile.firstName} ${profile.lastName}`.trim(),
      startDate: props.range.start,
      endDate: props.range.end,
    })
  } catch {
    downloadError.value = true
  } finally {
    downloading.value = false
  }
}

/** Más recientes primero, como la rejilla. */
const sessionsDesc = computed(() => [...(props.stats?.sessions ?? [])].reverse())

/** Si hay pocas anomalías la tabla se ajusta; con muchas hace scroll. */
/** Las tablas se ajustan al número de filas; con muchas hacen scroll (como anomalías). */
const sessionsHeight = computed(() => Math.min(360, 56 + (props.stats?.sessions.length ?? 0) * 49))
const daysHeight = computed(() => Math.min(360, 56 + (props.stats?.days.length ?? 0) * 49))
const anomalyHeight = computed(() => Math.min(360, 56 + (props.stats?.anomalies.length ?? 0) * 49))

const performanceHint = computed(() => {
  const s = props.stats
  if (!s) return undefined
  return s.connectedPerformance !== null && s.connectedPerformance !== s.performance
    ? `${s.connectedPerformance}% si no se cuentan las capturas sin conexión`
    : `${s.captures} capturas`
})
</script>

<style scoped>
.stats {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4);
  margin-top: var(--app-space-6);
}

.stats__divider {
  margin-bottom: var(--app-space-2);
  opacity: 1;
}

.stats__header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
}

.stats__title {
  font-size: var(--app-text-lg, 1.125rem);
  font-weight: 700;
  line-height: 1.2;
}

.stats__subtitle {
  margin: 2px 0 0;
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}

.history__head {
  padding: var(--app-space-4);
  font-size: var(--app-text-sm);
  font-weight: 600;
  border-bottom: 1px solid rgba(var(--v-border-color), 1);
}

/* Cabecera diferenciada, filas cebra y resaltado al pasar el cursor. */
.history th {
  background: rgb(var(--v-theme-surface-variant)) !important;
  font-size: var(--app-text-2xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant)) !important;
  border-bottom: 1px solid rgba(var(--v-border-color), 1) !important;
}

.history tbody tr:nth-child(even) {
  background: rgba(var(--v-theme-on-surface), 0.045);
}

.history tbody tr {
  transition: background-color var(--app-transition);
}

.history tbody tr:hover {
  background: rgba(var(--v-theme-primary), 0.09);
}

.history td {
  border-bottom: 1px solid rgba(var(--v-border-color), 0.6) !important;
}

.history__duration {
  font-weight: 700;
}

.history td,
.history th {
  white-space: nowrap;
}

.daily__perf-col {
  min-width: 12rem;
}

.daily__perf {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
}

/* La barra cede ancho; el porcentaje nunca se parte en dos líneas. */
.daily__perf :deep(.v-progress-linear) {
  flex: 1 1 auto;
  min-width: 5rem;
}

.daily__perf-value {
  flex: 0 0 auto;
  min-width: 4ch;
  text-align: right;
  font-weight: 700;
  white-space: nowrap;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: var(--app-space-2);
  border-radius: 50%;
}

.dot--in {
  background: rgb(var(--v-theme-success));
}

.dot--out {
  background: rgb(var(--v-theme-error));
}

.tabular {
  font-variant-numeric: tabular-nums;
}

.history__next-day {
  margin-left: var(--app-space-1);
  font-size: var(--app-text-2xs);
  color: rgb(var(--v-theme-on-surface-variant));
}
</style>
