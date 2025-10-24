<template>
  <v-container>
    <!-- Loader overlay -->
    <v-overlay :value="loading" opacity="0.8">
      <v-progress-circular indeterminate color="primary" size="64" />
    </v-overlay>

    <!-- Loader para cuando se hace click en una imagen -->
    <v-overlay :value="imageLoading" opacity="0.9" class="image-click-loader">
      <div class="text-center">
        <v-progress-circular indeterminate color="primary" size="64" class="mb-4" />
        <div class="text-h6 text-white">Loading Image...</div>
        <div class="text-body-2 text-white mt-2">Please wait while we prepare the screenshot</div>
      </div>
    </v-overlay>

    <!-- Barra de navegación con icono y título -->
    <v-row justify="space-between" align="center" class="mb-4">
      <v-col class="d-flex align-center">
        <v-icon size="32" class="mr-2">mdi-camera</v-icon>
        <span class="title">Screenshots</span>
      </v-col>
    </v-row>

    <!-- Filtros: Combo box para seleccionar empleado y fechas -->
    <v-row class="mb-6">
      <v-col cols="12" md="4">
        <v-combobox
          v-model="selectedEmployee"
          :items="employeeList"
          :item-title="getEmployeeTitle"
          label="Select Employee"
          outlined
          dense
          :loading="loading"
          clearable
          return-object
        />
      </v-col>
      <v-col cols="12" md="3">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-text-field
              v-bind="props"
              :model-value="formatDisplayDate(startDate)"
              label="Start Date"
              readonly
              outlined
              dense
              prepend-inner-icon="mdi-calendar"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="startDate"
            :max="endDate || today"
            @update:model-value="onStartDateChange"
          ></v-date-picker>
        </v-menu>
      </v-col>
      <v-col cols="12" md="3">
        <v-menu>
          <template v-slot:activator="{ props }">
            <v-text-field
              v-bind="props"
              :model-value="formatDisplayDate(endDate)"
              label="End Date"
              readonly
              outlined
              dense
              prepend-inner-icon="mdi-calendar"
            ></v-text-field>
          </template>
          <v-date-picker
            v-model="endDate"
            :min="startDate"
            :max="today"
            @update:model-value="onEndDateChange"
          ></v-date-picker>
        </v-menu>
      </v-col>
      <v-col cols="12" md="2" class="d-flex align-center">
        <v-btn 
          color="primary" 
          :disabled="!canSearch" 
          @click="searchRecords"
          block
          :loading="loading"
        >
          <v-icon left>mdi-magnify</v-icon>
          Search
        </v-btn>
      </v-col>
    </v-row>

    <!-- Debug info -->
    <v-row v-if="debugMode">
      <v-col cols="12">
        <v-alert type="info" class="mb-4">
          <strong>Debug Info:</strong><br>
          Start Date: {{ startDate }} ({{ typeof startDate }})<br>
          End Date: {{ endDate }} ({{ typeof endDate }})<br>
          Today: {{ today }}<br>
          Selected Employee: {{ selectedEmployeeNumber }}
        </v-alert>
      </v-col>
    </v-row>

    <!-- Mostrar las imágenes asociadas al empleado seleccionado -->
    <v-row v-if="filteredImages.length > 0">
      <v-col cols="12">
        <v-alert type="info" class="mb-4">
          <strong>{{ filteredImages.length }} records found</strong> for 
          {{ selectedEmployee?.profile?.firstName }} {{ selectedEmployee?.profile?.lastName }}
          from {{ formatDisplayDate(startDate) }} to {{ formatDisplayDate(endDate) }}
        </v-alert>
      </v-col>
      <v-col 
        v-for="(image, index) in filteredImages" 
        :key="image.id" 
        cols="12" sm="6" md="4" lg="3" xl="2"
      >
        <v-card class="screenshot-card" @click="showImage(image)">
          <v-img 
            :src="image.thumbnailUrl" 
            alt="Screenshot Thumbnail" 
            aspect-ratio="1"
            class="screenshot-image"
            height="120"
          >
            <template v-slot:placeholder>
              <v-row class="fill-height ma-0" align="center" justify="center">
                <v-progress-circular indeterminate color="primary" size="24"></v-progress-circular>
              </v-row>
            </template>
          </v-img>
          <v-card-text class="text-center pa-2">
            <div class="text-caption font-weight-bold text-truncate">
              {{ getImageFileName(image.image) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ formatDisplayDate(image.clock_date) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ image.clock_time }}
            </div>
            
            <!-- Chip type_of_clock solo si tiene valor -->
            <v-chip 
              v-if="image.type_of_clock"
              x-small 
              :color="getChipColor(image.type_of_clock)" 
              class="mt-1 mb-1"
            >
              {{ formatClockType(image.type_of_clock) }}
            </v-chip>

            <!-- ✅ AJUSTE: Barra de progreso solo cuando NO es clock_in ni clock_out -->
            <div 
              v-if="shouldShowProgressBar(image.type_of_clock, image.active_time)" 
              class="mt-2"
            >
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption">Active Time:</span>
                <span class="text-caption font-weight-bold">{{ calculatePercentage(image.active_time) }}%</span>
              </div>
              <v-progress-linear
                :model-value="calculatePercentage(image.active_time)"
                :color="getProgressColor(calculatePercentage(image.active_time))"
                height="8"
                rounded
                class="mb-1"
              ></v-progress-linear>
              <div class="text-caption text-medium-emphasis">
                {{ image.active_time }}s / 300s
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Mensaje cuando no hay resultados -->
    <v-row v-else-if="hasSearched && selectedEmployeeNumber">
      <v-col cols="12">
        <v-alert type="warning" class="text-center">
          <v-icon large class="mb-2">mdi-magnify-close</v-icon>
          <div>No records found for the selected employee and date range.</div>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Instrucciones cuando no se ha buscado -->
    <v-row v-else-if="!hasSearched">
      <v-col cols="12">
        <v-alert type="info" class="text-center">
          <v-icon large class="mb-2">mdi-information</v-icon>
          <div>Select an employee and date range, then click Search to view screenshots.</div>
        </v-alert>
      </v-col>
    </v-row>

    <!-- Ver imagen a tamaño completo -->
    <v-dialog v-model="dialog" max-width="95vw" max-height="95vh" scrollable>
      <v-card class="image-dialog">
        <v-card-title class="d-flex justify-space-between align-center pa-4">
          <span class="text-h5">Screenshot Details</span>
          <v-btn 
            icon 
            @click="openInNewTab"
            color="primary"
            size="large"
            title="Open in new tab"
          >
            <v-icon>mdi-open-in-new</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        
        <div class="image-container">
          <v-img 
            :src="fullImageUrl" 
            alt="Screenshot" 
            max-height="85vh"
            max-width="95vw"
            contain
            class="dialog-image"
          />
        </div>
        <v-card-text class="text-center pa-3">
          <div class="text-h6 mb-1">{{ selectedEmployee?.profile?.firstName }} {{ selectedEmployee?.profile?.lastName }}</div>
          <div class="text-body-2 mb-1">
            {{ formatDisplayDate(selectedImageData?.clock_date || '') }} {{ selectedImageData?.clock_time || '' }}
          </div>
          <div class="text-caption text-medium-emphasis mb-2">
            {{ getImageFileName(selectedImageData?.image || '') }}
          </div>
          
          <!-- Chips en el dialog -->
          <v-chip 
            v-if="selectedImageData?.type_of_clock"
            class="mr-1" 
            :color="getChipColor(selectedImageData.type_of_clock)" 
            small
          >
            {{ formatClockType(selectedImageData.type_of_clock) }}
          </v-chip>
          <v-chip :color="getStatusColor(selectedImageData?.activity_status || '')" small>
            {{ selectedImageData?.activity_status || '' }}
          </v-chip>

          <!-- ✅ AJUSTE: Barra de progreso en el dialog solo cuando NO es clock_in ni clock_out -->
          <div 
            v-if="shouldShowProgressBar(selectedImageData?.type_of_clock, selectedImageData?.active_time)" 
            class="mt-4"
          >
            <div class="d-flex justify-space-between align-center mb-1">
              <span class="text-body-1">Active Time:</span>
              <span class="text-body-1 font-weight-bold">{{ calculatePercentage(selectedImageData.active_time) }}%</span>
            </div>
            <v-progress-linear
              :model-value="calculatePercentage(selectedImageData.active_time)"
              :color="getProgressColor(calculatePercentage(selectedImageData.active_time))"
              height="12"
              rounded
              class="mb-1"
            ></v-progress-linear>
            <div class="text-body-2 text-medium-emphasis">
              {{ selectedImageData.active_time }} seconds / 300 seconds
            </div>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import NovaInOutServices from '@/services/NovaInOutServices'

