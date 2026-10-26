<template>
  <PageContainer variant="fluid">
    <PageHeader
      title="Clocked in today"
      :subtitle="`Employees with at least one entry · ${label}`"
      :back-to="dashboardLink"
    />

    <AttendanceTable
      :fetch-fn="fetchFn"
      empty-title="No entries"
      empty-description="Nobody clocked in on this date."
    />
  </PageContainer>
</template>

<script setup lang="ts">
import NovaInOutServices from '@/services/NovaInOutServices'
import { useSelectedDate } from '@/composables/useSelectedDate'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import AttendanceTable from '@/components/AdminDashboard/AttendanceTable.vue'

const { label, dashboardLink } = useSelectedDate()

const fetchFn = (date: string) => NovaInOutServices.getDashboard(date).then((d) => d.clockedInToday)
</script>
