<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <!-- Reloj: Clock In (play) / Clock Out (stop) -->
    <template v-if="name === 'in' || name === 'out'">
      <circle cx="12" cy="12" r="9" />
      <path v-if="name === 'in'" d="M10 8.6v6.8l5.4-3.4z" fill="currentColor" stroke-width="1.2" />
      <rect v-else x="9" y="9" width="6" height="6" rx="1.2" fill="currentColor" stroke-width="1.2" />
    </template>

    <!-- Cloche (comida): Go to lunch (pausa) / Back to lunch (check) -->
    <template v-else>
      <path d="M3 20h18" />
      <path d="M4.5 17a7.5 7.5 0 0 1 15 0z" />
      <path d="M12 9.5V8.4" />
      <circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
      <template v-if="name === 'lunch-go'">
        <path d="M18.2 2.8v3.6M21 2.8v3.6" />
      </template>
      <path v-else d="M17.4 4.8l1.9 1.9 3.2-3.6" />
    </template>
  </svg>
</template>

<script setup lang="ts">
/** Iconos propios del Activity Report (SVG, heredan el color del texto). */
withDefaults(
  defineProps<{ name: 'in' | 'out' | 'lunch-go' | 'lunch-back'; size?: number }>(),
  { size: 24 },
)
</script>
