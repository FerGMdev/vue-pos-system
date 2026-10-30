<script setup>
import { computed, ref } from "vue";
import { RouterLink } from "vue-router";
import ConfirmDialog from "./ConfirmDialog.vue";
import ProductImage from "./ProductImage.vue";
import { useConfigStore } from "@/stores/config";
import { useProductsStore } from "@/stores/products";
import { useUiStore } from "@/stores/ui";
import { useCurrency } from "@/composables/useCurrency";

const props = defineProps({
  product: { type: Object, required: true },
});

const productsStore = useProductsStore();
const configStore = useConfigStore();
const uiStore = useUiStore();
const currency = useCurrency();

const confirming = ref(false);
const deleting = ref(false);

const availability = computed(() => Number(props.product.availability) || 0);
const categoryName = computed(
  () =>
    configStore.categories.find(
      (category) => Number(category.id) === Number(props.product.category)
    )?.name || "Sin categoría"
);
const isOutOfStock = computed(() => availability.value <= 0);

async function deleteProduct() {
  deleting.value = true;
  try {
    await productsStore.deleteProduct(props.product.id);
    uiStore.success("Producto eliminado.");
    confirming.value = false;
  } catch (error) {
    uiStore.error(error?.message || "No se pudo eliminar el producto.");
  } finally {
    deleting.value = false;
  }
}
</script>

<template>
  <li
    class="space-y-3 rounded-lg border-l-8 bg-white p-4 shadow-md"
    :class="isOutOfStock ? 'border-red-500 opacity-75' : 'border-green-600'"
  >
    <div class="flex items-center gap-4">
      <ProductImage
        :src="product.image"
        :alt="`Imagen de ${product.name}`"
        img-class="h-20 w-20 rounded-full object-cover"
      />

      <div class="min-w-0 flex-1">
        <h3 class="truncate text-lg font-medium text-slate-800">
          {{ product.name }}
        </h3>
        <p class="text-sm text-slate-500">
          {{ availability }} en existencia · {{ categoryName }}
        </p>
        <p v-if="isOutOfStock" class="text-sm font-semibold text-red-600">
          Sin stock
        </p>
      </div>

      <span class="font-bold text-slate-800">{{ currency(product.price) }}</span>
    </div>

    <div class="flex justify-end gap-3">
      <RouterLink
        :to="{ name: 'products-edit', params: { id: product.id } }"
        class="rounded p-1 text-slate-600 hover:bg-slate-100 hover:text-green-700"
        :aria-label="`Editar ${product.name}`"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
          />
        </svg>
      </RouterLink>

      <button
        type="button"
        class="rounded p-1 text-red-600 hover:bg-red-50"
        :aria-label="`Eliminar ${product.name}`"
        @click="confirming = true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="h-6 w-6"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
      </button>
    </div>

    <ConfirmDialog
      :open="confirming"
      title="Eliminar producto"
      :message="`¿Seguro que quieres eliminar “${product.name}”? Esta acción no se puede deshacer.`"
      confirm-label="Eliminar"
      :loading="deleting"
      danger
      @cancel="confirming = false"
      @confirm="deleteProduct"
    />
  </li>
</template>
