<script setup>
import { useCartStore } from "@/stores/cart";
import { formatCurency } from "@/helpers";

const cartStore = useCartStore();
defineProps({
  product: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div class="w-full flex items-center justify-center bg-gray-200">
    <article
      class="max-w-sm w-full h-full flex flex-col justify-between bg-white rounded-lg shadow-lg overflow-hidden"
    >
      <div>
        <img
          class="object-cover w-full hover:scale-105 transition-all duration-300"
          :src="product.image"
          :alt="'Imagen de ' + product.name"
        />
      </div>
      <div class="flex flex-col align-top mt-4 px-4 pb-4 border-slate-200">
        <h2 class="text-xl font-semibold text-gray-800">
          {{ product.name }}
        </h2>
        <p class="text-gray-600 text-sm">
          Disponible: {{ product.availability }}
        </p>
        <span class="font-black text-gray-800 text-xl">{{
          formatCurency(product.price)
        }}</span>
      </div>

      <div
        class="border-b-8 border-transparent hover:border-green-600 bg-transparent transition-all duration-300 hover:bg-slate-100"
      >
        <button
          id="add-to-cart"
          class="w-full p-4 flex gap-4 justify-center items-center font-bold cursor-pointer text-slate-800"
          @click="cartStore.addItemToCart(product)"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            fill="currentColor"
            class="bi bi-bag-plus"
            viewBox="0 0 16 16"
          >
            <path
              fill-rule="evenodd"
              d="M8 7.5a.5.5 0 0 1 .5.5v1.5H10a.5.5 0 0 1 0 1H8.5V12a.5.5 0 0 1-1 0v-1.5H6a.5.5 0 0 1 0-1h1.5V8a.5.5 0 0 1 .5-.5z"
            />
            <path
              d="M8 1a2.5 2.5 0 0 1 2.5 2.5V4h-5v-.5A2.5 2.5 0 0 1 8 1zm3.5 3v-.5a3.5 3.5 0 1 0-7 0V4H1v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V4h-3.5zM2 5h12v9a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5z"
            />
          </svg>

          <span>Agregar al carrito</span>
        </button>
      </div>
    </article>
  </div>
</template>

<style lang="css" scoped></style>
