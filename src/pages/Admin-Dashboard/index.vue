<template>
  <!--
    `wide` y no `fluid`: el tope de 100rem mantiene el dashboard proporcionado
    en pantallas 4K.
  -->
  <PageContainer variant="wide">
    <PageHeader
      title="Admin dashboard"
      subtitle="Attendance, hours and activity for the selected day"
    />

    <AdminDashboardFilter
      :loading="loading"
      :last-updated="lastUpdated"
      @refresh="reload"
    />

    <p v-if="error" class="dashboard__error" role="alert">{{ error }}</p>

    <KpiGrid :data="data" :loading="initialLoading" />

    <section class="dashboard__grid" aria-label="Charts">
      <HeadcountByHourChart
        class="dashboard__cell dashboard__cell--8"
        :points="data?.charts.headcountByHour ?? []"
        :loading="initialLoading"
      />
      <AttendanceStatusDonut
        class="dashboard__cell dashboard__cell--4"
        :status="data?.charts.status ?? null"
        :loading="initialLoading"
      />

      <HoursByEmployeeChart
        class="dashboard__cell dashboard__cell--6"
        :rows="data?.charts.hoursByEmployee ?? []"
        :loading="initialLoading"
      />
      <ArrivalsChart
        class="dashboard__cell dashboard__cell--6"
        :arrivals="data?.charts.arrivals ?? []"
        :loading="initialLoading"
      />

      <ActivityByHourChart
        class="dashboard__cell dashboard__cell--8"
        :points="data?.charts.activityByHour ?? []"
        :loading="initialLoading"
      />
      <AdminClockOutsByReasonChart
        class="dashboard__cell dashboard__cell--4"
        :rows="data?.charts.adminClockOutsByReason ?? []"
        :loading="initialLoading"
      />
    </section>

    <h2 class="app-eyebrow dashboard__heading">Last 14 days</h2>
    <section class="dashboard__grid" aria-label="Trends">
      <TrendChart
        v-for="item in trends"
        :key="item.metric"
        class="dashboard__cell dashboard__cell--4"
        :days="trend?.days ?? []"
        :metric="item.metric"
        :title="item.title"
        :subtitle="item.subtitle"
        :selected-date="date"
        :loading="loading && !trend"
        :error="trendError"
      />
    </section>

    <h2 class="app-eyebrow dashboard__heading">Detail</h2>
    <EmployeeBreakdownTable :rows="data?.employees ?? []" :loading="initialLoading" />
  </PageContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import AdminDashboardFilter from '@/components/AdminDashboard/AdminDashboardFilter.vue'
import KpiGrid from '@/components/AdminDashboard/KpiGrid.vue'
import EmployeeBreakdownTable from '@/components/AdminDashboard/EmployeeBreakdownTable.vue'
import HeadcountByHourChart from '@/components/AdminDashboard/charts/HeadcountByHourChart.vue'
import AttendanceStatusDonut from '@/components/AdminDashboard/charts/AttendanceStatusDonut.vue'
import HoursByEmployeeChart from '@/components/AdminDashboard/charts/HoursByEmployeeChart.vue'
import ArrivalsChart from '@/components/AdminDashboard/charts/ArrivalsChart.vue'
import ActivityByHourChart from '@/components/AdminDashboard/charts/ActivityByHourChart.vue'
import TrendChart from '@/components/AdminDashboard/charts/TrendChart.vue'
import AdminClockOutsByReasonChart from '@/components/AdminDashboard/charts/AdminClockOutsByReasonChart.vue'
import { useSelectedDate } from '@/composables/useSelectedDate'
import { useAttendanceDashboard } from '@/composables/useAttendanceDashboard'

const { date, isToday, syncToday } = useSelectedDate()

const { data, trend, loading, error, trendError, lastUpdated, reload } =
  useAttendanceDashboard(date, { isToday, onTick: syncToday })

/** Estado de carga solo mientras no hay datos: el refresco no parpadea. */
const initialLoading = computed(() => loading.value && !data.value)

const trends = [
  { metric: 'employees', title: 'Employees per day', subtitle: 'Who clocked in' },
  { metric: 'workedHours', title: 'Hours worked per day', subtitle: 'Total team hours' },
  { metric: 'activityRate', title: 'Activity rate per day', subtitle: 'Active time vs tracked time' },
  { metric: 'adminClockOuts', title: 'Admin clock outs per day', subtitle: 'Shifts closed by an administrator' },
] as const
</script>

<style scoped>
.dashboard__error {
  margin: 0 0 var(--app-space-3);
  padding-inline-start: var(--app-space-3);
  border-inline-start: 2px solid rgb(var(--v-theme-error));
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-error));
}

.dashboard__heading {
  margin: var(--app-space-6) 0 var(--app-space-3);
}

/* Una columna en móvil; rejilla de 12 en escritorio. */
.dashboard__grid {
  display: grid;
  gap: var(--app-space-4);
  grid-template-columns: minmax(0, 1fr);
}

.dashboard__cell {
  min-width: 0; /* evita que ApexCharts fuerce el ancho de la celda */
}

@media (min-width: 1100px) {
  .dashboard__grid {
    grid-template-columns: repeat(12, minmax(0, 1fr));
  }
  .dashboard__cell--4 {
    grid-column: span 4;
  }
  .dashboard__cell--6 {
    grid-column: span 6;
  }
  .dashboard__cell--8 {
    grid-column: span 8;
  }
  .dashboard__cell--12 {
    grid-column: span 12;
  }
}
</style>
