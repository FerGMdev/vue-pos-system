import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { query, collection, where } from "firebase/firestore";
import { useFirestore, useCollection } from "vuefire";

export const useSalesStore = defineStore("sales", () => {
  const dateValue = ref("");
  const db = useFirestore();

  const salesSource = computed(() => {
    if (!dateValue.value) return null;
    return query(
      collection(db, "sales"),
      where("createdAt", "==", dateValue.value)
    );
  });

  const salesCollection = useCollection(salesSource);

  const isDateSelected = computed(() => !!dateValue.value);

  const noSales = computed(
    () => isDateSelected.value && salesCollection.value?.length === 0
  );

  const totalSalesByDay = computed(() => {
    if (!salesCollection.value) return 0;
    return salesCollection.value.reduce((acc, sale) => {
      return acc + Number(sale.total || 0);
    }, 0);
  });

  return {
    dateValue,
    isDateSelected,
    salesCollection,
    noSales,
    totalSalesByDay,
  };
});
