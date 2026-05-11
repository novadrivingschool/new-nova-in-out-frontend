// src/services/NovaInOutServices.ts

import axios from "axios";
import { useAuth } from "@/stores/auth/useAuth";

// ✅ Las constantes se leen aquí — Vite las inyecta en build time,
//    no dependen de Pinia ni del ciclo de vida de Vue.
const API_AUTH_URL =
  import.meta.env.VITE_API_AUTH_URL || "http://localhost:5013";
const API_NOVA_IN_OUT_URL =
  import.meta.env.VITE_API_NOVA_IN_OUT_URL || "http://localhost:5017";

console.log("🚀 [NovaInOutServices] Servicio cargado");
console.log(`🔗 [NovaInOutServices] URL Auth:       ${API_AUTH_URL}`);
console.log(`🔗 [NovaInOutServices] URL Nova In Out: ${API_NOVA_IN_OUT_URL}`);

// ✅ useAuth() se llama DENTRO de cada función, nunca en el módulo raíz.
//    Llamarlo fuera de un componente/store hace que Pinia no esté activo
//    todavía y rompe la inicialización completa del módulo.

/**
 * Interceptor de Axios — agrega el Bearer token en cada request
 */
axios.interceptors.request.use(
  (config) => {
    const token = useAuth().accessToken; // ← useAuth() aquí, Pinia ya está listo
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
      console.log(`🚀 [Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error("❌ [Request] Error de configuración:", error);
    return Promise.reject(error);
  },
);

/**
 * Interceptor de Axios — maneja 401 refrescando el token y reintentando
 */
axios.interceptors.response.use(
  (response) => {
    console.log(
      `✅ [Response] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`,
    );
    return response;
  },
  async (error) => {
    console.error(
      `❌ [Response] ${error.config?.method?.toUpperCase()} ${error.config?.url} → ${error.response?.status}`,
    );

    if (error.response?.status === 401 && !error.config.__isRetryRequest) {
      error.config.__isRetryRequest = true;
      const auth = useAuth(); // ← useAuth() aquí también
      try {
        console.log("🔄 [Response] 401 detectado — refrescando token...");
        await auth.refreshNow();
        error.config.headers["Authorization"] = `Bearer ${auth.accessToken}`;
        console.log("🔄 [Response] Reintentando request...");
        return axios(error.config);
      } catch (e) {
        console.error("❌ [Response] Refresh falló — haciendo logout");
        await auth.logout();
        throw e;
      }
    }
    return Promise.reject(error);
  },
);

const NovaInOutServices = {
  /**
   * Obtiene la lista completa de empleados desde el servicio de autenticación
   * @returns {Promise<Array>} Array de objetos de empleados con sus perfiles
   * @throws {Error} Cuando falla la obtención de empleados
   */
  async getEmployees() {
    console.log(
      "👥 [getEmployees] Iniciando obtención de lista de empleados...",
    );
    try {
      console.log(
        `👥 [getEmployees] Realizando solicitud a: ${API_AUTH_URL}/users`,
      );
      const response = await axios.get(`${API_AUTH_URL}/users`);
      console.log(
        `✅ [getEmployees] Empleados obtenidos exitosamente. Cantidad: ${response.data?.length || 0}`,
      );
      return response.data;
    } catch (error) {
      console.error(
        "❌ [getEmployees] Error al obtener la lista de empleados:",
        error,
      );
      throw new Error("Error fetching employees");
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
  async getRecordsByDateRange(
    employeeNumber: string,
    startDate: string,
    endDate: string,
  ) {
    console.log(
      `📊 [getRecordsByDateRange] Buscando registros para empleado: ${employeeNumber}, desde: ${startDate} hasta: ${endDate}`,
    );
    try {
      const response = await axios.get(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/search`,
        {
          params: {
            employee_number: employeeNumber,
            start_date: startDate,
            end_date: endDate,
          },
        },
      );
      console.log(
        `✅ [getRecordsByDateRange] Registros obtenidos exitosamente. Cantidad: ${response.data?.length || 0}`,
      );
      return response.data;
    } catch (error) {
      console.error(
        `❌ [getRecordsByDateRange] Error al obtener registros para empleado ${employeeNumber}:`,
        error,
      );
      throw new Error("Error fetching records by date range");
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
    console.log(
      `🌐 [getPublicUrl] Solicitando URL pública para empleado: ${employeeNumber}, archivo: ${filename}`,
    );
    try {
      const response = await axios.get(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/s3/nova-in-out/public-url`,
        {
          params: { employee_number: employeeNumber, filename: filename },
        },
      );
      console.log(
        `✅ [getPublicUrl] URL pública obtenida exitosamente: ${response.data.url}`,
      );
      return response.data.url;
    } catch (error) {
      console.error(
        `❌ [getPublicUrl] Error al obtener URL pública para empleado ${employeeNumber}:`,
        error,
      );
      throw new Error("Error fetching public URL");
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
    console.log(
      `🖼️ [getThumbnailUrl] Solicitando URL de miniatura para empleado: ${employeeNumber}, archivo: ${filename}`,
    );
    try {
      const response = await axios.get(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/s3/nova-in-out/thumbnail-url`,
        {
          params: { employee_number: employeeNumber, filename: filename },
        },
      );
      console.log(
        `✅ [getThumbnailUrl] URL de miniatura obtenida exitosamente: ${response.data.url}`,
      );
      return response.data.url;
    } catch (error) {
      console.error(
        `❌ [getThumbnailUrl] Error al obtener URL de miniatura para empleado ${employeeNumber}:`,
        error,
      );
      throw new Error("Error fetching thumbnail URL");
    }
  },

  async getTotalHours(startDate: string, endDate: string) {
    console.log(
      `Fetching total hours summary un range ${startDate} - ${endDate}`,
    );
    try {
      const response = await axios.get(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/total-hours`,
        {
          params: { startDate, endDate },
        },
      );
      console.log(`✅ [getTotalHours] Data received: ${response.data}`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(
        `❌ [getThumbnailUrl] Error getting data in range ${startDate} - ${endDate}`,
        error,
      );
      throw new Error("Error fetching thumbnail URL");
    }
  },

  async getClockedInNow(date: string) {
    try {
      const response = await axios.get(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/clocked-in-now`,
        {
          params: { date },
        },
      );
      console.log(`✅ [getClockedInNow] Data received: ${response.data}`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(
        `❌ [getClockedInNow] Error getting data for ${date}`,
        error,
      );
      throw new Error("Error fetching clocked in now data");
    }
  },

  async getClockedInToday(date: string) {
    try {
      const response = await axios.get(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/clocked-in-today`,
        {
          params: { date },
        },
      );
      console.log(`✅ [getClockedInNow] Data received: ${response.data}`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(
        `❌ [getClockedInNow] Error getting data for ${date}`,
        error,
      );
      throw new Error("Error fetching clocked in now data");
    }
  },
};

export default NovaInOutServices;
