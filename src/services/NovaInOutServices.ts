// src/services/NovaInOutServices.ts

import axios from "axios";
import { useAuth } from "@/stores/auth/useAuth";
import { http } from "@/lib/http";
import type {
  AttendanceDashboard,
  AttendanceTrend,
} from "@/types/attendanceDashboard";
import type { ScreenshotStats } from "@/components/Screenshots/screenshotStats";
import type {
  AdminClockOutView,
  ForceClockOutReason,
} from "@/types/adminClockOut";

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

/**
 * Resumen legible de un error de axios para mostrarlo en pantalla:
 * estado HTTP (o código de red) + mensaje del backend.
 */
function describeHttpError(error: unknown): string {
  const err = error as {
    code?: string;
    message?: string;
    response?: { status?: number; data?: { message?: string | string[] } };
  };
  const status = err.response?.status ?? err.code ?? "unknown";
  const detail = err.response?.data?.message ?? err.message ?? "";
  return `${status}${detail ? ` - ${Array.isArray(detail) ? detail.join(", ") : detail}` : ""}`;
}

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
   * Estadísticas del rango (total trabajado, rendimiento, cobertura, pausas,
   * patrón por hora, anomalías). Las calcula el backend: es la misma fuente
   * que usa el PDF.
   */
  async getReportStats(
    employeeNumber: string,
    startDate: string,
    endDate: string,
  ): Promise<ScreenshotStats> {
    try {
      const response = await axios.get(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/report/stats`,
        {
          params: {
            employee_number: employeeNumber,
            start_date: startDate,
            end_date: endDate,
          },
        },
      )
      return response.data
    } catch (error) {
      console.error('❌ [getReportStats] Error obteniendo estadísticas:', error)
      throw new Error('Error fetching report stats')
    }
  },

  /**
   * Descarga el reporte PDF de un empleado y rango. Lo genera el backend
   * (GET /nova-in-out/report/pdf); aquí sólo se pide el binario y se guarda.
   */
  async downloadReportPdf(params: {
    employeeNumber: string
    employeeName: string
    startDate: string
    endDate: string
  }): Promise<void> {
    try {
      const response = await axios.get(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/report/pdf`,
        {
          params: {
            employee_number: params.employeeNumber,
            employee_name: params.employeeName,
            start_date: params.startDate,
            end_date: params.endDate,
          },
          responseType: 'blob',
        },
      )

      const url = URL.createObjectURL(
        new Blob([response.data], { type: 'application/pdf' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = `NIO-report_${params.employeeNumber}_${params.startDate}_${params.endDate}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      // Se libera tras el clic: el navegador ya tomó la referencia.
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } catch (error) {
      console.error('❌ [downloadReportPdf] Error generando el reporte:', error)
      throw new Error('Error generating the report')
    }
  },

  /**
   * Obtiene URL firmada para cualquier key de S3
   * key: ruta completa ej: {emp}/{date}/{time}.jpg
   */
  async getSignedUrl(key: string): Promise<string> {
    try {
      const response = await axios.get(
        `${API_NOVA_IN_OUT_URL}/aws-s3/signed-url`,
        { params: { key } },
      );
      return response.data.url;
    } catch (error) {
      console.error(`❌ [getSignedUrl] key: ${key}`, error);
      throw new Error("Error fetching signed URL");
    }
  },

  /**
   * DEV ONLY. Borra un registro junto con su screenshot y thumbnail en S3.
   * El backend sólo lo permite con ENABLE_SCREENSHOT_DELETE=true (si no, 404).
   */
  async deleteScreenshot(id: number): Promise<void> {
    try {
      await axios.delete(`${API_NOVA_IN_OUT_URL}/nova-in-out/screenshots/${id}`);
    } catch (error) {
      console.error(`❌ [deleteScreenshot] id: ${id}`, error);
      throw new Error(describeHttpError(error));
    }
  },

  async getTotalHours(startDate: string, endDate: string) {
    console.log(
      `Fetching total hours summary un range ${startDate} - ${endDate}`,
    );
    try {
      const response = await http.get(
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
      const response = await http.get(
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

  async getNotClockedInNow(date: string) {
    try {
      const response = await http.get(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/not-clocked-in-now`,
        {
          params: { date },
        },
      );
      console.log(`✅ [getnotClockedInNow] Data received: ${response.data}`);
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
      const response = await http.get(
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

  /**
   * Dashboard de asistencia de un día: conteos, listas y horas en una sola
   * llamada. Con `date` omitido el backend usa hoy en America/Chicago.
   */
  async getDashboard(date?: string): Promise<AttendanceDashboard> {
    try {
      const response = await http.get<AttendanceDashboard>(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/dashboard`,
        { params: date ? { date } : {} },
      );
      return response.data;
    } catch (error) {
      console.error(`❌ [getDashboard] Error getting data for ${date}`, error);
      // Se conserva el estado HTTP y el mensaje del backend para poder
      // diagnosticar desde la propia pantalla.
      throw new Error(describeHttpError(error));
    }
  },

  /**
   * Tendencia diaria de `days` días que termina en `date` (por defecto hoy).
   */
  async getDashboardTrend(
    date?: string,
    days = 14,
  ): Promise<AttendanceTrend> {
    try {
      const response = await http.get<AttendanceTrend>(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/dashboard/trend`,
        { params: { ...(date ? { date } : {}), days } },
      );
      return response.data;
    } catch (error) {
      console.error(`❌ [getDashboardTrend] Error for ${date}`, error);
      throw new Error(describeHttpError(error));
    }
  },

  async getSummary(date: string) {
    try {
      const response = await http.get(
        `${API_NOVA_IN_OUT_URL}/nova-in-out/summary`,
        {
          params: { date },
        },
      );
      console.log(`✅ [getSummary] Data received: ${response.data}`);
      console.log(response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ [getClockedInNow] Error getting data`, error);
      throw new Error("Error fetching clocked in now data");
    }
  },

  /** Admin: cierra el turno abierto de un empleado (queda en su historial de clock-outs de admin). */
  async forceClockOut(params: {
    employeeNumber: string;
    reason: ForceClockOutReason;
    note?: string;
  }): Promise<AdminClockOutView> {
    const response = await http.post<AdminClockOutView>(
      `${API_NOVA_IN_OUT_URL}/nova-in-out/admin/force-clock-out`,
      {
        employee_number: params.employeeNumber,
        reason: params.reason,
        note: params.note || undefined,
      },
    );
    return response.data;
  },

  async getAdminClockOutHistory(
    employeeNumber: string,
  ): Promise<AdminClockOutView[]> {
    const response = await http.get<AdminClockOutView[]>(
      `${API_NOVA_IN_OUT_URL}/nova-in-out/admin/force-clock-out/history`,
      { params: { employee_number: employeeNumber } },
    );
    return Array.isArray(response.data) ? response.data : [];
  },

  /** { employee_number: total } de clock-outs hechos por admin. */
  async getAdminClockOutCounts(): Promise<Record<string, number>> {
    const response = await http.get<Record<string, number>>(
      `${API_NOVA_IN_OUT_URL}/nova-in-out/admin/force-clock-out/counts`,
    );
    return response.data ?? {};
  },

  /** Admin: employee_numbers con el Activity (AR) abierto hoy. Panel en vivo. */
  async getActivityOpenNow(date: string): Promise<{ open: string[]; lunch: string[] }> {
    const response = await http.get<{ employee_numbers: string[]; lunch_employee_numbers?: string[] }>(
      `${API_NOVA_IN_OUT_URL}/nova-in-out/activity/open-now`,
      { params: { date } },
    );
    return {
      open: response.data?.employee_numbers ?? [],
      // Subconjunto de `open` con el lunch abierto (Go to lunch sin Back to lunch).
      lunch: response.data?.lunch_employee_numbers ?? [],
    };
  },
};

export default NovaInOutServices;
