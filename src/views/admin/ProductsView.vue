<script setup>
import { onMounted } from "vue";
import LinkButton from "@/components/LinkButton.vue";
import ProductRow from "@/components/ProductRow.vue";
import RetryBanner from "@/components/RetryBanner.vue";
import StateMessage from "@/components/StateMessage.vue";
import { useProductsStore } from "@/stores/products";

const productsStore = useProductsStore();

function refresh() {
  return productsStore.fetchProducts();
}

onMounted(refresh);
</script>

<template>
  <section aria-labelledby="inventory-title">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 id="inventory-title" class="text-2xl font-bold text-slate-800">
          Inventario
        </h1>
        <p class="mt-1 text-sm text-slate-500">
          {{ productsStore.totalProducts }} producto(s)
        </p>
      </div>

      <div class="flex flex-wrap gap-3">
        <button
          type="button"
          class="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          :disabled="productsStore.loading"
          @click="refresh"
        >
          {{ productsStore.loading ? "Actualizando..." : "Actualizar" }}
        </button>
        <LinkButton to="products-new">Nuevo producto</LinkButton>
      </div>
    </div>

    <RetryBanner
      v-if="productsStore.error && productsStore.items.length > 0"
      :message="`No se pudo actualizar el inventario: ${productsStore.error}`"
      :retrying="productsStore.loading"
      @retry="refresh"
    />

    <StateMessage
      v-if="productsStore.loading && productsStore.items.length === 0"
      variant="loading"
      title="Cargando inventario"
      message="Estamos consultando los productos."
    />

    <StateMessage
      v-else-if="productsStore.error && productsStore.items.length === 0"
      variant="error"
      title="No se pudo cargar el inventario"
      :message="productsStore.error"
      @retry="refresh"
    />

    <StateMessage
      v-else-if="productsStore.items.length === 0"
      variant="empty"
      title="Inventario vacío"
      message="Crea tu primer producto para comenzar a vender."
    />

    <ul
      v-else
      role="list"
      class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <ProductRow
        v-for="product in productsStore.items"
        :key="product.id"
        :product="product"
      />
    </ul>
  </section>
</template>