// Definir interfaces para los tipos
interface EmployeeProfile {
  firstName: string
  lastName: string
  employee_number: string
}

interface Employee {
  profile: EmployeeProfile
}

interface ScreenshotImage {
  id: number
  employee_number: string
  fullName: string
  imageUrl: string
  thumbnailUrl: string
  clock_date: string
  clock_time: string
  type_of_clock: string
  activity_status: string
  image: string
  thumbnail: string
  active_time: number // ✅ AGREGADO: tiempo activo en segundos
}

const employees = ref<Employee[]>([])
const selectedEmployee = ref<Employee | null>(null)
const selectedEmployeeNumber = ref<string>('')
const filteredImages = ref<ScreenshotImage[]>([])
const employeeList = ref<Employee[]>([])
const loading = ref(false)
const dialog = ref(false)
const fullImageUrl = ref('')
const startDate = ref<string>('')
const endDate = ref<string>('')
const hasSearched = ref(false)
const selectedImageData = ref<ScreenshotImage | null>(null)
const debugMode = ref(false)
const imageLoading = ref(false)

// ✅ FUNCIÓN PARA DETERMINAR SI MOSTRAR LA BARRA DE PROGRESO
const shouldShowProgressBar = (clockType: string, activeTime: number): boolean => {
  // No mostrar si es clock_in o clock_out
  if (clockType && (clockType.toLowerCase() === 'clock_in' || clockType.toLowerCase() === 'clock_out')) {
    return false
  }
  // Mostrar solo si hay active_time
  return activeTime !== null && activeTime !== undefined && activeTime > 0
}

