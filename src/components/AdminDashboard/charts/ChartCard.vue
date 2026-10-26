<!--
  src/components/AdminDashboard/charts/ChartCard.vue

  Contenedor común de las gráficas del dashboard: título, subtítulo y los tres
  estados (cargando, error, vacío) resueltos en un solo sitio, para que cada
  gráfica solo declare su contenido.
-->
<template>
  <v-card class="chart-card">
    <header class="chart-card__head">
      <div class="chart-card__title-row">
        <h3 class="chart-card__title">{{ title }}</h3>
        <InfoTip v-if="info" :text="info" :label="title" />
      </div>
      <p v-if="subtitle" class="chart-card__subtitle">{{ subtitle }}</p>
    </header>

    <div class="chart-card__body">
      <ActivityLoader v-if="loading" label="Loading…" />

      <v-alert v-else-if="error" type="error" variant="tonal" density="compact">
        {{ error }}
      </v-alert>

      <EmptyState
        v-else-if="empty"
        :title="emptyTitle"
        :description="emptyDescription"
      />

      <slot v-else />
    </div>
  </v-card>
</template>

<script setup lang="ts">
import InfoTip from '@/components/common/InfoTip.vue'
import ActivityLoader from '@/components/common/ActivityLoader.vue'
import EmptyState from '@/components/common/EmptyState.vue'

withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** Explicación de la gráfica (tooltip "i"). */
    info?: string
    loading?: boolean
    error?: string | null
    /** true cuando no hay datos que graficar. */
    empty?: boolean
    emptyTitle?: string
    emptyDescription?: string
  }>(),
  {
    loading: false,
    error: null,
    empty: false,
    emptyTitle: 'No data',
    emptyDescription: 'There is nothing to show for this date.',
  },
)
</script>

<style scoped>
.chart-card {
  height: 100%;
}

.chart-card__head {
  padding: var(--app-space-4) var(--app-space-4) 0;
}

.chart-card__title-row {
  display: flex;
  align-items: center;
  gap: var(--app-space-1);
}

.chart-card__title {
  margin: 0;
  font-size: var(--app-text-md, 1rem);
  font-weight: 700;
  letter-spacing: -0.01em;
}

.chart-card__subtitle {
  margin: var(--app-space-1) 0 0;
  font-size: var(--app-text-sm);
  color: rgb(var(--v-theme-on-surface-variant));
}

.chart-card__body {
  padding: var(--app-space-3) var(--app-space-4) var(--app-space-4);
}
</style>
