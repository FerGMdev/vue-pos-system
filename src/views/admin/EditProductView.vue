<script setup>
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import ProductForm from "@/components/ProductForm.vue";
import StateMessage from "@/components/StateMessage.vue";
import { useProductsStore } from "@/stores/products";
import { useUiStore } from "@/stores/ui";

const route = useRoute();
const router = useRouter();
const productsStore = useProductsStore();
const uiStore = useUiStore();

const product = ref(null);
const loading = ref(false);
const error = ref("");
const submitting = ref(false);
const submitError = ref("");

async function loadProduct() {
  const id = route.params.id;
  product.value = null;
  error.value = "";

  if (!id) {
    error.value = "No se indicó el producto a editar.";
    return;
  }

  loading.value = true;
  try {
    product.value = await productsStore.fetchProduct(String(id));
  } catch (loadError) {
    error.value =
      loadError?.message || "No se pudo cargar el producto solicitado.";
  } finally {
    loading.value = false;
  }
}

async function handleSubmit(payload) {
  submitting.value = true;
  submitError.value = "";

  try {
    await productsStore.updateProduct(product.value.id, payload);
    uiStore.success("Producto actualizado correctamente.");
    router.push({ name: "products" });
  } catch (updateError) {
    submitError.value =
      updateError?.message || "No se pudo actualizar el producto.";
    uiStore.error(submitError.value);
  } finally {
    submitting.value = false;
  }
}

watch(() => route.params.id, loadProduct, { immediate: true });
</script>

<template>
  <section aria-labelledby="edit-product-title">
    <h1 id="edit-product-title" class="mb-6 text-2xl font-bold text-slate-800">
      Editar producto
    </h1>

    <StateMessage
      v-if="loading"
      variant="loading"
      title="Cargando producto"
      message="Estamos consultando la información del producto."
    />

    <StateMessage
      v-else-if="error"
      variant="error"
      title="No se pudo cargar el producto"
      :message="error"
      @retry="loadProduct"
    />

    <template v-else-if="product">
      <p
        v-if="submitError"
        class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        role="alert"
      >
        {{ submitError }}
      </p>

      <ProductForm
        :key="product.id"
        :initial-values="product"
        :existing-image="product.image"
        :existing-image-path="product.imagePath"
        submit-label="Guardar cambios"
        :submitting="submitting"
        @submit="handleSubmit"
      />
    </template>
  </section>
</template>
