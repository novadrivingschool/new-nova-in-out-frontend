<template>
  <v-container fluid class="app-page">
    <div class="app-page-header">
      <div>
        <h1 class="app-page-title">New form</h1>
        <div class="app-page-subtitle">Build a custom dynamic form</div>
      </div>
    </div>

    <FormBuilder @saved="goEdit" />
  </v-container>
</template>
<script setup lang="ts">
import FormBuilder from '@/components/DynamicForm/FormBuilder.vue';
import { useRouter } from 'vue-router/auto';
const router = useRouter();
function goEdit(f: any) { router.replace({ name: '/Dynamic-Forms/[id]/edit', params: { id: f.id } }); }
</script>
