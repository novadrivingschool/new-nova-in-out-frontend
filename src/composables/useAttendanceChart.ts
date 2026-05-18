import { ref, computed, type Ref } from "vue";
import { useTheme } from "vuetify";
import NovaInOutServices from "@/services/NovaInOutServices";
import type { ApexOptions } from "apexcharts";

interface UseAttendanceChartReturn {
  loading: Ref<boolean>;
  chartOptions: Ref<ApexOptions>;
  chartSeries: Ref<any[]>;
  fetchChartData: (startDate?: string, endDate?: string) => Promise<void>;
}

export function useAttendanceChart(): UseAttendanceChartReturn {
  const theme = useTheme();
  const loading = ref(false);

  // --- ESTADO DE DATOS (REFS) ---
  // Guardamos los datos crudos aquí para que el computed los use
  const categories = ref<string[]>([]);
  const maxY = ref(10);
  const chartSeries = ref([{ name: "Total Hours", data: [] as number[] }]);

  // Helper para detectar el modo oscuro
  const isDark = computed(() => theme.global.name.value === "dark");

  // --- CONFIGURACIÓN DINÁMICA (COMPUTED) ---
  const chartOptions = computed<ApexOptions>(() => {
    // Definimos colores basados en el tema
    const textColor = isDark.value ? "#eceff1" : "#455a64";
    const gridColor = isDark.value ? "rgba(255, 255, 255, 0.1)" : "#e0e0e0";
    const subTextColor = isDark.value
      ? "rgba(255, 255, 255, 0.5)"
      : "rgba(0, 0, 0, 0.4)";

    return {
      // theme: {
      //   mode: isDark.value ? "dark" : "light",
      // },
      chart: {
        type: "line",
        toolbar: { show: false },
        zoom: { enabled: false },
        // Ajusta automáticamente el fondo de menús internos de Apex
        theme: isDark.value ? "dark" : "light",
        fontFamily: "Inter, Roboto, sans-serif",
      },
      colors: ["#00BFA5"], // Tu color principal
      stroke: {
        curve: "straight",
        width: 3,
      },
      markers: {
        size: 5,
        colors: ["#00BFA5"],
        strokeColors: isDark.value ? "#1e1e1e" : "#fff",
        strokeWidth: 2,
        hover: { size: 7 },
      },
      grid: {
        show: true,
        borderColor: gridColor,
        xaxis: { lines: { show: false } },
        yaxis: { lines: { show: true } },
      },
      xaxis: {
        categories: categories.value, // <--- Lee de la ref
        labels: {
          style: { colors: subTextColor, fontSize: "11px" },
        },
        title: {
          text: "Day of Month",
          style: {
            color: textColor,
            fontSize: "12px",
            fontWeight: 600,
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tickPlacement: "on",
      },
      yaxis: {
        min: 0,
        max: maxY.value, // <--- Lee de la ref
        tickAmount: 4,
        labels: {
          style: { colors: subTextColor, fontSize: "11px" },
          formatter: (val) => val.toFixed(2),
        },
        title: {
          text: "Hours Worked",
          style: {
            color: textColor,
            fontSize: "12px",
            fontWeight: 600,
          },
        },
      },
      tooltip: {
        theme: isDark.value ? "dark" : "light",
        shared: true,
        intersect: false,
        y: {
          formatter: (val: number) => `${val.toFixed(2)} hrs`,
        },
      },
    };
  });

  // --- LÓGICA DE CARGA ---
  const fetchChartData = async (startDate?: string, endDate?: string) => {
    loading.value = true;

    let start = startDate;
    let end = endDate;

    if (!start || !end) {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      end = today.toISOString().split("T")[0];
      start = thirtyDaysAgo.toISOString().split("T")[0];
    }

    try {
      const result = await NovaInOutServices.getTotalHours(start, end);

      // Mapeamos los datos
      const daysLabels = result.map((item: any) => item.date.split("-")[2]);
      const hoursValues = result.map((item: any) => item.totalHours);

      // ACTUALIZAMOS LAS REFS (Esto hace que el computed se recalcule solo)
      categories.value = daysLabels;
      maxY.value = Math.ceil(Math.max(...hoursValues, 10) * 1.1);
      chartSeries.value = [{ name: "Total Hours", data: hoursValues }];
    } catch (err) {
      console.error("Error fetching chart data:", err);
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    chartOptions,
    chartSeries,
    fetchChartData,
  };
}
