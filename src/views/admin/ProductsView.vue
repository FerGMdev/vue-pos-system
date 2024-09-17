<script setup>
import LinkComponent from "@/components/LinkComponent.vue";
import ProductComponent from "@/components/ProductComponent.vue";
import { useProductsStore } from "@/stores/products";

const productsStore = useProductsStore();
</script>

<template>
  <div class="mb-4 mt-10">
    <LinkComponent to="products-new"> Nuevo producto </LinkComponent>
  </div>
  <h1 class="text-2xl font-bold my-4">Inventario</h1>
  <p class="text-center text-gray-500 text-xl mb-4">
    {{ productsStore.productsCollection.length }} productos
  </p>
  <p class="text-center text-gray-500" v-if="productsStore.noResults">
    No hay productos
  </p>
  <ul
    v-else
    role="list"
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
  >
    <ProductComponent
      v-for="product in productsStore.productsCollection"
      :key="product.id"
      :product="product"
    />
  </ul>
</template>

<style lang="css" scoped></style>
