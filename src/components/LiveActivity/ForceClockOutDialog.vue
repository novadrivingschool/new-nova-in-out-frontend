<!--
  Admin: cierra el turno de un empleado que no pudo hacer clock out
  (sin luz, sin internet, etc.). Queda registrado como clock out de admin.
-->
<template>
  <BaseDialog :show="modelValue" title="Force clock out" :loading="busy" persistent @close="close">
    <template #dialog-body>
      <div class="fco">
      <p class="fco__intro">
        Clock out <strong>{{ employeeName }}</strong> now. It will be recorded as a clock out made by
        an administrator, and anything their app has pending will not be uploaded.
      </p>

      <v-select
        v-model="reason"
        :items="reasonItems"
        item-title="title"
        item-value="value"
        label="Reason"
        variant="outlined"
        density="comfortable"
        :error-messages="reasonError"
        :disabled="busy"
        hide-details="auto"
      />

      <v-textarea
        v-model="note"
        label="Note (optional)"
        variant="outlined"
        density="comfortable"
        rows="2"
        auto-grow
        counter="300"
        maxlength="300"
        :disabled="busy"
        hide-details="auto"
      />

      <p v-if="error" class="text-error text-body-2 ma-0" role="alert">{{ error }}</p>
      </div>
    </template>

    <template #dialog-actions>
      <v-spacer />
      <v-btn variant="text" :disabled="busy" @click="close">Cancel</v-btn>
      <v-btn color="warning" variant="flat" :loading="busy" @click="submit">Clock out</v-btn>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import NovaInOutServices from '@/services/NovaInOutServices'
import {
  FORCE_CLOCK_OUT_REASON_LABEL,
  type AdminClockOutView,
  type ForceClockOutReason,
} from '@/types/adminClockOut'

const props = defineProps<{
  modelValue: boolean
  employeeName: string
  employeeNumber: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'done', result: AdminClockOutView): void
}>()

const reasonItems = (Object.keys(FORCE_CLOCK_OUT_REASON_LABEL) as ForceClockOutReason[]).map(
  (value) => ({ value, title: FORCE_CLOCK_OUT_REASON_LABEL[value] }),
)

const reason = ref<ForceClockOutReason | null>(null)
const note = ref('')
const busy = ref(false)
const error = ref('')
const reasonError = ref('')

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      reason.value = null
      note.value = ''
      error.value = ''
      reasonError.value = ''
    }
  },
)

function close(): void {
  if (!busy.value) emit('update:modelValue', false)
}

async function submit(): Promise<void> {
  reasonError.value = ''
  error.value = ''
  if (!reason.value) {
    reasonError.value = 'Select a reason'
    return
  }
  busy.value = true
  try {
    const result = await NovaInOutServices.forceClockOut({
      employeeNumber: props.employeeNumber,
      reason: reason.value,
      note: note.value.trim(),
    })
    emit('done', result)
    emit('update:modelValue', false)
  } catch (e: any) {
    const status = e?.response?.status
    error.value =
      status === 409
        ? 'This employee no longer has an open clock in.'
        : (e?.response?.data?.message ?? 'Could not clock out. Try again.')
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
/* Columna con separación fija: sin esto los campos quedan pegados */
.fco {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-4, 16px);
}

.fco__intro {
  margin: 0;
}
</style>
