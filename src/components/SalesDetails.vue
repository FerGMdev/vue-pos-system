<script setup>
import AmountRow from "./AmountRow.vue";
import ProductImage from "./ProductImage.vue";
import { useCurrency } from "@/composables/useCurrency";
import { formatDateTime } from "@/utils/format";

defineProps({
  sale: { type: Object, required: true },
});

const currency = useCurrency();
</script>

<template>
  <article class="my-4 rounded-lg bg-white p-4 shadow-md">
    <header class="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
      <h3 class="font-semibold text-slate-700">
        Venta {{ sale.id?.slice(0, 8) }}
      </h3>
      <p class="text-sm text-slate-500">
        {{ formatDateTime(sale.createdAt) }}
      </p>
    </header>

    <ul class="space-y-3">
      <li
        v-for="item in sale.items"
        :key="item.id"
        class="flex items-center gap-4"
      >
        <ProductImage
          :src="item.image"
          :alt="`Imagen de ${item.name}`"
          img-class="h-14 w-14 rounded object-cover"
        />
        <div class="min-w-0 flex-1">
          <h4 class="truncate font-medium text-slate-800">{{ item.name }}</h4>
          <p class="text-sm text-slate-500">
            {{ currency(item.price) }} × {{ item.quantity }}
          </p>
        </div>
        <span class="text-sm font-semibold text-slate-700">
          {{ currency(Number(item.price) * Number(item.quantity)) }}
        </span>
      </li>
    </ul>

    <dl class="mt-4 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-700">
      <AmountRow label="Subtotal">
        {{ currency(sale.subtotal) }}
      </AmountRow>
      <AmountRow v-if="sale.discount > 0" label="Descuento">
        <span class="text-green-700">-{{ currency(sale.discount) }}</span>
      </AmountRow>
      <AmountRow label="Impuestos">
        {{ currency(sale.taxes) }}
      </AmountRow>
      <AmountRow label="Total">
        <span class="text-lg">{{ currency(sale.total) }}</span>
      </AmountRow>
    </dl>
  </article>
</template>
