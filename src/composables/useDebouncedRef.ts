/**
 * src/composables/useDebouncedRef.ts
 *
 * Copia retardada de un ref. Se usa para no lanzar una petición por cada tecla
 * en los campos de búsqueda: el valor inmediato alimenta al input y el
 * retardado dispara la consulta.
 *
 * Uso:
 *   const search = ref('')
 *   const debouncedSearch = useDebouncedRef(search, 350)
 *   watch(debouncedSearch, fetch)
 */
import { onScopeDispose, ref, watch, type Ref } from 'vue'

export function useDebouncedRef<T>(source: Ref<T>, delay = 300): Ref<T> {
  const debounced = ref(source.value) as Ref<T>
  let timer: ReturnType<typeof setTimeout> | undefined

  const clear = (): void => {
    if (timer !== undefined) {
      clearTimeout(timer)
      timer = undefined
    }
  }

  watch(source, (value) => {
    clear()
    timer = setTimeout(() => {
      debounced.value = value
    }, delay)
  })

  // Sin esto, un temporizador pendiente escribiría en un ref ya desmontado.
  onScopeDispose(clear)

  return debounced
}
