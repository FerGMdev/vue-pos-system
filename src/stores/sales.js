import { computed, ref, watch } from "vue";
import { defineStore } from "pinia";
import { listSalesByDate } from "@/api/sales.api";
import { displayDateToDateKey } from "@/utils/format";

export const useSalesStore = defineStore("sales", () => {
  const dateValue = ref("");
  const sales = ref([]);
  const loading = ref(false);
  const error = ref("");
  let requestSequence = 0;

  const dateKey = computed(() => displayDateToDateKey(dateValue.value));
  const isDateSelected = computed(() => Boolean(dateKey.value));

  async function fetchSales(key = dateKey.value) {
    if (!key) {
      sales.value = [];
      error.value = "";
      return;
    }

    const currentRequest = ++requestSequence;
    loading.value = true;
    error.value = "";

    try {
      const result = await listSalesByDate(key);
      if (currentRequest === requestSequence) {
        sales.value = Array.isArray(result) ? result : [];
      }
    } catch (fetchError) {
      if (currentRequest === requestSequence) {
        sales.value = [];
        error.value =
          fetchError?.message || "No se pudieron cargar las ventas del día.";
      }
    } finally {
      if (currentRequest === requestSequence) loading.value = false;
    }
  }

  watch(dateKey, (key) => {
    if (key) fetchSales(key);
    else {
      sales.value = [];
      error.value = "";
    }
  });

  const totalSalesByDay = computed(() =>
    sales.value.reduce((accumulator, sale) => {
      return accumulator + (Number(sale.total) || 0);
    }, 0)
  );

  const noSales = computed(
    () => isDateSelected.value && !loading.value && !error.value && sales.value.length === 0
  );

  return {
    dateValue,
    dateKey,
    sales,
    loading,
    error,
    isDateSelected,
    noSales,
    totalSalesByDay,
    fetchSales,
  };
});
