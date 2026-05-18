<template>
  <v-dialog
    :model-value="show"
    :max-width="smAndDown ? '95%' : '50%'"
    @update:model-value="$emit('close')"
  >
    <v-card class="pa-3" :loading="loading ?? false">
      <v-card-title class="d-flex justify-space-between align-center pa-3 ga-2">
        <div class="d-flex align-center ga-3">
          <template v-if="props.icon">
            <v-icon :icon="props.icon" :size="xs ? 24 : 32" color="primary" />
          </template>
          <p>{{ title }}</p>
        </div>
        <v-btn
          icon="mdi-close"
          size="small"
          og
          variant="text"
          title="Close"
          @click="$emit('close')"
        />
      </v-card-title>

      <v-card-text>
        <slot name="dialog-body" />
      </v-card-text>

      <v-card-actions>
        <slot name="dialog-actions" />
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useDisplay } from "vuetify/lib/composables/display.mjs";

interface Props {
  title: string;
  show: boolean;
  icon?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {});

const { xs, smAndDown } = useDisplay();

defineEmits(["close"]);
</script>

<style scoped></style>
