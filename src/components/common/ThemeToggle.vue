<!--
  src/components/common/ThemeToggle.vue

  Botón de alternancia claro/oscuro. Se usa tanto en el shell autenticado como
  en la pantalla de login, para que el tema pueda cambiarse antes de entrar.
-->
<template>
  <v-tooltip :text="label" location="bottom">
    <template #activator="{ props: tipProps }">
      <v-btn
        v-bind="tipProps"
        :icon="icon"
        :aria-label="label"
        :aria-pressed="isDark"
        variant="text"
        :density="density"
        @click="toggle"
      />
    </template>
  </v-tooltip>
</template>

<script setup lang="ts">
import { useAppTheme } from '@/composables/useAppTheme'

withDefaults(
  defineProps<{
    density?: 'default' | 'comfortable' | 'compact'
  }>(),
  {
    density: 'comfortable',
  },
)

const { icon, label, isDark, toggle } = useAppTheme()
</script>
