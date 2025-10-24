<template>
  <v-container>
    <h2 class="mb-4">Editar formulario</h2>
    <FormBuilder :form-id="id" />
  </v-container>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router/auto';
import FormBuilder from '@/components/DynamicForm/FormBuilder.vue';

// 🔒 Tipamos la ruta por su path de archivo:
const route = useRoute('/Dynamic-Forms/[id]/edit');
// Aquí TS ya sabe que params = { id: string }
const id = route.params.id;
</script>
