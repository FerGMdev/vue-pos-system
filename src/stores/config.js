import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { getAppConfig } from "@/api/system.api";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  DEFAULT_MAX_ITEM_QUANTITY,
  DEFAULT_TAX_RATE,
  DEFAULT_TIMEZONE,
  PRODUCT_CATEGORIES,
} from "@shared/constants.js";

const defaults = {
  taxRate: DEFAULT_TAX_RATE,
  maxItemQuantity: DEFAULT_MAX_ITEM_QUANTITY,
  currency: DEFAULT_CURRENCY,
  locale: DEFAULT_LOCALE,
  timezone: DEFAULT_TIMEZONE,
  categories: PRODUCT_CATEGORIES,
};

export const useConfigStore = defineStore("config", () => {
  const data = ref({ ...defaults });
  const loading = ref(false);
  const error = ref("");
  const loaded = ref(false);

  async function load() {
    if (loading.value) return;
    loading.value = true;
    error.value = "";

    try {
      const remote = await getAppConfig();
      data.value = {
        ...defaults,
        ...remote,
        categories: Array.isArray(remote?.categories)
          ? remote.categories
          : defaults.categories,
      };
      loaded.value = true;
    } catch (loadError) {
      error.value =
        loadError?.message ||
        "No se pudo cargar la configuración del punto de venta.";
    } finally {
      loading.value = false;
    }
  }

  const taxRate = computed(() => Number(data.value.taxRate) || 0);
  const maxItemQuantity = computed(
    () => Number(data.value.maxItemQuantity) || DEFAULT_MAX_ITEM_QUANTITY
  );
  const currency = computed(() => data.value.currency || DEFAULT_CURRENCY);
  const locale = computed(() => data.value.locale || DEFAULT_LOCALE);
  const timezone = computed(() => data.value.timezone || DEFAULT_TIMEZONE);
  const categories = computed(() => data.value.categories);

  const filterCategoryOptions = computed(() => [
    { label: "Todas las categorías", value: "" },
    ...categories.value.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ]);

  const formCategoryOptions = computed(() => [
    {
      label: "Seleccione una categoría",
      value: "",
      attrs: { disabled: true },
    },
    ...categories.value.map((category) => ({
      label: category.name,
      value: category.id,
    })),
  ]);

  return {
    data,
    loading,
    error,
    loaded,
    load,
    taxRate,
    maxItemQuantity,
    currency,
    locale,
    timezone,
    categories,
    filterCategoryOptions,
    formCategoryOptions,
  };
});
