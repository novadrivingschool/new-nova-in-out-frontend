/**
 * src/composables/useScreenshots.ts
 *
 * Carga de capturas de pantalla por empleado y rango de fechas.
 *
 * La estrategia es traer toda la metadata de una vez (barata) y resolver las
 * URLs firmadas de S3 sólo de la página visible (caras: una petición por
 * imagen). Así una búsqueda de 800 registros no dispara 1.600 llamadas: cada
 * página resuelve como máximo PAGE_SIZE registros.
 */
import { computed, ref } from 'vue'
import NovaInOutServices from '@/services/NovaInOutServices'
import type { ScreenshotStats } from '@/components/Screenshots/screenshotStats'
import { captureWindow } from '@/types/screenshots'
import type {
  Employee,
  RawScreenshotRecord,
  ScreenshotImage,
} from '@/types/screenshots'

/** Registros por página (también los que se resuelven contra S3 de una vez). */
export const PAGE_SIZE = 16

/**
 * DEV ONLY: habilita el borrado de registros (BD + S3) desde la rejilla.
 * Se controla con VITE_ENABLE_SCREENSHOT_DELETE=true; el backend lo exige
 * también con ENABLE_SCREENSHOT_DELETE=true, así que esta bandera sólo decide
 * si se muestra el botón.
 */
export const SCREENSHOT_DELETE_ENABLED =
  import.meta.env.VITE_ENABLE_SCREENSHOT_DELETE === 'true'

