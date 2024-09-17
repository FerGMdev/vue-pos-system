<script setup>
import { ref } from "vue";
import SalesDetailsComponent from "@/components/SalesDetailsComponent.vue";
import VueTailwindDatepicker from "vue-tailwind-datepicker";
import { useSalesStore } from "@/stores/sales";
import { getLocalizedDate, formatCurency } from "@/helpers";

const salesStore = useSalesStore();
const formatter = ref({
  date: "DD/MM/YYYY",
  month: "MMM",
});

console.log(salesStore.salesCollection);
</script>

<template>
  <h1 class="text-2xl font-bold my-4">Resumen de ventas</h1>
  <div class="md:flex md:items-start gap-5">
    <div id="calendar" class="md:w-1/3">
      <div class="flex flex-col items-center justify-center">
        <p class="text-xl text-slate-500 font-bold my-4">
          Calendario de ventas
        </p>
        <VueTailwindDatepicker
          v-model="salesStore.dateValue"
          no-input
          as-single
          i18n="es-MX"
          :formatter="formatter"
        />
      </div>
    </div>
    <div class="md:w-2/3">
      <p
        v-if="!salesStore.isDateSelected"
        class="text-xl text-center text-slate-500 font-bold my-4"
      >
        Selecciona una fecha para ver las ventas
      </p>
      <p
        v-if="salesStore.isDateSelected"
        class="text-xl text-slate-500 font-bold my-4 text-center"
      >
        Ventas del día
        <span class="text-green-600">{{
          getLocalizedDate(salesStore.dateValue)
        }}</span>
      </p>

      <div v-if="salesStore.salesCollection.length">
        <p class="text-2xl font-bold my-4 text-right">
          Total del día:
          <span class="text-green-600">{{
            formatCurency(salesStore.totalSalesByDay)
          }}</span>
        </p>
        <SalesDetailsComponent
          v-for="sale in salesStore.salesCollection"
          :key="sale.id"
          :sale="sale"
        />
      </div>
      <p
        v-else-if="salesStore.noSales"
        class="text-sm text-center text-slate-500 font-bold my-4"
      >
        No hay ventas para este día
      </p>
    </div>
  </div>
</template>
