<script setup>
import { ref } from "vue";
import VueTailwindDatepicker from "vue-tailwind-datepicker";
import SalesDetails from "@/components/SalesDetails.vue";
import StateMessage from "@/components/StateMessage.vue";
import { useSalesStore } from "@/stores/sales";
import { useCurrency } from "@/composables/useCurrency";
import { formatDateKey } from "@/utils/format";

const salesStore = useSalesStore();
const currency = useCurrency();
const formatter = ref({
  date: "DD/MM/YYYY",
  month: "MMM",
});

function refresh() {
  return salesStore.fetchSales();
}
</script>

<template>
  <section aria-labelledby="sales-title">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <h1 id="sales-title" class="text-2xl font-bold text-slate-800">
        Resumen de ventas
      </h1>
      <button
        v-if="salesStore.isDateSelected"
        type="button"
        class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        :disabled="salesStore.loading"
        @click="refresh"
      >
        {{ salesStore.loading ? "Actualizando..." : "Actualizar" }}
      </button>
    </div>

    <div class="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div class="lg:w-1/3">
        <div class="rounded-lg bg-white p-5 shadow-sm">
          <p class="mb-4 text-center text-lg font-bold text-slate-600">
            Calendario de ventas
          </p>
          <div class="flex justify-center">
            <VueTailwindDatepicker
              v-model="salesStore.dateValue"
              no-input
              as-single
              i18n="es-MX"
              :formatter="formatter"
            />
          </div>
        </div>
      </div>

      <div class="min-w-0 flex-1" aria-live="polite">
        <StateMessage
          v-if="!salesStore.isDateSelected"
          variant="info"
          title="Selecciona una fecha"
          message="Elige un día en el calendario para consultar sus ventas."
        />

        <StateMessage
          v-else-if="salesStore.loading"
          variant="loading"
          title="Cargando ventas"
          message="Estamos consultando las ventas del día."
        />

        <StateMessage
          v-else-if="salesStore.error"
          variant="error"
          title="No se pudieron cargar las ventas"
          :message="salesStore.error"
          @retry="refresh"
        />

        <StateMessage
          v-else-if="salesStore.noSales"
          variant="empty"
          title="Sin ventas"
          message="No hay ventas registradas para este día."
        />

        <template v-else>
          <div class="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white p-4 shadow-sm">
            <p class="font-semibold text-slate-600">
              Ventas del
              <span class="text-green-700">{{ formatDateKey(salesStore.dateKey) }}</span>
            </p>
            <p class="text-lg font-bold text-slate-700">
              Total del día:
              <span class="text-green-700">{{ currency(salesStore.totalSalesByDay) }}</span>
            </p>
          </div>

          <SalesDetails
            v-for="sale in salesStore.sales"
            :key="sale.id"
            :sale="sale"
          />
        </template>
      </div>
    </div>
  </section>
</template>
