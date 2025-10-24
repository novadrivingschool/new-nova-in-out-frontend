<template>
    <SharedTable title="Contacts" :items="leads" table-type="contacts" />
</template>
<!-- :headers="headers" -->

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useLeadsStore } from '@/stores/leads/leads'
import SharedTable from '@/components/TableRecords/SharedTable.vue'

const leadsStore = useLeadsStore()
//leadsStore.loadMockData()
leadsStore.fetchData('CONTACT', 'all')

const { leads } = storeToRefs(leadsStore)

/* const headers = [
    { text: 'Actions', value: 'actions', align: 'center' },
    { title: 'Type', key: 'type' },
    { title: 'Full Name', key: 'fullName' },
    { title: 'Phone', key: 'phone' },
    { title: 'Email', key: 'email' },
    { title: 'Source', key: 'source' },
    { title: 'Location', key: 'location' },
    { title: 'Reminder', key: 'reminder' },
    { title: 'Follow Up', key: 'followUp' },
    { title: 'Assigned To', key: 'assignedTo' },
    { title: 'Programs Offered', key: 'programsOffered' },
    { title: 'Programs Sold', key: 'programsSold' }
] */
</script>
