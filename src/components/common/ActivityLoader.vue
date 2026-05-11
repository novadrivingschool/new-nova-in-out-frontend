<template>
  <div class="d-flex flex-column align-center">
    <v-progress-circular
      :color="color"
      :size="size"
      class="mb-4"
      indeterminate
    />
    <p>{{ label }}</p>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  color?: string;
  label?: string;
  size?: number;
}

withDefaults(defineProps<Props>(), {
  color: "primary",
  label: "Loading...",
  size: 32,
});
</script>
