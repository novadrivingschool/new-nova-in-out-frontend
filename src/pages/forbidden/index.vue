<!--
  src/pages/forbidden/index.vue

  Destino del guard del router cuando el usuario no tiene la vista pedida.
-->
<template>
  <PageContainer variant="narrow" align="start">
    <PageHeader title="No access" subtitle="You don't have permission to open this page" />

    <v-card>
      <div class="forbidden__body">
        <v-icon size="40" color="warning" class="mb-3">mdi-lock-outline</v-icon>
        <p class="forbidden__lead">
          Your account doesn't have access to this view. If you need it, ask a super admin to grant it.
        </p>
        <v-btn v-if="home" color="primary" variant="flat" :to="home">Go to {{ homeTitle }}</v-btn>
      </div>
    </v-card>
  </PageContainer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import PageContainer from '@/components/common/PageContainer.vue'
import PageHeader from '@/components/common/PageHeader.vue'
import { PERMISSIONS_ROUTE, VIEW_CATALOG, firstAccessibleRoute } from '@/config/views'
import { useAuth } from '@/stores/auth/useAuth'

const auth = useAuth()

const home = computed(
  () => firstAccessibleRoute(auth.canView) ?? (auth.isSuperAdmin ? PERMISSIONS_ROUTE : null),
)
const homeTitle = computed(
  () => VIEW_CATALOG.find((v) => v.route === home.value)?.title ?? 'Permissions',
)
</script>

<style scoped>
.forbidden__body {
  padding: 24px 20px;
}
.forbidden__lead {
  margin: 0 0 16px;
  font-size: 0.875rem;
  opacity: 0.85;
}
</style>
