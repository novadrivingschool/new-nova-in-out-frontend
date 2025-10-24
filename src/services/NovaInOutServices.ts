// src/services/NovaInOutServices.ts

import axios from 'axios'
import { useAuth } from '@/stores/auth/useAuth'

const API_AUTH_URL = import.meta.env.VITE_API_AUTH_URL || 'http://localhost:5013'
const API_NOVA_IN_OUT_URL = import.meta.env.VITE_API_NOVA_IN_OUT_URL || 'http://localhost:5015'

const authStore = useAuth()

/**
 * Obtiene el token de autenticación desde Pinia
 * @returns {string} Token de acceso JWT
 */
const getAuthToken = () => {
  const token = authStore.accessToken
  console.log('🔐 [getAuthToken] Token obtenido del store:', token ? '✓ Presente' : '✗ Ausente')
  return token
}

/**
 * Interceptor de Axios para agregar automáticamente el token de autorización a todas las solicitudes
 */
axios.interceptors.request.use(
  async (config) => {
    const token = getAuthToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      console.log(`🚀 [Request Interceptor] Token agregado a la solicitud: ${config.method?.toUpperCase()} ${config.url}`)
    }
    return config
  },
  (error) => {
    console.error('❌ [Request Interceptor] Error en la configuración de la solicitud:', error)
    return Promise.reject(error)
  }
)

/**
 * Interceptor de Axios para manejar respuestas y errores, especialmente errores 401 (Unauthorized)
 */
axios.interceptors.response.use(
  response => {
    console.log(`✅ [Response Interceptor] Solicitud exitosa: ${response.config.method?.toUpperCase()} ${response.config.url} - Status: ${response.status}`)
    return response
  }, 
  async (error) => {
    console.error(`❌ [Response Interceptor] Error en la respuesta: ${error.config?.method?.toUpperCase()} ${error.config?.url} - Status: ${error.response?.status}`)
    
    if (error.response && error.response.status === 401 && !error.config.__isRetryRequest) {
      console.log('🔄 [Response Interceptor] Detectado error 401 - Intentando refrescar token...')
      
      error.config.__isRetryRequest = true
      try {
        console.log('🔄 [Response Interceptor] Ejecutando refreshNow()...')
        await authStore.refreshNow()
        
        const newToken = getAuthToken()
        console.log('🔄 [Response Interceptor] Token refrescado exitosamente')
        
        error.config.headers['Authorization'] = `Bearer ${newToken}`
        console.log(`🔄 [Response Interceptor] Reintentando solicitud: ${error.config.method?.toUpperCase()} ${error.config.url}`)
        return axios(error.config)
      } catch (e) {
        console.error('❌ [Response Interceptor] Falló el refresh del token:', e)
        console.log('🚪 [Response Interceptor] Ejecutando logout...')
        await authStore.logout()
        throw e
      }
    }
    return Promise.reject(error)
  }
)

const NovaInOutServices = {
  /**
   * Obtiene la lista completa de empleados desde el servicio de autenticación
   * @returns {Promise<Array>} Array de objetos de empleados con sus perfiles
   * @throws {Error} Cuando falla la obtención de empleados
   */
  async getEmployees() {
    console.log('👥 [getEmployees] Iniciando obtención de lista de empleados...')
    try {
      console.log(`👥 [getEmployees] Realizando solicitud a: ${API_AUTH_URL}/users`)
      const response = await axios.get(`${API_AUTH_URL}/users`)
      console.log(`✅ [getEmployees] Empleados obtenidos exitosamente. Cantidad: ${response.data?.length || 0}`)
      return response.data
    } catch (error) {
      console.error('❌ [getEmployees] Error al obtener la lista de empleados:', error)
      throw new Error('Error fetching employees')
    }
  },

  /**
   * Obtiene registros por rango de fechas y número de empleado
   * @param {string} employeeNumber - Número de empleado
   * @param {string} startDate - Fecha de inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha de fin (YYYY-MM-DD)
   * @returns {Promise<Array>} Array de registros de NovaInOut
   * @throws {Error} Cuando falla la búsqueda de registros
   */
  async getRecordsByDateRange(employeeNumber: string, startDate: string, endDate: string) {
    console.log(`📊 [getRecordsByDateRange] Buscando registros para empleado: ${employeeNumber}, desde: ${startDate} hasta: ${endDate}`)
    try {
      const response = await axios.get(`${API_NOVA_IN_OUT_URL}/nova-in-out/search`, {
        params: {
          employee_number: employeeNumber,
          start_date: startDate,
          end_date: endDate
        }
      })
      console.log(`✅ [getRecordsByDateRange] Registros obtenidos exitosamente. Cantidad: ${response.data?.length || 0}`)
      return response.data
    } catch (error) {
      console.error(`❌ [getRecordsByDateRange] Error al obtener registros para empleado ${employeeNumber}:`, error)
      throw new Error('Error fetching records by date range')
    }
  },

  /**
   * Obtiene la URL pública de una imagen desde Amazon S3
   * @param {string} employeeNumber - Número de empleado para construir la ruta
   * @param {string} filename - Nombre del archivo de imagen
   * @returns {Promise<string>} URL pública temporal de la imagen
   * @throws {Error} Cuando falla la obtención de la URL pública
   */
  async getPublicUrl(employeeNumber: string, filename: string) {
    console.log(`🌐 [getPublicUrl] Solicitando URL pública para empleado: ${employeeNumber}, archivo: ${filename}`)
    try {
      const response = await axios.get(`${API_NOVA_IN_OUT_URL}/nova-in-out/s3/nova-in-out/public-url`, {
        params: { employee_number: employeeNumber, filename: filename }
      })
      console.log(`✅ [getPublicUrl] URL pública obtenida exitosamente: ${response.data.url}`)
      return response.data.url
    } catch (error) {
      console.error(`❌ [getPublicUrl] Error al obtener URL pública para empleado ${employeeNumber}:`, error)
      throw new Error('Error fetching public URL')
    }
  },

  /**
   * Obtiene la URL de la miniatura (thumbnail) de una imagen desde Amazon S3
   * @param {string} employeeNumber - Número de empleado para construir la ruta
   * @param {string} filename - Nombre del archivo de imagen
   * @returns {Promise<string>} URL pública temporal de la miniatura
   * @throws {Error} Cuando falla la obtención de la URL de la miniatura
   */
  async getThumbnailUrl(employeeNumber: string, filename: string) {
    console.log(`🖼️ [getThumbnailUrl] Solicitando URL de miniatura para empleado: ${employeeNumber}, archivo: ${filename}`)
    try {
      const response = await axios.get(`${API_NOVA_IN_OUT_URL}/nova-in-out/s3/nova-in-out/thumbnail-url`, {
        params: { employee_number: employeeNumber, filename: filename }
      })
      console.log(`✅ [getThumbnailUrl] URL de miniatura obtenida exitosamente: ${response.data.url}`)
      return response.data.url
    } catch (error) {
      console.error(`❌ [getThumbnailUrl] Error al obtener URL de miniatura para empleado ${employeeNumber}:`, error)
      throw new Error('Error fetching thumbnail URL')
    }
  }
}

console.log('🚀 [NovaInOutServices] Servicio inicializado correctamente')
console.log(`🔗 [NovaInOutServices] URL Auth: ${API_AUTH_URL}`)
console.log(`🔗 [NovaInOutServices] URL Nova In Out: ${API_NOVA_IN_OUT_URL}`)

export default NovaInOutServices