// ✅ FUNCIÓN PARA FORMATEAR TYPE_OF_CLOCK
const formatClockType = (type: string): string => {
  if (!type) return ''
  return type.replace('_', ' ').toUpperCase()
}

// ✅ FUNCIÓN PARA CALCULAR PORCENTAJE
const calculatePercentage = (activeTime: number): number => {
  if (!activeTime || activeTime <= 0) return 0
  const percentage = (activeTime / 300) * 100
  return Math.min(Math.round(percentage), 100) // Máximo 100%
}

// ✅ FUNCIÓN PARA OBTENER COLOR DE LA BARRA DE PROGRESO
const getProgressColor = (percentage: number): string => {
  if (percentage < 30) return 'red'
  if (percentage < 60) return 'yellow'
  return 'green'
}

// ✅ CORREGIDO: Función para obtener fecha actual en Chicago
const getChicagoDate = (): string => {
  try {
    const now = new Date()
    return now.toLocaleDateString('en-CA', {
      timeZone: 'America/Chicago'
    })
  } catch (error) {
    console.error('❌ [getChicagoDate] Error getting Chicago date:', error)
    return '2025-10-23'
  }
}

// ✅ NUEVA: Convertir Date object a string YYYY-MM-DD
const dateToString = (date: any): string => {
  if (!date) return ''
  
  try {
    if (typeof date === 'string') {
      // Si ya es string, verificar formato
      if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return date
      }
      // Si es otro formato, convertirlo
      const d = new Date(date)
      return d.toISOString().split('T')[0]
    }
    
    if (date instanceof Date) {
      return date.toISOString().split('T')[0]
    }
    
    console.warn('⚠️ [dateToString] Unknown date format:', date)
    return ''
  } catch (error) {
    console.error('❌ [dateToString] Error converting date:', error)
    return ''
  }
}

// ✅ CORREGIDA: Función para formatear fecha para display
const formatDisplayDate = (dateInput: any): string => {
  try {
    if (!dateInput) return ''
    
    let dateString: string
    
    // Convertir cualquier formato a string YYYY-MM-DD
    if (typeof dateInput === 'string') {
      dateString = dateInput
    } else if (dateInput instanceof Date) {
      dateString = dateInput.toISOString().split('T')[0]
    } else {
      console.warn('⚠️ [formatDisplayDate] Unknown date input type:', typeof dateInput, dateInput)
      return String(dateInput)
    }
    
    // Ahora formatear el string
    const dateWithTime = dateString.includes('T') ? dateString : `${dateString}T00:00:00`
    const formatted = new Date(dateWithTime).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'UTC'
    })
    return formatted
  } catch (error) {
    console.error('❌ [formatDisplayDate] Error formatting date:', error)
    return String(dateInput)
  }
}

