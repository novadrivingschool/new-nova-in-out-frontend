<template>
  <PageContainer variant="fluid">
    <PageHeader
      title="Clocked in now"
      :subtitle="isToday ? 'Employees currently on the clock' : `Still clocked in at end of day · ${label}`"
      :back-to="dashboardLink"
    />

    <AttendanceTable
      :fetch-fn="fetchFn"
      hide-status
      empty-title="Nobody is clocked in"
      empty-description="No employee is on the clock for this date."
    />
  </PageContainer>
</template>

<script setup lang="ts">
import NovaInOutServices from '@/services/NovaInOutServices'
import { useSelectedDate } from '@/composables/useSelectedDate'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import AttendanceTable from '@/components/AdminDashboard/AttendanceTable.vue'

const { isToday, label, dashboardLink } = useSelectedDate()

const fetchFn = (date: string) => NovaInOutServices.getDashboard(date).then((d) => d.clockedInNow)
</script>
