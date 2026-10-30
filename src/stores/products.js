import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  createProduct as createProductRequest,
  deleteProduct as deleteProductRequest,
  getProduct,
  listProducts,
  updateProduct as updateProductRequest,
} from "@/api/products.api";
import { useConfigStore } from "./config";

export const useProductsStore = defineStore("products", () => {
  const configStore = useConfigStore();

  const items = ref([]);
  const loading = ref(false);
  const error = ref("");
  const selectedCategory = ref("");
  const searchQuery = ref("");
  let requestSequence = 0;

  function normalizeText(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  async function fetchProducts({ silent = false } = {}) {
    const currentRequest = ++requestSequence;
    if (!silent) loading.value = true;
    error.value = "";

    try {
      const products = await listProducts();
      if (currentRequest === requestSequence) {
        items.value = Array.isArray(products) ? products : [];
      }
    } catch (fetchError) {
      if (currentRequest === requestSequence) {
        error.value =
          fetchError?.message || "No se pudieron cargar los productos.";
      }
    } finally {
      if (currentRequest === requestSequence) loading.value = false;
    }
  }

  async function fetchProduct(id) {
    return getProduct(id);
  }

  async function createProduct(product) {
    const created = await createProductRequest(product);
    await fetchProducts({ silent: true });
    return created;
  }

  async function updateProduct(id, product) {
    const updated = await updateProductRequest(id, product);
    await fetchProducts({ silent: true });
    return updated;
  }

  async function deleteProduct(id) {
    await deleteProductRequest(id);
    // Quita el producto de la lista al instante y reconcilia en segundo plano.
    items.value = items.value.filter((product) => product.id !== id);
    await fetchProducts({ silent: true });
  }

  const filteredProducts = computed(() => {
    const term = normalizeText(searchQuery.value);

    return items.value.filter((product) => {
      const matchesCategory =
        selectedCategory.value === "" ||
        Number(product.category) === Number(selectedCategory.value);
      const matchesSearch =
        term === "" || normalizeText(product.name).includes(term);
      return matchesCategory && matchesSearch && Number(product.availability) > 0;
    });
  });

  const noResults = computed(
    () => !loading.value && !error.value && filteredProducts.value.length === 0
  );

  const totalProducts = computed(() => items.value.length);
  const categoryOptions = computed(() => configStore.filterCategoryOptions);
  const formCategoryOptions = computed(() => configStore.formCategoryOptions);

  return {
    items,
    loading,
    error,
    selectedCategory,
    searchQuery,
    fetchProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    filteredProducts,
    noResults,
    totalProducts,
    categoryOptions,
    formCategoryOptions,
  };
});