// Función para extraer el nombre del archivo de la ruta de la imagen
const getImageFileName = (imagePath: string): string => {
  if (!imagePath) return 'No filename available'
  const fileName = imagePath.split('/').pop() || imagePath
  return fileName
}

// Función para abrir imagen en nueva pestaña
const openInNewTab = () => {
  if (fullImageUrl.value) {
    console.log('🔄 [openInNewTab] Opening image in new tab:', fullImageUrl.value)
    window.open(fullImageUrl.value, '_blank', 'noopener,noreferrer')
  } else {
    console.warn('⚠️ [openInNewTab] No image URL available to open')
  }
}

// ✅ CORREGIDO: Fecha actual en Chicago
const today = computed(() => {
  return getChicagoDate()
})

// Computed para habilitar/deshabilitar búsqueda
const canSearch = computed(() => {
  return selectedEmployeeNumber.value && startDate.value && endDate.value
})

// Función para obtener el color del chip según el tipo de clock
const getChipColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'clock_in': return 'success'
    case 'clock_out': return 'error'
    default: return 'primary'
  }
}

// Función para obtener el color del chip según el estado de actividad
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'success'
    case 'inactive': return 'warning'
    default: return 'grey'
  }
}

// Función para obtener el título del empleado
const getEmployeeTitle = (emp: Employee): string => {
  if (emp?.profile) {
    return `${emp.profile.firstName} ${emp.profile.lastName} (${emp.profile.employee_number})`
  }
  return ''
}

// ✅ CORREGIDOS: Handlers para cambios de fecha
const onStartDateChange = (newDate: any) => {
  console.log('📅 [onStartDateChange] New start date (raw):', newDate)
  startDate.value = dateToString(newDate)
  console.log('📅 [onStartDateChange] New start date (formatted):', startDate.value)
  
  // Si startDate es mayor que endDate, ajustar endDate
  if (endDate.value && startDate.value > endDate.value) {
    endDate.value = startDate.value
    console.log('📅 [onStartDateChange] Adjusted endDate to:', endDate.value)
  }
}

const onEndDateChange = (newDate: any) => {
  console.log('📅 [onEndDateChange] New end date (raw):', newDate)
  endDate.value = dateToString(newDate)
  console.log('📅 [onEndDateChange] New end date (formatted):', endDate.value)
  
  // Si endDate es menor que startDate, ajustar startDate
  if (startDate.value && endDate.value < startDate.value) {
    startDate.value = endDate.value
    console.log('📅 [onEndDateChange] Adjusted startDate to:', startDate.value)
  }
}

onMounted(async () => {
  console.log('🚀 [onMounted] Starting to load employees')
  loading.value = true
  try {
    const employeesData = await NovaInOutServices.getEmployees()
    console.log('✅ [onMounted] Employees data loaded successfully, count:', employeesData?.length)
    
    employees.value = employeesData
    employeeList.value = employeesData.filter((emp: Employee) => emp?.profile?.employee_number)
    console.log('👥 [onMounted] Filtered employeeList count:', employeeList.value.length)
    
    // ✅ CORREGIDO: Usar fecha de Chicago
    const currentDate = getChicagoDate()
    endDate.value = currentDate
    startDate.value = currentDate
    
    console.log('✅ [onMounted] Default dates set to:', {
      startDate: startDate.value,
      endDate: endDate.value
    })
    
  } catch (error) {
    console.error('❌ [onMounted] Error loading employees:', error)
  } finally {
    loading.value = false
  }
})

// Watcher para selectedEmployee
watch(selectedEmployee, (newVal: Employee | null) => {
  console.log('👤 [Watcher selectedEmployee] Changed to:', newVal)
  selectedEmployeeNumber.value = newVal?.profile?.employee_number || ''
  
  if (selectedEmployeeNumber.value) {
    filteredImages.value = []
    hasSearched.value = false
  } else {
    filteredImages.value = []
    hasSearched.value = false
  }
})

// ✅ FUNCIÓN PARA ORDENAR IMÁGENES (más reciente primero)
const sortImagesByDate = (images: ScreenshotImage[]): ScreenshotImage[] => {
  return images.sort((a, b) => {
    // Combinar fecha y hora para crear timestamp
    const dateTimeA = new Date(`${a.clock_date}T${a.clock_time}`).getTime()
    const dateTimeB = new Date(`${b.clock_date}T${b.clock_time}`).getTime()
    
    // Orden descendente (más reciente primero)
    return dateTimeB - dateTimeA
  })
}

