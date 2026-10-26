<!--
  src/components/common/StatCard.vue

  Métrica. La cifra es lo único que destaca.

  Se ha quitado la caja de icono de color: repetida tres veces en una fila
  competía con los números, que son el dato. La etiqueta va en versalitas
  pequeñas encima, y la variación abajo en gris salvo que sea negativa.
-->
<template>
  <v-card class="stat" :class="{ 'app-card--interactive': interactive }">
    <div class="stat__label">
      <span>{{ label }}</span>
      <InfoTip v-if="info" :text="info" :label="label" class="stat__info" />
    </div>

    <div v-if="loading" class="stat__skeleton" />
    <div v-else class="stat__row">
      <div class="stat__value" :style="tone ? { color: `rgb(var(--v-theme-${tone}))` } : undefined">
        {{ displayValue }}<span v-if="unit" class="stat__unit">{{ unit }}</span>
      </div>
      <v-chip v-if="badge" :color="tone" variant="tonal" size="small" label class="stat__badge">
        {{ badge }}
      </v-chip>
    </div>

    <div class="stat__foot">
      <span v-if="trend !== undefined" class="stat__trend" :class="trendClass">
        {{ trend > 0 ? '+' : '' }}{{ trend }}%
      </span>
      <span v-if="hint" class="stat__hint">{{ hint }}</span>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import InfoTip from '@/components/common/InfoTip.vue'

const props = withDefaults(
  defineProps<{
    label: string
    value: string | number | null | undefined
    unit?: string
    hint?: string
    loading?: boolean
    interactive?: boolean
    /** Explicación del KPI (tooltip "i"): qué significa y cómo se calcula. */
    info?: string
    /** Variación porcentual respecto al periodo anterior. */
    trend?: number
    /** Token de color del tema para la cifra y la insignia (p. ej. `perf-high`). */
    tone?: string
    /** Calificación en texto junto a la cifra (p. ej. "Bueno"). */
    badge?: string
  }>(),
  {
    loading: false,
    interactive: false,
  },
)

/** Un valor ausente se muestra como guion, nunca como "null" o "undefined". */
const displayValue = computed(() => {
  if (props.value === null || props.value === undefined || props.value === '') {
    return '—'
  }
  return typeof props.value === 'number'
    ? props.value.toLocaleString()
    : props.value
})

/**
 * Sólo el descenso se colorea. Un panel donde cada variación positiva se pinta
 * de verde acaba siendo un semáforo; aquí el color señala lo que requiere
 * atención.
 */
const trendClass = computed(() =>
  props.trend !== undefined && props.trend < 0 ? 'stat__trend--down' : '',
)
</script>

<style scoped>
.stat {
  padding: var(--app-space-4);
  height: 100%;
}

.stat__label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-1);
  font-size: var(--app-text-2xs);
  font-weight: 600;
  letter-spacing: var(--app-tracking-wide);
  text-transform: uppercase;
  color: rgb(var(--v-theme-on-surface-variant));
}

/* El icono no debe alterar la altura de la etiqueta. */
.stat__info {
  margin: -0.25rem -0.25rem -0.25rem 0;
}

.stat__row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--app-space-2);
  margin-top: var(--app-space-3);
}

.stat__badge {
  font-weight: 600;
}

.stat__value {
  font-size: clamp(1.5rem, 1.3rem + 0.5vw, 2rem);
  font-weight: 600;
  letter-spacing: var(--app-tracking-tighter);
  line-height: 1.1;
  font-variant-numeric: tabular-nums;
}

.stat__unit {
  font-size: 0.5em;
  font-weight: 500;
  margin-inline-start: 0.25em;
  color: rgb(var(--v-theme-on-surface-variant));
}

.stat__skeleton {
  height: 2rem;
  width: 3.5rem;
  margin-top: var(--app-space-3);
  border-radius: var(--app-radius-xs);
  background: rgba(var(--v-theme-on-surface), 0.07);
}

.stat__foot {
  display: flex;
  align-items: flex-start;
  gap: var(--app-space-2);
  margin-top: var(--app-space-2);
  font-size: var(--app-text-xs);
  color: rgb(var(--v-theme-on-surface-variant));
  min-height: 1rem;
}

.stat__trend {
  font-weight: 550;
  font-variant-numeric: tabular-nums;
}

.stat__trend--down {
  color: rgb(var(--v-theme-error));
}

.stat__hint {
  /* El texto completo es información: se parte en varias líneas, no se corta con "…". */
  min-width: 0;
  line-height: 1.35;
  white-space: normal;
  overflow-wrap: anywhere;
}
</style>
