<template>
    <SharedTable title="Deals" :items="leads" table-type="deals" />
</template>
<!-- :headers="headers"  -->
<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLeadsStore } from '@/stores/leads/leads'
import SharedTable from '@/components/TableRecords/SharedTable.vue'

const leadsStore = useLeadsStore()
//leadsStore.loadMockData()
leadsStore.fetchData('DEAL', 'all')

const { leads } = storeToRefs(leadsStore)

</script>
