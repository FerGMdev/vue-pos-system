<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import ProductForm from "@/components/ProductForm.vue";
import { useProductsStore } from "@/stores/products";
import { useUiStore } from "@/stores/ui";

const productsStore = useProductsStore();
const uiStore = useUiStore();
const router = useRouter();

const submitting = ref(false);
const submitError = ref("");

async function handleSubmit(product) {
  submitting.value = true;
  submitError.value = "";

  try {
    await productsStore.createProduct(product);
    uiStore.success("Producto creado correctamente.");
    router.push({ name: "products" });
  } catch (error) {
    submitError.value = error?.message || "No se pudo crear el producto.";
    uiStore.error(submitError.value);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <section aria-labelledby="new-product-title">
    <h1 id="new-product-title" class="mb-6 text-2xl font-bold text-slate-800">
      Nuevo producto
    </h1>

    <p
      v-if="submitError"
      class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
      role="alert"
    >
      {{ submitError }}
    </p>

    <ProductForm
      submit-label="Agregar producto"
      :submitting="submitting"
      require-image
      @submit="handleSubmit"
    />
  </section>
</template>
