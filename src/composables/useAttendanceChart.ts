import NovaInOutServices from "@/services/NovaInOutServices";
import type { ApexOptions } from "apexcharts";
import { type Ref } from "vue";

interface UseAttendanceChartReturn {
  loading: Ref<boolean>;
  chartOptions: Ref<any>;
  chartSeries: Ref<any[]>;
  fetchChartData: (startDate?: string, endDate?: string) => Promise<void>;
}

export function useAttendanceChart(): UseAttendanceChartReturn {
  const loading = ref(false);
  const error = ref(false);

  const chartSeries = ref([{ name: "Total Hours", data: [] as number[] }]);
  const chartOptions = ref<ApexOptions>({
    chart: {
      type: "line",
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: ["#00BFA5"],
    stroke: {
      curve: "straight",
      width: 2,
    },
    markers: {
      size: 5,
      colors: ["#00BFA5"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 7 },
    },
    grid: {
      show: true,
      borderColor: "#e0e0e0",
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    xaxis: {
      categories: [] as string[],
      title: {
        text: "Day",
        style: {
          color: "#000",
          fontSize: "12px",
          fontWeight: "bold",
        },
      },
      tickPlacement: "on",
    },
    yaxis: {
      min: 0,
      max: 10,
      tickAmount: 4,
      title: {
        text: "Hours",
        style: {
          color: "#000",
          fontSize: "12px",
          fontWeight: "bold",
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (val: number) {
          return val + " hrs";
        },
      },
    },
  });

  const fetchChartData = async (startDate?: string, endDate?: string) => {
    loading.value = true;

    let start = startDate;
    let end = endDate;

    if (!start || !end) {
      const today = new Date();

      const seventeenDaysAgo = new Date();
      seventeenDaysAgo.setDate(today.getDate() - 30);

      end = today.toISOString().split("T")[0];
      start = seventeenDaysAgo.toISOString().split("T")[0];
    }

    try {
      const result = await NovaInOutServices.getTotalHours(start, end);
      const daysLabels = result.map((item: any) => item.date.split("-")[2]);
      const hoursValues = result.map((item: any) => item.totalHours);

      chartSeries.value = [{ name: "Hours", data: hoursValues }];
      chartOptions.value = {
        ...chartOptions.value,
        xaxis: { ...chartOptions.value.xaxis, categories: daysLabels },
        yaxis: {
          ...chartOptions.value.yaxis,
          max: Math.ceil(Math.max(...hoursValues, 10) * 1.1),
        },
      };
    } catch (error) {
      console.log("error", error);
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
