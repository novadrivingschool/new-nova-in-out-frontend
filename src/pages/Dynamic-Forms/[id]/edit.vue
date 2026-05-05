<template>
  <v-container fluid class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">Edit form</h1>
        <div class="app-page-subtitle">Update fields and configuration</div>
      </div>
    </div>

    <FormBuilder :form-id="id" />
  </v-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router/auto';
import FormBuilder from '@/components/DynamicForm/FormBuilder.vue';

const route = useRoute('/Dynamic-Forms/[id]/edit');
const id = route.params.id;
</script>
