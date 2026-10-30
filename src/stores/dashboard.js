import { ref } from "vue";
import { defineStore } from "pinia";
import { getDashboardSummary } from "@/api/dashboard.api";

export const useDashboardStore = defineStore("dashboard", () => {
  const summary = ref(null);
  const loading = ref(false);
  const error = ref("");
  let requestSequence = 0;

  async function fetchSummary() {
    const currentRequest = ++requestSequence;
    loading.value = true;
    error.value = "";

    try {
      const data = await getDashboardSummary();
      if (currentRequest === requestSequence) summary.value = data;
    } catch (fetchError) {
      if (currentRequest === requestSequence) {
        error.value =
          fetchError?.message || "No se pudo cargar el resumen del negocio.";
      }
    } finally {
      if (currentRequest === requestSequence) loading.value = false;
    }
  }

  return { summary, loading, error, fetchSummary };
});
