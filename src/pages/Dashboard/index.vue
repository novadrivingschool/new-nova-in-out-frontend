<template>
  <v-container fluid class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Welcome to your dashboard</h1>
        <div class="app-page-subtitle">Here is a quick overview of your CRM</div>
      </div>
    </div>

    <v-row class="ma-0" dense>
      <v-col v-for="card in metricCards" :key="card.title" cols="12" sm="6" md="3">
        <v-card class="app-card pa-5 fill-height" elevation="0">
          <div class="d-flex align-center justify-space-between mb-3">
            <span class="text-caption text-medium-emphasis font-weight-bold text-uppercase" style="letter-spacing: 0.06em;">
              {{ card.title }}
            </span>
            <div
              class="d-flex align-center justify-center"
              :style="`background: rgba(var(--v-theme-${card.color}), 0.12); width: 40px; height: 40px; border-radius: 12px;`"
            >
              <v-icon :color="card.color" size="20">{{ card.icon }}</v-icon>
            </div>
          </div>
          <div class="text-h4 font-weight-bold">{{ card.value }}</div>
          <div class="text-caption text-medium-emphasis mt-1">{{ card.hint }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-card class="app-card mt-6 pa-6" elevation="0">
      <div class="text-subtitle-1 font-weight-bold mb-2">Get started</div>
      <p class="text-body-2 text-medium-emphasis ma-0">
        Use the sidebar to navigate through Leads, Contacts, Deals, Calendar and more.
      </p>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const metricCards = ref([
  { title: 'Leads', value: '—', hint: 'Total registered', icon: 'mdi-account-multiple', color: 'primary' },
  { title: 'Contacts', value: '—', hint: 'Active contacts', icon: 'mdi-account-box-outline', color: 'info' },
  { title: 'Deals', value: '—', hint: 'In pipeline', icon: 'mdi-handshake-outline', color: 'success' },
  { title: 'Today', value: '—', hint: 'Scheduled events', icon: 'mdi-calendar-today', color: 'warning' },
])
</script>
