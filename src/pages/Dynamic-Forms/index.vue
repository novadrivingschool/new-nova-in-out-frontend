<template>
    <v-container>
        <h2 class="mb-4">Nuevo formulario</h2>
        <FormBuilder @saved="goEdit" />
    </v-container>
</template>
<script setup lang="ts">
import FormBuilder from '@/components/DynamicForm/FormBuilder.vue';
import { useRouter } from 'vue-router/auto';
const router = useRouter();
function goEdit(f: any) { router.replace({ name: '/Dynamic-Forms/[id]/edit', params: { id: f.id } }); }
</script>
