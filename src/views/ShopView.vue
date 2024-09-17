<script setup>
import { storeToRefs } from "pinia";
import MainNavComponent from "@/components/MainNavComponent.vue";
import ProductCardComponent from "@/components/ProductCardComponent.vue";
import ShoppingCartComponent from "@/components/ShoppingCartComponent.vue";
import { useProductsStore } from "@/stores/products";
import { useCartStore } from "@/stores/cart";

const productsStore = useProductsStore();
const cartStore = useCartStore();

const { filteredProducts, noResults, categoryOptions, selectCategory } =
  storeToRefs(productsStore);
</script>

<template>
  <MainNavComponent />
  <main class="py-24 lg:flex lg:h-screen lg:overflow-y-hidden">
    <div class="lg:w-2/3 lg:screen lg:overflow-y-scroll p-10">
      <!-- ============ Barra de filtros ============ -->
      <div
        class="shadow-md py-4 mb-8 px-6 w-full lg:screen lg:overflow-y-scroll bg-slate-100 p-4 rounded-md"
      >
        <div
          class="flex flex-col md:flex-row items-start gap-4 md:items-center justify-between"
        >
          <h2 class="text-lg font-semibold text-gray-800">Filtrar por</h2>
          <div class="flex items-center space-x-4">
            <label for="category-filter" class="text-gray-600"
              >Categoría:</label
            >
            <select
              class="bg-white border border-gray-300 rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-green-600 border-none"
              v-model="selectCategory"
            >
              <option
                class="text-gray-800"
                v-for="category in categoryOptions"
                :key="category.value"
                :value="category.value"
                :selected="category.value === selectCategory"
              >
                {{ category.label }}
              </option>
            </select>
          </div>
        </div>
      </div>

      <!-- ============ Productos ============ -->
      <h1 class="text-center text-gray-500 text-4xl font-bold mb-10">
        Productos
      </h1>
      <p class="text-center text-gray-500" v-if="noResults">No hay productos</p>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" v-else>
        <ProductCardComponent
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
        />
      </div>
    </div>

    <!-- ============ Carrito ============ -->
    <aside class="lg:w-1/3 lg:screen lg:overflow-y-scroll p-10">
      <ShoppingCartComponent />
    </aside>
  </main>
</template>

<style lang="css" scoped></style>
