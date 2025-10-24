<template>
    <v-form ref="formRef" v-model="isValid">
        <v-container fluid>
            <v-row>
                <template v-for="(f, i) in schema.fields" :key="f.id || i">
                    <v-col :cols="f.cols || 12">
                        <!-- radio -->
                        <template v-if="f.type === 'radio'">
                            <div class="text-subtitle-2 mb-1">{{ f.label }}</div>
                            <v-radio-group v-model="formData[f.key]" :rules="rules(f)">
                                <v-radio v-for="opt in (f.options || [])" :key="opt" :label="opt" :value="opt" />
                            </v-radio-group>
                        </template>

                        <!-- date -->
                        <template v-else-if="f.type === 'date'">
                            <v-menu v-model="menus[f.key]" :close-on-content-click="false">
                                <template #activator="{ props }">
                                    <v-text-field v-bind="props" :label="f.label" :model-value="formData[f.key]"
                                        :rules="rules(f)" readonly clearable @click:clear="formData[f.key] = null"
                                        append-inner-icon="mdi-calendar" />
                                </template>
                                <v-card>
                                    <v-date-picker v-model="dateBuffer[f.key]" />
                                    <v-card-actions>
                                        <v-spacer />
                                        <v-btn variant="text" @click="menus[f.key] = false">Cancelar</v-btn>
                                        <v-btn variant="tonal" color="primary" @click="applyDate(f.key)">OK</v-btn>
                                    </v-card-actions>
                                </v-card>
                            </v-menu>
                        </template>

                        <!-- resto -->
                        <component v-else :is="componentOf(f)" v-model="formData[f.key]" :label="f.label"
                            :items="f.type === 'select' ? (f.options || []) : undefined" :multiple="f.multiple || false"
                            :placeholder="f.placeholder || ''" :hint="f.hint || ''" :persistent-hint="!!f.hint"
                            :rules="rules(f)" :clearable="true" :type="inputType(f)" :required="!!f.required" />
                    </v-col>
                </template>
            </v-row>

            <v-row>
                <v-col cols="12" class="d-flex">
                    <v-spacer />
                    <v-btn :loading="submitting" color="primary" @click="onSubmit">
                        {{ schema.submit?.btnText || 'Enviar' }}
                    </v-btn>
                </v-col>
            </v-row>

            <v-alert v-if="okMsg" type="success" variant="tonal" class="mt-4">{{ okMsg }}</v-alert>
            <v-alert v-if="errMsg" type="error" variant="tonal" class="mt-4">{{ errMsg }}</v-alert>
        </v-container>
    </v-form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useFormsStore } from '@/stores/dynamicForms/dynamicForms';
import type { FormSchema, FormField } from '@/lib/formsApi';

const props = defineProps<{ schema: FormSchema; formId?: string | null; onSubmitFn?: (data: any) => any }>();

const store = useFormsStore();
const isValid = ref(false);
const formRef = ref<any>(null);
const formData = reactive<Record<string, any>>({});
const menus = reactive<Record<string, boolean>>({});
const dateBuffer = reactive<Record<string, string | null>>({});
const submitting = ref(false);
const okMsg = ref(''); const errMsg = ref('');

const componentOf = (f: FormField) => {
    if (f.type === 'textarea') return 'v-textarea';
    if (f.type === 'select') return 'v-select';
    if (f.type === 'checkbox') return 'v-checkbox';
    if (f.type === 'switch') return 'v-switch';
    return 'v-text-field';
};
const inputType = (f: FormField) => (f.type === 'email' ? 'email' : f.type === 'number' ? 'number' : 'text');

const rules = (f: FormField) => {
    const r: ((v: any) => true | string)[] = [];
    if (f.required) r.push(v => (Array.isArray(v) ? v.length > 0 : v !== null && v !== '' && v !== undefined) || 'Requerido');
    if (f.type === 'email') {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; r.push(v => !v || re.test(String(v)) || 'Email inválido');
    }
    if (f.type === 'number') {
        r.push(v => (v === '' || v === null || !isNaN(Number(v))) || 'Debe ser numérico');
        if (f.min != null) r.push(v => (v === '' || v === null || Number(v) >= f.min!) || `Min ${f.min}`);
        if (f.max != null) r.push(v => (v === '' || v === null || Number(v) <= f.max!) || `Max ${f.max}`);
    }
    if (f.minLength != null) r.push(v => (!v || String(v).length >= f.minLength!) || `Min ${f.minLength} caracteres`);
    if (f.maxLength != null) r.push(v => (!v || String(v).length <= f.maxLength!) || `Max ${f.maxLength} caracteres`);
    if (f.pattern) { try { const re = new RegExp(f.pattern); r.push(v => (!v || re.test(String(v))) || 'Formato inválido'); } catch { } }
    return r;
};

function init() {
    (props.schema?.fields || []).forEach(f => {
        formData[f.key] = f.default ?? (f.type === 'checkbox' ? false : null);
        if (f.type === 'date') { menus[f.key] = false; dateBuffer[f.key] = null; }
    });
}
watch(() => props.schema, init, { immediate: true });

function applyDate(key: string) { formData[key] = dateBuffer[key]; menus[key] = false; }

async function onSubmit() {
    okMsg.value = ''; errMsg.value = '';
    const ok = (formRef.value as any)?.validate?.();
    if (ok === false) return;

    submitting.value = true;
    try {
        if (props.onSubmitFn) { await props.onSubmitFn(formData); }
        else if (props.formId) { await store.submit(props.formId, formData); }
        okMsg.value = props.schema.submit?.successMessage || '¡Envío registrado!';
    } catch (e: any) {
        errMsg.value = e?.response?.data?.message || e?.message || 'Error al enviar';
    } finally { submitting.value = false; }
}
</script>
