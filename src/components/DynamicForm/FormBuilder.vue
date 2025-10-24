<template>
  <v-card class="pa-4">
    <v-text-field v-model="form.name" label="Nombre del formulario" required />
    <v-textarea v-model="form.description" label="Descripción" />
    <v-switch v-model="form.isPublic" label="Formulario público" />

    <div class="d-flex align-center mb-2">
      <v-btn color="primary" size="small" @click="addField">Agregar campo</v-btn>
      <v-spacer />
      <v-btn variant="text" size="small" @click="expand = !expand">{{ expand ? 'Contraer' : 'Expandir' }}</v-btn>
    </div>

    <v-table density="comfortable" class="mb-4">
      <thead>
        <tr>
          <th>#</th>
          <th>Etiqueta</th>
          <th>Clave</th>
          <th>Tipo</th>
          <th>Req.</th>
          <th>Cols</th>
          <th>Orden</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(f, idx) in form.fields" :key="f.id">
          <td>{{ idx + 1 }}</td>
          <td><v-text-field density="compact" v-model="f.label" /></td>
          <td><v-text-field density="compact" v-model="f.key" /></td>
          <td><v-select density="compact" :items="types" v-model="f.type" /></td>
          <td class="text-center"><v-checkbox v-model="f.required" hide-details density="compact" /></td>
          <td style="max-width:90px;"><v-text-field density="compact" v-model.number="f.cols" type="number" /></td>
          <td class="d-flex">
            <v-btn icon size="x-small" @click="moveUp(idx)" :disabled="idx === 0"><v-icon>mdi-chevron-up</v-icon></v-btn>
            <v-btn icon size="x-small" @click="moveDown(idx)" :disabled="idx === form.fields.length - 1"><v-icon>mdi-chevron-down</v-icon></v-btn>
          </td>
          <td class="text-right">
            <v-btn icon size="x-small" @click="f._editing = !f._editing">
              <v-icon>{{ f._editing ? 'mdi-chevron-up' : 'mdi-cog' }}</v-icon>
            </v-btn>
            <v-btn icon size="x-small" color="error" @click="removeField(idx)"><v-icon>mdi-delete</v-icon></v-btn>
          </td>
        </tr>

        <tr v-for="(f, idx) in form.fields" :key="'ed-' + f.id" v-show="expand || f._editing">
          <td colspan="8">
            <v-row>
              <v-col cols="12" md="4">
                <v-text-field density="compact" v-model="f.placeholder" label="Placeholder" />
                <v-text-field density="compact" v-model="f.hint" label="Hint" />
                <v-text-field density="compact" v-model="f.default" label="Default" />
              </v-col>

              <v-col cols="12" md="4" v-if="f.type === 'number'">
                <v-text-field density="compact" v-model.number="f.min" type="number" label="Min" />
                <v-text-field density="compact" v-model.number="f.max" type="number" label="Max" />
              </v-col>

              <v-col cols="12" md="4" v-if="f.type === 'text' || f.type === 'textarea'">
                <v-text-field density="compact" v-model.number="f.minLength" type="number" label="Min length" />
                <v-text-field density="compact" v-model.number="f.maxLength" type="number" label="Max length" />
                <v-text-field density="compact" v-model="f.pattern" label="Pattern (regex)" />
              </v-col>

              <v-col cols="12" md="8" v-if="f.type === 'select' || f.type === 'radio'">
                <v-textarea
                  density="compact"
                  label="Opciones (una por línea)"
                  :model-value="(f.options || []).join('\n')"
                  @update:model-value="val => f.options = (val || '').split('\n').filter(Boolean)"
                />
                <v-checkbox v-if="f.type === 'select'" v-model="f.multiple" label="Selección múltiple" />
              </v-col>
            </v-row>

            <v-divider class="my-4" />
          </td>
        </tr>
      </tbody>
    </v-table>

    <v-text-field v-model="form.submit.btnText" label="Texto botón enviar" />
    <v-text-field v-model="form.submit.successMessage" label="Mensaje de éxito" />

    <div class="d-flex">
      <v-btn :loading="saving" color="primary" @click="save">Guardar</v-btn>
      <v-spacer />
      <v-text-field
        v-if="form.isPublic && form.publicToken"
        :model-value="publicUrl"
        readonly
        prepend-inner-icon="mdi-link"
        style="max-width:440px"
      />
      <v-btn v-if="form.isPublic && form.publicToken" variant="text" @click="copy()">Copiar link</v-btn>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useFormsStore } from '@/stores/dynamicForms/dynamicForms';
import type { FormSchema, FormField } from '@/lib/formsApi';

const props = defineProps<{ formId?: string | null }>();
const emit = defineEmits<{ (e: 'saved', form: FormSchema): void }>();

const store = useFormsStore();
const saving = ref(false);
const expand = ref(false);
const types = ['text','textarea','number','select','date','email','checkbox','radio','switch'];

// 👇 Campo con flag de edición sólo para UI
type UIFormField = FormField & { _editing?: boolean };

// 👇 En este componente, submit es requerido y fields incluye UIFormField
type LocalForm = Omit<FormSchema, 'fields' | 'submit'> & {
  fields: UIFormField[];
  submit: NonNullable<FormSchema['submit']>;
};

const form = reactive<LocalForm>({
  id: undefined,
  name: '',
  description: '',
  isPublic: true,
  publicToken: undefined,
  fields: [],
  submit: { btnText: 'Enviar', successMessage: '¡Gracias!' },
});

const publicUrl = computed(() =>
  form.publicToken ? `${window.location.origin}/f/${form.publicToken}` : ''
);

onMounted(async () => {
  if (!props.formId) return;

  const fetched = await store.fetchForm(props.formId); // puede ser null
  if (!fetched) return;

  Object.assign(form, {
    ...fetched,
    submit: fetched.submit ?? { btnText: 'Enviar', successMessage: '¡Gracias!' },
    // añade _editing a cada campo para el editor
    fields: (Array.isArray(fetched.fields) ? fetched.fields : []).map(f => ({ ...f, _editing: false })) as UIFormField[],
  });
});

function addField() {
  const id = 'fld_' + Math.random().toString(36).slice(2, 9);
  form.fields.push({
    id, key: id, label: 'Nuevo campo', type: 'text',
    required: false, placeholder: '', hint: '',
    options: [], multiple: false, min: null, max: null,
    minLength: null, maxLength: null, pattern: null,
    cols: 12, default: null, _editing: true,
  });
}
const removeField = (i: number) => form.fields.splice(i, 1);
function moveUp(i: number)  { if (i > 0) { const a = form.fields; [a[i-1], a[i]] = [a[i], a[i-1]]; } }
function moveDown(i: number){ const a = form.fields; if (i < a.length - 1) [a[i+1], a[i]] = [a[i], a[i+1]]; }

async function save() {
  saving.value = true;
  try {
    // ❗️No persistas _editing
    const payload: FormSchema = {
      ...form,
      fields: form.fields.map(({ _editing, ...rest }) => rest),
    };
    const saved = await store.save(payload);

    // Recarga el estado local y vuelve a poner _editing
    Object.assign(form, {
      ...saved,
      submit: saved.submit ?? { btnText: 'Enviar', successMessage: '¡Gracias!' },
      fields: (Array.isArray(saved.fields) ? saved.fields : []).map((f: any) => ({ ...f, _editing: false })) as UIFormField[],
    });

    emit('saved', saved);
  } finally {
    saving.value = false;
  }
}

function copy() {
  if (!publicUrl.value) return;
  navigator.clipboard?.writeText(publicUrl.value);
}
</script>

