import { ref, computed } from "vue";
import { defineStore } from "pinia";
import { query, collection, where } from "firebase/firestore";
import { useFirestore, useCollection } from "vuefire";

export const useSalesStore = defineStore("sales", () => {
  const dateValue = ref("");
  const db = useFirestore();

  const salesSource = computed(() => {
    if (dateValue.value) {
      const q = query(
        collection(db, "sales"),
        where("createdAt", "==", dateValue.value)
      );
      return q;
    }
  });

  const salesCollection = useCollection(salesSource);

  const isDateSelected = computed(() => dateValue.value);

  const noSales = computed(() => !salesCollection.length && dateValue.value);

  const totalSalesByDay = computed(() => {
    return salesCollection.value.reduce((acc, sale) => {
      return acc + sale.total;
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
