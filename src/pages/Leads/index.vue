<template>
    <SharedTable title="Leads" :items="leads" table-type="leads" />
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLeadsStore } from '@/stores/leads/leads'
import SharedTable from '@/components/TableRecords/SharedTable.vue'

const leadsStore = useLeadsStore()
//leadsStore.loadMockData()
leadsStore.fetchData('LEAD', 'all')

const { leads } = storeToRefs(leadsStore)

</script>