// Función para buscar registros
async function searchRecords() {
  console.log('🔍 [searchRecords] Starting search with params:', {
    employee: selectedEmployeeNumber.value,
    startDate: startDate.value,
    endDate: endDate.value
  })
  
  if (!canSearch.value) {
    console.log('⚠️ [searchRecords] Cannot search - missing required fields')
    return
  }
  
  loading.value = true
  hasSearched.value = true
  
  try {
    const records = await NovaInOutServices.getRecordsByDateRange(
      selectedEmployeeNumber.value,
      startDate.value,
      endDate.value
    )
    
    console.log('✅ [searchRecords] Records found:', records?.length)
    
    const processedImages = await processRecordsWithImages(records)
    
    // ✅ ORDENAR LAS IMÁGENES (más reciente primero)
    filteredImages.value = sortImagesByDate(processedImages)
    
    console.log('✅ [searchRecords] Processed and sorted images count:', filteredImages.value.length)
    
  } catch (error) {
    console.error('❌ [searchRecords] Error searching records:', error)
    filteredImages.value = []
  } finally {
    loading.value = false
  }
}

// Función para procesar registros y obtener URLs de imágenes
async function processRecordsWithImages(records: any[]): Promise<ScreenshotImage[]> {
  console.log('🖼️ [processRecordsWithImages] Processing', records.length, 'records')
  
  const processedImages: ScreenshotImage[] = []
  
  for (const record of records) {
    try {
      if (record.image) {
        const filename = record.image.split('/').pop() || 'image.png'
        
        const [imageUrl, thumbnailUrl] = await Promise.all([
          NovaInOutServices.getPublicUrl(record.employee_number, filename),
          NovaInOutServices.getThumbnailUrl(record.employee_number, filename)
        ])
        
        processedImages.push({
          id: record.id,
          employee_number: record.employee_number,
          fullName: selectedEmployee.value?.profile ? 
            `${selectedEmployee.value.profile.firstName} ${selectedEmployee.value.profile.lastName}` : 
            record.employee_number,
          imageUrl: imageUrl,
          thumbnailUrl: thumbnailUrl,
          clock_date: record.clock_date,
          clock_time: record.clock_time,
          type_of_clock: record.type_of_clock,
          activity_status: record.activity_status,
          image: record.image,
          thumbnail: record.thumbnail,
          active_time: record.active_time || 0 // ✅ AGREGADO: tiempo activo
        })
      }
    } catch (error) {
      console.error(`❌ [processRecordsWithImages] Error processing record ${record.id}:`, error)
    }
  }
  
  return processedImages
}

async function showImage(image: ScreenshotImage) {
  console.log('🖼️ [showImage] Showing image:', image)
  
  // Mostrar loader inmediatamente
  imageLoading.value = true
  
  try {
    // Pre-cargar la imagen antes de abrir el dialog
    await preloadImage(image.imageUrl)
    
    // Una vez cargada la imagen, actualizar las variables y abrir el dialog
    fullImageUrl.value = image.imageUrl
    selectedImageData.value = image
    
    console.log('✅ [showImage] Image pre-loaded successfully, opening dialog')
    dialog.value = true
    
  } catch (error) {
    console.error('❌ [showImage] Error pre-loading image:', error)
  } finally {
    // Ocultar el loader
    imageLoading.value = false
  }
}

// Función para pre-cargar la imagen
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      console.log('✅ [preloadImage] Image loaded successfully')
      resolve()
    }
    img.onerror = () => {
      console.error('❌ [preloadImage] Error loading image')
      reject(new Error('Failed to load image'))
    }
    img.src = url
  })
}

// Watcher para cerrar dialog
watch(dialog, (newVal) => {
  if (!newVal) {
    // Resetear estado cuando se cierra el dialog
    imageLoading.value = false
  }
})
</script>

<style scoped>
/* Estilos mejorados */
.title {
  font-size: 24px;
  font-weight: bold;
}

.v-combobox .v-input__control {
  background-color: #f5f5f5;
}

.screenshot-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
  overflow: hidden;
  height: 100%;
}

.screenshot-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.screenshot-image {
  border-radius: 6px 6px 0 0;
}

.v-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
}

.image-click-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.image-dialog {
  border-radius: 12px;
  position: relative;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background-color: #f5f5f5;
  min-height: 400px;
}

.dialog-image {
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);  
}

.text-truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mejoras para la barra de progreso */
.v-progress-linear {
  border-radius: 4px;
}
</style>