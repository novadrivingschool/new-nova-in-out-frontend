<template>
  <PageContainer variant="constrained">
    <PageHeader title="Hand shake" subtitle="Device connection status" />

    <v-card>
      <EmptyState
        title="Coming soon"
        description="This section is under development. Device pairing and connection diagnostics will live here."
        icon="mdi-handshake-outline"
      >
        <template #actions>
          <v-btn
            color="primary"
            variant="flat"
            prepend-icon="mdi-view-grid-outline"
            @click="router.push('/admin-dashboard')"
          >
            Go to dashboard
          </v-btn>
          <v-btn
            variant="outlined"
            prepend-icon="mdi-broadcast"
            @click="router.push('/live-staff-activity')"
          >
            Live activity
          </v-btn>
        </template>
      </EmptyState>
    </v-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

const router = useRouter()
</script>
