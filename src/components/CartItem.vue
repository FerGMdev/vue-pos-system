<script setup>
import { computed } from "vue";
import ProductImage from "./ProductImage.vue";
import { useCartStore } from "@/stores/cart";
import { useUiStore } from "@/stores/ui";
import { useCurrency } from "@/composables/useCurrency";

const props = defineProps({
  item: { type: Object, required: true },
});

const cartStore = useCartStore();
const uiStore = useUiStore();
const currency = useCurrency();

const canIncrease = computed(
  () => props.item.quantity < cartStore.maxSelectableQuantity(props.item)
);
const lineTotal = computed(
  () => Number(props.item.price) * Number(props.item.quantity)
);

function decrease() {
  cartStore.updateQuantity(props.item.id, props.item.quantity - 1);
}

function increase() {
  const result = cartStore.updateQuantity(props.item.id, props.item.quantity + 1);
  if (!result.success) uiStore.warning(result.message);
}
</script>

<template>
  <li class="flex gap-3 py-4">
    <ProductImage
      :src="item.image"
      :alt="`Imagen de ${item.name}`"
      img-class="h-20 w-20 shrink-0 rounded-xl bg-stone-100 object-cover"
    />

    <div class="flex min-w-0 flex-1 flex-col justify-between gap-2">
      <div class="flex items-start justify-between gap-2">
        <h3 class="line-clamp-2 text-sm font-semibold leading-snug text-stone-900">
          {{ item.name }}
        </h3>
        <button
          type="button"
          class="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-red-50 hover:text-red-600"
          :aria-label="`Eliminar ${item.name} del carrito`"
          @click="cartStore.removeItem(item.id)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.8"
            stroke="currentColor"
            class="h-4 w-4"
            aria-hidden="true"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M6 7h12M9 7V5h6v2m-7 0 .7 11.2A2 2 0 0 0 10.7 20h2.6a2 2 0 0 0 2-1.8L16 7"
            />
          </svg>
        </button>
      </div>

      <div class="flex items-center justify-between gap-2">
        <div
          class="inline-flex items-center rounded-full bg-stone-100 p-1"
          role="group"
          :aria-label="`Cantidad de ${item.name}`"
        >
          <button
            type="button"
            class="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-bold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95"
            aria-label="Disminuir cantidad"
            @click="decrease"
          >
            −
          </button>
          <span
            class="w-10 text-center text-sm font-bold tabular-nums text-stone-900"
            aria-live="polite"
          >
            {{ item.quantity }}
          </span>
          <button
            type="button"
            class="grid h-10 w-10 place-items-center rounded-full bg-white text-lg font-bold text-stone-700 shadow-sm transition hover:bg-stone-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            :disabled="!canIncrease"
            aria-label="Aumentar cantidad"
            @click="increase"
          >
            +
          </button>
        </div>

        <div class="text-right">
          <p class="text-sm font-bold tabular-nums text-stone-900">
            {{ currency(lineTotal) }}
          </p>
          <p class="text-xs text-stone-500">{{ currency(item.price) }} c/u</p>
        </div>
      </div>
    </div>
  </li>
</template>