export function useScreenshots() {
  const employees = ref<Employee[]>([])
  const loadingEmployees = ref(false)

  const rawRecords = ref<RawScreenshotRecord[]>([])
  const images = ref<ScreenshotImage[]>([])

  const loading = ref(false)
  const loadingPage = ref(false)
  const page = ref(1)
  /** Descartan respuestas de búsquedas/páginas que ya no son la vigente. */
  let searchId = 0
  let pageId = 0
  const hasSearched = ref(false)
  /** Rango con el que se hizo la última búsqueda (no el que hay en los filtros). */
  const searchedRange = ref<{ start: string; end: string } | null>(null)
  const isMultiDay = computed(
    () => !!searchedRange.value && searchedRange.value.start !== searchedRange.value.end,
  )
  const error = ref<string | null>(null)

  const totalRecords = computed(() => rawRecords.value.length)
  /**
   * Estadísticas de todo el rango buscado (no sólo de la página visible). Las
   * calcula el backend; llegan después de las capturas para no retrasarlas.
   */
  const stats = ref<ScreenshotStats | null>(null)
  const loadingStats = ref(false)
  const statsError = ref(false)

  /** Pide las estadísticas del rango buscado; descarta la respuesta si ya hay otra búsqueda. */
  async function loadStats(
    employeeNumber: string,
    startDate: string,
    endDate: string,
    current = searchId,
  ): Promise<void> {
    loadingStats.value = true
    statsError.value = false
    try {
      const result = await NovaInOutServices.getReportStats(
        employeeNumber,
        startDate,
        endDate,
      )
      if (current !== searchId) return
      stats.value = result
    } catch {
      if (current !== searchId) return
      stats.value = null
      statsError.value = true
    } finally {
      if (current === searchId) loadingStats.value = false
    }
  }

  const totalPages = computed(() =>
    Math.max(1, Math.ceil(rawRecords.value.length / PAGE_SIZE)),
  )

  /** Fecha de hoy en la zona horaria de la operación (Chicago), en YYYY-MM-DD. */
  function getChicagoDate(): string {
    try {
      return new Date().toLocaleDateString('en-CA', {
        timeZone: 'America/Chicago',
      })
    } catch (err) {
      console.error('Error getting Chicago date:', err)
      return new Date().toISOString().split('T')[0]
    }
  }

  async function loadEmployees(): Promise<void> {
    loadingEmployees.value = true
    error.value = null
    try {
      const data = await NovaInOutServices.getEmployees()
      employees.value = (Array.isArray(data) ? data : []).filter(
        (employee: Employee) => employee?.profile?.employee_number,
      )
    } catch (err) {
      console.error('Error loading employees:', err)
      error.value = 'Could not load the employee list.'
      employees.value = []
    } finally {
      loadingEmployees.value = false
    }
  }

  /** Más recientes primero. */
  function sortRecords(records: RawScreenshotRecord[]): RawScreenshotRecord[] {
    return [...records].sort((a, b) => {
      const timeA = new Date(`${a.clock_date}T${a.clock_time}`).getTime()
      const timeB = new Date(`${b.clock_date}T${b.clock_time}`).getTime()
      return timeB - timeA
    })
  }

  /** Resuelve las URLs firmadas de una tanda de registros. */
  async function resolveBatch(
    records: RawScreenshotRecord[],
    employee: Employee | null,
  ): Promise<ScreenshotImage[]> {
    return Promise.all(
      records.map(async (record) => {
        const fullName = employee?.profile
          ? `${employee.profile.firstName} ${employee.profile.lastName}`
          : record.employee_number

        // Una URL que falla no debe tumbar la tanda entera: se degrada a ''
        // y la tarjeta muestra el marcador de "sin imagen".
        const [imageUrl, thumbnailUrl] = await Promise.all([
          record.image
            ? NovaInOutServices.getSignedUrl(record.image).catch(() => '')
            : Promise.resolve(''),
          record.thumbnail
            ? NovaInOutServices.getSignedUrl(record.thumbnail).catch(() => '')
            : Promise.resolve(''),
        ])

        return {
          id: record.id,
          employee_number: record.employee_number,
          fullName,
          imageUrl,
          thumbnailUrl,
          clock_date: record.clock_date,
          clock_time: record.clock_time,
          type_of_clock: record.type_of_clock ?? '',
          activity_status: record.activity_status ?? '',
          image: record.image ?? '',
          thumbnail: record.thumbnail ?? '',
          active_time: record.active_time ?? 0,
          slot_seconds: captureWindow(record.slot_seconds),
          adminClockOut: record.admin_clock_out ?? null,
          source: String(record.source ?? '').toUpperCase(),
        }
      }),
    )
  }

  function reset(): void {
    searchId += 1
    pageId += 1
    page.value = 1
    loadingPage.value = false
    rawRecords.value = []
    images.value = []
    hasSearched.value = false
    searchedRange.value = null
    stats.value = null
    loadingStats.value = false
    statsError.value = false
    error.value = null
  }

  /** Carga la página indicada (1-based) resolviendo sólo sus URLs firmadas. */
  async function goToPage(
    target: number,
    employee: Employee | null,
  ): Promise<void> {
    const next = Math.min(Math.max(1, Math.trunc(target) || 1), totalPages.value)
    const currentSearch = searchId
    const currentPage = ++pageId
    const isStale = () => currentSearch !== searchId || currentPage !== pageId

    loadingPage.value = true
    const start = (next - 1) * PAGE_SIZE
    const batch = rawRecords.value.slice(start, start + PAGE_SIZE)

    try {
      const resolved = await resolveBatch(batch, employee)
      if (isStale()) return
      images.value = resolved
      page.value = next
    } catch (err) {
      if (isStale()) return
      console.error('Error loading page:', err)
      error.value = 'Some screenshots could not be loaded.'
    } finally {
      if (!isStale()) loadingPage.value = false
    }
  }

  /**
   * DEV ONLY. Borra el registro en el backend (BD + S3) y lo saca de la lista.
   * Si falla, lanza y la lista queda intacta para que la UI muestre el error.
   * Tras borrar se vuelve a pintar la página actual (goToPage ajusta el número
   * si la última página quedó vacía); los KPIs se recalculan solos.
   */
  async function deleteRecord(
    id: number,
    employee: Employee | null,
  ): Promise<void> {
    if (!SCREENSHOT_DELETE_ENABLED) return
    await NovaInOutServices.deleteScreenshot(id)
    rawRecords.value = rawRecords.value.filter((record) => record.id !== id)
    await goToPage(page.value, employee)
    const range = searchedRange.value
    const employeeNumber = employee?.profile?.employee_number
    if (range && employeeNumber) {
      void loadStats(employeeNumber, range.start, range.end)
    }
  }

  async function search(
    employee: Employee | null,
    startDate: string,
    endDate: string,
  ): Promise<void> {
    const employeeNumber = employee?.profile?.employee_number
    if (!employeeNumber || !startDate || !endDate) return

    const current = ++searchId
    pageId += 1
    loading.value = true
    hasSearched.value = true
    searchedRange.value = { start: startDate, end: endDate }
    error.value = null
    rawRecords.value = []
    images.value = []
    page.value = 1
    stats.value = null
    // Las estadísticas se piden en paralelo; las capturas se pintan primero.
    const statsRequest = loadStats(employeeNumber, startDate, endDate, current)

    try {
      const records = await NovaInOutServices.getRecordsByDateRange(
        employeeNumber,
        startDate,
        endDate,
      )
      if (current !== searchId) return
      rawRecords.value = sortRecords(Array.isArray(records) ? records : [])
      await goToPage(1, employee)
    } catch (err) {
      if (current !== searchId) return
      console.error('Error searching records:', err)
      error.value = 'Could not load the screenshots. Please try again.'
      rawRecords.value = []
      images.value = []
    } finally {
      if (current === searchId) loading.value = false
    }
    await statsRequest
  }

  return {
    employees,
    loadingEmployees,
    images,
    totalRecords,
    stats,
    loadingStats,
    statsError,
    isMultiDay,
    searchedRange,
    page,
    totalPages,
    loading,
    loadingPage,
    hasSearched,
    error,
    getChicagoDate,
    loadEmployees,
    goToPage,
    search,
    deleteRecord,
    reset,
  }
}
