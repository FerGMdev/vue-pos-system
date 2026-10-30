<script setup>
import { computed } from "vue";
import { LOW_STOCK_THRESHOLD } from "@shared/constants.js";
import { useCartStore } from "@/stores/cart";
import { useConfigStore } from "@/stores/config";
import { useUiStore } from "@/stores/ui";
import { useCurrency } from "@/composables/useCurrency";
import ProductImage from "./ProductImage.vue";

const props = defineProps({
  product: { type: Object, required: true },
});

const cartStore = useCartStore();
const configStore = useConfigStore();
const uiStore = useUiStore();
const currency = useCurrency();

const availability = computed(() => Number(props.product.availability) || 0);
const currentQuantity = computed(
  () => cartStore.items.find((item) => item.id === props.product.id)?.quantity ?? 0
);
const limit = computed(() =>
  Math.min(availability.value, cartStore.maxItemQuantity)
);
const canAdd = computed(
  () => availability.value > 0 && currentQuantity.value < limit.value
);
const categoryName = computed(
  () =>
    configStore.categories.find(
      (category) => Number(category.id) === Number(props.product.category)
    )?.name ?? ""
);
const isLowStock = computed(
  () => availability.value > 0 && availability.value <= LOW_STOCK_THRESHOLD
);

const buttonLabel = computed(() => {
  if (availability.value <= 0) return "Sin stock";
  if (currentQuantity.value >= limit.value) return "Límite alcanzado";
  return "Agregar al carrito";
});

function addToCart() {
  const result = cartStore.addItem(props.product);
  if (!result.success) uiStore.warning(result.message);
}
</script>

<template>
  <article
    class="group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/70 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
  >
    <div class="relative aspect-[4/5] overflow-hidden bg-stone-100">
      <ProductImage
        :src="product.image"
        :alt="`Imagen de ${product.name}`"
        img-class="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-105"
      />

      <span
        v-if="categoryName"
        class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-stone-700 shadow-sm backdrop-blur"
      >
        {{ categoryName }}
      </span>

      <span
        v-if="isLowStock"
        class="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
      >
        Últimas {{ availability }}
      </span>
      <span
        v-else-if="currentQuantity > 0"
        class="absolute right-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm"
      >
        En carrito · {{ currentQuantity }}
      </span>
    </div>

    <div class="flex flex-1 flex-col gap-1 p-4">
      <h2 class="line-clamp-2 text-base font-semibold leading-snug text-stone-900">
        {{ product.name }}
      </h2>
      <div class="mt-auto flex items-end justify-between gap-3 pt-2">
        <span class="text-xl font-extrabold tracking-tight text-stone-900">
          {{ currency(product.price) }}
        </span>
        <span class="text-xs font-medium text-stone-500">
          {{ availability }} disp.
        </span>
      </div>
    </div>

    <div class="px-4 pb-4">
      <button
        type="button"
        class="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-stone-900 text-sm font-semibold text-white transition hover:bg-emerald-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500 disabled:hover:bg-stone-200"
        :disabled="!canAdd"
        :aria-label="`${buttonLabel}: ${product.name}`"
        @click="addToCart"
      >
        <span v-if="canAdd" class="text-lg leading-none" aria-hidden="true">+</span>
        {{ buttonLabel }}
      </button>
    </div>
  </article>
</template>
