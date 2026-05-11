// import { defineStore } from "pinia";
// import NovaInOutServices from "@/services/NovaInOutServices";
// import { getTodayString } from "@/utils/getTodayString";

// export const useAttendanceStore = defineStore("attendance", {
//   state: () => ({
//     clockedInNowCount: 0,
//     clockedInTodayCount: 0,
//     notClockedInCount: 0,
//     loading: false,
//     pollingInterval: null as any,
//   }),

//   actions: {
//     async fetchDashboardStats() {
//       this.loading = true;
//       try {
//         const date = getTodayString();
//         // Llamamos a los endpoints de conteo (deberían ser .getCount() en el back)
//         const [now, today] = await Promise.all([
//           NovaInOutServices.getClockedInNowCount(date),
//           NovaInOutServices.getClockedInTodayCount(date),
//         ]);

//         this.clockedInNowCount = now;
//         this.clockedInTodayCount = today;

//         // El "Not Clocked In" suele ser (Total de empleados - En este momento)
//         // Necesitarías un endpoint que te dé el total de empleados activos
//         const totalEmployees = 100; // Ejemplo
//         this.notClockedInCount = totalEmployees - now;
//       } catch (error) {
//         console.error("Error fetching stats", error);
//       } finally {
//         this.loading = false;
//       }
//     },

//     startPolling() {
//       if (this.pollingInterval) return; // Evita duplicados
//       this.fetchDashboardStats(); // Carga inicial
//       this.pollingInterval = setInterval(() => {
//         this.fetchDashboardStats();
//       }, 30000); // 30 segundos
//     },

//     stopPolling() {
//       clearInterval(this.pollingInterval);
//       this.pollingInterval = null;
//     },
//   },
// });
