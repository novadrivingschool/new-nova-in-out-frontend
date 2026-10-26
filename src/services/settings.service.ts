import { http } from "@/lib/http";

export interface CaptureIntervalSetting {
  /** Segundos entre registros de actividad / capturas. */
  seconds: number;
  /** ISO, o null si nunca se ha configurado (rige el valor por defecto). */
  updatedAt: string | null;
}

export const settingsService = {
  async getCaptureInterval(): Promise<CaptureIntervalSetting> {
    const { data } = await http.get<CaptureIntervalSetting>("/settings/capture-interval");
    return data;
  },

  async updateCaptureInterval(seconds: number): Promise<CaptureIntervalSetting> {
    try {
      const { data } = await http.put<CaptureIntervalSetting>("/settings/capture-interval", {
        seconds,
      });
      return data;
    } catch (error: any) {
      throw error.response?.data || error;
    }
  },
};
