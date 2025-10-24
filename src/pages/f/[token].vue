<template>
  <v-container>
    <v-skeleton-loader v-if="loading" type="article" />
    <div v-else>
      <h2 class="mb-2">{{ form?.name }}</h2>
      <p class="text-medium-emphasis mb-6">{{ form?.description }}</p>

      <v-alert type="warning" v-if="!form?.fields?.length">
        Este formulario no tiene campos configurados.
      </v-alert>

      <DynamicForm v-else :schema="form" :form-id="form.id" />
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router/auto';
import { useFormsStore } from '@/stores/dynamicForms/dynamicForms';
import DynamicForm from '@/components/DynamicForm/DynamicForm.vue';

// 👇 MUY IMPORTANTE: tipar la ruta por el path del archivo
const route = useRoute('/f/[token]');
const token = route.params.token;

const store = useFormsStore();
const loading = ref(true);
const form = ref<any>(null);

onMounted(async () => {
  try {
    form.value = await store.fetchPublic(token);
    console.log('[PUBLIC FORM]', form.value);
  } finally {
    loading.value = false;
  }
});
</script>
