<!--
  src/components/Users/UserScheduleDeleteDialog.vue

  Borrado de un horario base en dos pasos (aviso y confirmación).
-->
<template>
  <BaseDialog
    :title="step === 1 ? 'Delete schedule' : 'Confirm deletion'"
    :show="!!schedule"
    :width="480"
    :loading="loading"
    @close="close"
  >
    <template #dialog-body>
      <template v-if="step === 1">
        <p class="mb-2">
          Delete the {{ schedule?.type }} schedule
          <strong>{{ schedule ? describeRange(schedule) : '' }}</strong>?
        </p>
        <v-alert
          v-if="schedule && status !== 'upcoming'"
          type="warning"
          variant="tonal"
          density="compact"
          :text="
            status === 'current'
              ? 'This schedule is in effect right now.'
              : 'This schedule has already been worked.'
          "
        />
      </template>
      <template v-else>
        <v-alert
          type="error"
          variant="tonal"
          density="compact"
          class="mb-2"
          text="This cannot be undone."
        />
        <p class="mb-0">
          <strong>{{ schedule ? describeRange(schedule) : '' }}</strong>
          will be permanently removed from the schedule list. A record of the
          deletion (with the full schedule) stays in the history.
        </p>
      </template>
      <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        density="compact"
        class="mt-3"
        :text="error"
      />
    </template>
    <template #dialog-actions>
      <v-btn variant="text" :disabled="loading" @click="close">Cancel</v-btn>
      <v-btn v-if="step === 1" color="error" variant="tonal" @click="step = 2">Continue</v-btn>
      <v-btn v-else color="error" variant="flat" :loading="loading" @click="emit('confirm')">
        Yes, delete permanently
      </v-btn>
    </template>
  </BaseDialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import BaseDialog from '@/components/common/BaseDialog.vue'
import type { EmployeeSchedule } from '@/types/schedules'
import { describeRange, scheduleStatus } from '@/utils/schedule'

const props = defineProps<{
  schedule: EmployeeSchedule | null
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  /** Solo se emite desde el paso 2. */
  (e: 'confirm'): void
}>()

const step = ref<1 | 2>(1)
const status = computed(() => (props.schedule ? scheduleStatus(props.schedule) : 'upcoming'))

// Cada vez que se abre con otro horario se vuelve al primer paso.
watch(
  () => props.schedule?.id,
  () => {
    step.value = 1
  },
)

function close(): void {
  if (props.loading) return
  emit('close')
}
</script>
