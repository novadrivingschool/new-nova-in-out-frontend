<!--
  src/components/common/ApexChart.vue

  Wrapper mínimo de ApexCharts que sustituye a `vue3-apexcharts`.

  Motivo: `vue3-apexcharts` clona las opciones con JSON.parse(JSON.stringify())
  en cada actualización, lo que ELIMINA todas las funciones (colores por barra,
  formatters de ejes, tooltips personalizados). El primer render las conserva,
  pero al cambiar de tema (o de datos) la gráfica pierde sus colores y formatos.
  Aquí las opciones se pasan a `updateOptions` tal cual, sin clonar.

  Props compatibles con el componente anterior: type, height, width, options, series.
-->
<template>
  <div ref="el" class="apex-chart" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import ApexCharts from 'apexcharts'
import type { ApexOptions } from 'apexcharts'

const props = withDefaults(
  defineProps<{
    type?: string
    height?: string | number
    width?: string | number
    options?: ApexOptions
    series?: ApexOptions['series']
  }>(),
  { type: 'line', height: 'auto', width: '100%', options: () => ({}), series: () => [] },
)

const el = ref<HTMLElement | null>(null)
let chart: ApexCharts | null = null

/** Opciones completas; `toRaw` evita que Apex trabaje sobre proxies reactivos. */
function buildConfig(): ApexOptions {
  const options = toRaw(props.options) as ApexOptions
  return {
    ...options,
    chart: {
      ...options.chart,
      type: props.type as NonNullable<ApexOptions['chart']>['type'],
      height: props.height,
      width: props.width,
    },
    series: toRaw(props.series),
  }
}

function create(): void {
  if (!el.value) return
  chart = new ApexCharts(el.value, buildConfig())
  void chart.render()
}

function destroy(): void {
  chart?.destroy()
  chart = null
}

onMounted(create)
onBeforeUnmount(destroy)

// Un solo watcher: Vue agrupa cambios simultáneos de options y series en una sola actualización.
watch(
  () => [props.options, props.series, props.height, props.width] as const,
  () => {
    if (!chart) return
    void chart.updateOptions(buildConfig())
  },
)

// Cambiar el tipo de gráfica exige recrearla.
watch(
  () => props.type,
  () => {
    destroy()
    create()
  },
)
</script>
