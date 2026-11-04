<template>
  <svg
    class="ai"
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
      <circle class="ai-ring" cx="12" cy="12" r="9" />
      <path v-if="name === 'in'" class="ai-nudge" d="M10 8.6v6.8l5.4-3.4z" fill="currentColor" stroke-width="1.2" />
      <rect v-else class="ai-pulse" x="9" y="9" width="6" height="6" rx="1.2" fill="currentColor" stroke-width="1.2" />
    </template>

    <!-- Reloj de arena: Be right back (pausa corta) / I'm back (check) -->
    <template v-else-if="name === 'brb-go' || name === 'brb-back'">
      <path d="M5 3h12M5 21h12" />
      <g class="ai-flip">
        <path d="M6.5 3v3.4a4.5 4.5 0 0 0 1.5 3.3L11 12l-3 2.3a4.5 4.5 0 0 0-1.5 3.3V21" />
        <path d="M15.5 3v3.4a4.5 4.5 0 0 1-1.5 3.3L11 12l3 2.3a4.5 4.5 0 0 1 1.5 3.3V21" />
      </g>
      <path v-if="name === 'brb-go'" class="ai-blink" d="M18.2 2.8v3.6M21 2.8v3.6" />
      <path v-else class="ai-check" pathLength="1" d="M17.4 4.8l1.9 1.9 3.2-3.6" />
    </template>

    <!-- Gota: Bio break (pausa corta) / I'm back (check) -->
    <template v-else-if="name === 'bio-go' || name === 'bio-back'">
      <g class="ai-drop">
        <path d="M11.5 3.5s5.5 5.6 5.5 9.6a5.5 5.5 0 0 1-11 0c0-4 5.5-9.6 5.5-9.6z" />
        <path d="M9 13.4a2.6 2.6 0 0 0 2.2 2.5" />
      </g>
      <path d="M5 21h13" />
      <path v-if="name === 'bio-go'" class="ai-blink" d="M18.2 2.8v3.6M21 2.8v3.6" />
      <path v-else class="ai-check" pathLength="1" d="M17.4 4.8l1.9 1.9 3.2-3.6" />
    </template>

    <!-- Tarjeta de tarea: Activity In (play) / Activity Out (check). Varias pueden estar abiertas a la vez -->
    <template v-else-if="name === 'act-in' || name === 'act-out'">
      <rect x="4" y="3.5" width="16" height="17" rx="2.6" />
      <path class="ai-line ai-line--1" d="M8 8.5h8" />
      <path class="ai-line ai-line--2" d="M8 12h8" />
      <path v-if="name === 'act-in'" class="ai-nudge" d="M9.6 14.6v4l3.4-2z" fill="currentColor" stroke-width="1.1" />
      <path v-else class="ai-check" pathLength="1" d="M8.6 16.6l2.3 2.3 4.5-4.9" />
    </template>

    <!-- Cloche (comida): Go to lunch (pausa) / Back to lunch (check) -->
    <template v-else>
      <path d="M3 20h18" />
      <g class="ai-lid">
        <path d="M4.5 17a7.5 7.5 0 0 1 15 0z" />
        <path d="M12 9.5V8.4" />
        <circle cx="12" cy="7.6" r="0.9" fill="currentColor" stroke="none" />
      </g>
      <path v-if="name === 'lunch-go'" class="ai-blink" d="M18.2 2.8v3.6M21 2.8v3.6" />
      <path v-else class="ai-check" pathLength="1" d="M17.4 4.8l1.9 1.9 3.2-3.6" />
    </template>
  </svg>
</template>

<script setup lang="ts">
/** Iconos propios del Activity Report (SVG, heredan el color del texto). Cada uno tiene un loop sutil. */
withDefaults(
  defineProps<{
    name: 'in' | 'out' | 'lunch-go' | 'lunch-back' | 'brb-go' | 'brb-back' | 'bio-go' | 'bio-back' | 'act-in' | 'act-out'
    size?: number
  }>(),
  { size: 24 },
)
</script>

<style scoped>
/* Las partes animadas giran/escalan sobre su propio centro dentro del viewBox. */
.ai-ring, .ai-nudge, .ai-pulse, .ai-lid, .ai-blink, .ai-check, .ai-flip, .ai-drop, .ai-line {
  transform-box: view-box;
  animation-timing-function: ease-in-out;
  animation-iteration-count: infinite;
}

/* Clock Out: el stop "late" y el aro respira. */
.ai-ring { animation-name: ai-breathe; animation-duration: 1.8s; }
.ai-pulse { transform-origin: 12px 12px; animation-name: ai-pulse; animation-duration: 1.8s; }
@keyframes ai-breathe { 0%, 100% { opacity: 1; } 50% { opacity: 0.55; } }
@keyframes ai-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.72); } }

/* Clock In: el play avanza. */
.ai-nudge { animation-name: ai-nudge; animation-duration: 1.4s; }
@keyframes ai-nudge { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(1.4px); } }

/* Go to lunch: la tapa de la cloche se levanta. */
.ai-lid { animation-name: ai-lid; animation-duration: 2.4s; }
@keyframes ai-lid { 0%, 55%, 100% { transform: translateY(0); } 25% { transform: translateY(-2px); } }

/* Pausa: las barras parpadean. */
.ai-blink { animation-name: ai-blink; animation-duration: 1.4s; }
@keyframes ai-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.2; } }

/* Regreso: el check se dibuja y se mantiene. */
.ai-check { stroke-dasharray: 1; animation-name: ai-check; animation-duration: 2.2s; }
@keyframes ai-check {
  0% { stroke-dashoffset: 1; opacity: 1; }
  35%, 85% { stroke-dashoffset: 0; opacity: 1; }
  100% { stroke-dashoffset: 0; opacity: 0; }
}

/* BRB: el reloj de arena se voltea (es simétrico, el salto de 180° a 0° no se nota). */
.ai-flip { transform-origin: 11px 12px; animation-name: ai-flip; animation-duration: 3.6s; }
@keyframes ai-flip { 0%, 60% { transform: rotate(0deg); } 85%, 100% { transform: rotate(180deg); } }

/* Bio break: la gota "cae" y se asienta. */
.ai-drop { animation-name: ai-drop; animation-duration: 2s; }
@keyframes ai-drop { 0%, 55%, 100% { transform: translateY(0); } 25% { transform: translateY(1.6px); } }

/* Activity: las líneas de la tarjeta se "escriben" una tras otra. */
.ai-line { animation-name: ai-line; animation-duration: 2.4s; }
.ai-line--2 { animation-delay: 0.35s; }
@keyframes ai-line { 0%, 100% { opacity: 1; } 40% { opacity: 0.2; } 70% { opacity: 1; } }

/* Tile deshabilitado: congelado. */
:global(.ar-action--disabled) .ai * { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .ai *, .ai-ring, .ai-nudge, .ai-pulse, .ai-lid, .ai-blink, .ai-check, .ai-flip, .ai-drop, .ai-line { animation: none !important; }
}
</style>
