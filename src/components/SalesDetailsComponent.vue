<script setup>
import AmountComponent from "@/components/AmountComponent.vue";
import { useSalesStore } from "@/stores/sales";
import { formatCurency } from "@/helpers";
const salesStore = useSalesStore();
console.log(salesStore.salesCollection);

defineProps({
  sale: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div
    class="mx-auto flex flex-col justify-between p-4 my-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
  >
    <ul class="space-y-4">
      <li
        v-for="item in sale.items"
        :key="item.id"
        class="flex items-center p-2"
      >
        <img
          :src="item.image"
          alt="Imagen del producto"
          class="w-16 h-16 object-cover rounded mr-4"
        />
        <div>
          <h4 class="font-medium">{{ item.name }}</h4>
          <p class="text-gray-600">
            Precio:
            <span class="text-gray-800">{{ formatCurency(item.price) }}</span>
          </p>
          <p class="text-gray-600">
            Cantidad: <span class="text-gray-800">{{ item.quantity }}</span>
          </p>
        </div>
      </li>
    </ul>
    <dl class="border-slate-300 pt-6 text-md text-slate-700">
      <AmountComponent>
        <template #label>Subtotal</template>
        {{ formatCurency(sale.subtotal) }}
      </AmountComponent>
      <AmountComponent>
        <template #label>Impuestos</template>
        {{ formatCurency(sale.taxes) }}
      </AmountComponent>
      <AmountComponent
        v-if="sale.discount"
        class="text-emerald-600 bg-emerald-100"
      >
        <template #label>Descuento</template>
        {{ formatCurency(sale.discount) }}
      </AmountComponent>
      <AmountComponent>
        <template #label>Total</template>
        {{ formatCurency(sale.total) }}
      </AmountComponent>
    </dl>
  </div>
</template>

<style lang="css" scoped>
/* Puedes agregar estilos adicionales aquí si es necesario */
</style>
