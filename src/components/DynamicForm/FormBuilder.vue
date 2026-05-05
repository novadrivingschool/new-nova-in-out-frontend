<template>
  <v-card class="app-card pa-5 pa-sm-6" elevation="0">
    <!-- Sección: Información general -->
    <div class="form-section-label">Form info</div>
    <v-row dense>
      <v-col cols="12" md="6">
        <v-text-field v-model="form.name" label="Form name" required prepend-inner-icon="mdi-form-textbox" />
      </v-col>
      <v-col cols="12" md="6">
        <v-switch v-model="form.isPublic" color="primary" label="Public form" hide-details density="compact" class="mt-1" />
      </v-col>
      <v-col cols="12">
        <v-textarea v-model="form.description" label="Description" rows="2" auto-grow />
      </v-col>
    </v-row>

    <v-divider class="my-5" />

    <!-- Sección: Campos -->
    <div class="d-flex align-center mb-3 ga-2 flex-wrap">
      <div class="form-section-label ma-0">Fields</div>
      <v-chip size="x-small" variant="tonal" color="primary">{{ form.fields.length }}</v-chip>
      <v-spacer />
      <v-btn variant="text" size="small" @click="expand = !expand"
        :prepend-icon="expand ? 'mdi-chevron-up' : 'mdi-chevron-down'">
        {{ expand ? 'Contraer' : 'Expandir' }}
      </v-btn>
      <v-btn color="primary" size="small" prepend-icon="mdi-plus" variant="tonal" @click="addField">
        Agregar campo
      </v-btn>
    </div>

    <v-card variant="outlined" class="overflow-hidden mb-4" rounded="lg">
      <v-table density="comfortable" class="mb-0">
        <thead>
          <tr>
            <th style="width: 40px;">#</th>
            <th>Etiqueta</th>
            <th>Clave</th>
            <th>Tipo</th>
            <th class="text-center" style="width: 70px;">Req.</th>
            <th style="width: 90px;">Cols</th>
            <th style="width: 90px;">Orden</th>
            <th class="text-end" style="width: 100px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="form.fields.length === 0">
            <td colspan="8">
              <div class="app-empty-state py-6">
                <v-icon>mdi-form-select</v-icon>
                <div class="text-subtitle-2 font-weight-medium">No fields yet</div>
                <div class="text-body-2 mt-1">Click “Agregar campo” to add one.</div>
              </div>
            </td>
          </tr>
          <template v-for="(f, idx) in form.fields" :key="f.id">
            <tr>
              <td class="text-medium-emphasis">{{ idx + 1 }}</td>
              <td><v-text-field density="compact" v-model="f.label" hide-details variant="outlined" /></td>
              <td><v-text-field density="compact" v-model="f.key" hide-details variant="outlined" /></td>
              <td><v-select density="compact" :items="types" v-model="f.type" hide-details variant="outlined" /></td>
              <td class="text-center"><v-checkbox v-model="f.required" hide-details density="compact" color="primary" /></td>
              <td><v-text-field density="compact" v-model.number="f.cols" type="number" hide-details variant="outlined" /></td>
              <td>
                <div class="d-flex">
                  <v-btn icon="mdi-chevron-up" variant="text" size="x-small" @click="moveUp(idx)" :disabled="idx === 0" />
                  <v-btn icon="mdi-chevron-down" variant="text" size="x-small" @click="moveDown(idx)" :disabled="idx === form.fields.length - 1" />
                </div>
              </td>
              <td class="text-end">
                <v-btn :icon="f._editing ? 'mdi-chevron-up' : 'mdi-cog-outline'" variant="text" size="x-small"
                  @click="f._editing = !f._editing" />
                <v-btn icon="mdi-delete-outline" variant="text" size="x-small" color="error" @click="removeField(idx)" />
              </td>
            </tr>

            <tr v-show="expand || f._editing" class="field-detail-row">
              <td colspan="8">
                <v-row>
                  <v-col cols="12" md="4">
                    <v-text-field density="compact" v-model="f.placeholder" label="Placeholder" />
                    <v-text-field density="compact" v-model="f.hint" label="Hint" class="mt-2" />
                    <v-text-field density="compact" v-model="f.default" label="Default" class="mt-2" />
                  </v-col>

                  <v-col cols="12" md="4" v-if="f.type === 'number'">
                    <v-text-field density="compact" v-model.number="f.min" type="number" label="Min" />
                    <v-text-field density="compact" v-model.number="f.max" type="number" label="Max" class="mt-2" />
                  </v-col>

                  <v-col cols="12" md="4" v-if="f.type === 'text' || f.type === 'textarea'">
                    <v-text-field density="compact" v-model.number="f.minLength" type="number" label="Min length" />
                    <v-text-field density="compact" v-model.number="f.maxLength" type="number" label="Max length" class="mt-2" />
                    <v-text-field density="compact" v-model="f.pattern" label="Pattern (regex)" class="mt-2" />
                  </v-col>

                  <v-col cols="12" md="8" v-if="f.type === 'select' || f.type === 'radio'">
                    <v-textarea
                      density="compact"
                      label="Opciones (una por línea)"
                      :model-value="(f.options || []).join('\n')"
                      @update:model-value="val => f.options = (val || '').split('\n').filter(Boolean)"
                      rows="3"
                      auto-grow
                    />
                    <v-checkbox v-if="f.type === 'select'" v-model="f.multiple" label="Selección múltiple" color="primary" hide-details />
                  </v-col>
                </v-row>
              </td>
            </tr>
          </template>
        </tbody>
      </v-table>
    </v-card>

    <v-divider class="my-5" />

    <!-- Sección: Submit config -->
    <div class="form-section-label">Submit settings</div>
    <v-row dense>
      <v-col cols="12" md="6">
        <v-text-field v-model="form.submit.btnText" label="Texto botón enviar" prepend-inner-icon="mdi-send-outline" />
      </v-col>
      <v-col cols="12" md="6">
        <v-text-field v-model="form.submit.successMessage" label="Mensaje de éxito" prepend-inner-icon="mdi-check-circle-outline" />
      </v-col>
    </v-row>

    <v-divider class="my-5" />

    <!-- Acciones -->
    <div class="d-flex flex-wrap align-center ga-3">
      <v-btn :loading="saving" color="primary" variant="flat" prepend-icon="mdi-content-save-outline" @click="save">
        Guardar
      </v-btn>
      <v-spacer />
      <v-text-field
        v-if="form.isPublic && form.publicToken"
        :model-value="publicUrl"
        readonly
        prepend-inner-icon="mdi-link-variant"
        density="compact"
        hide-details
        style="max-width: 440px; min-width: 240px;"
      />
      <v-btn v-if="form.isPublic && form.publicToken" variant="tonal" prepend-icon="mdi-content-copy" @click="copy()">
        Copiar link
      </v-btn>
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

type UIFormField = FormField & { _editing?: boolean };

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

  const fetched = await store.fetchForm(props.formId);
  if (!fetched) return;

  Object.assign(form, {
    ...fetched,
    submit: fetched.submit ?? { btnText: 'Enviar', successMessage: '¡Gracias!' },
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
    const payload: FormSchema = {
      ...form,
      fields: form.fields.map(({ _editing, ...rest }) => rest),
    };
    const saved = await store.save(payload);

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

<style scoped>
.form-section-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-bottom: 12px;
}

.field-detail-row td {
  background-color: rgba(var(--v-theme-surface-variant), 0.5);
  border-top: 0 !important;
  padding: 16px !important;
}
</style>
