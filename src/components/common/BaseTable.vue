<template>
  <v-data-table
    :headers="headers"
    :items="items"
    :loading="loading"
    :items-length="totalItems"
    :items-per-page="itemsPerPage"
    :page="page"
    @update:page="emit('update:page', $event)"
    @update:items-per-page="emit('update:itemsPerPage', $event)"
    hover
    class="app-base-table"
    no-data-text="No data available"
    loading-text="Loading items... please wait"
  >
    <template v-for="(_, name) in $slots" v-slot:[name]="slotProps">
      <slot :name="name" v-bind="slotProps" />
    </template>
  </v-data-table>
</template>

<script setup lang="ts">
import { ref } from "vue";

interface Props {
  headers: any[];
  items: any[];
  loading?: boolean;
  itemsPerPage?: number;
  page?: number;
  totalItems?: number;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  showSearch: false,
  itemsPerPage: 10,
  page: 1,
  totalItems: 0,
});

const emit = defineEmits<{
  (e: "update:page", value: number): void;
  (e: "update:itemsPerPage", value: number): void;
}>();
</script>

<style scoped>
.app-base-table :deep(.v-data-table-header th) {
  font-weight: 700 !important;
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.05em;
  background-color: rgb(var(--v-theme-surface-variant), 0.2);
}
</style>
