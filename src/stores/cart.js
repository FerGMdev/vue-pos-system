import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { calculateTotals } from "@shared/pricing.js";
import { checkoutSale } from "@/api/sales.api";
import { useAuthStore } from "./auth";
import { useConfigStore } from "./config";
import { useCouponStore } from "./coupons";
import { createUuid } from "@/utils/uuid";

export const useCartStore = defineStore("cart", () => {
  const authStore = useAuthStore();
  const configStore = useConfigStore();
  const couponStore = useCouponStore();

  const items = ref([]);
  const isCheckingOut = ref(false);
  const checkoutError = ref("");
  const checkoutId = ref(null);

  const totals = computed(() =>
    calculateTotals({
      items: items.value,
      taxRate: configStore.taxRate,
      discountPercentage: couponStore.discountPercentage,
    })
  );

  const subtotal = computed(() => totals.value.subtotal);
  const discount = computed(() => totals.value.discount);
  const taxes = computed(() => totals.value.taxes);
  const total = computed(() => totals.value.total);
  const isCartEmpty = computed(() => items.value.length === 0);
  const maxItemQuantity = computed(() => configStore.maxItemQuantity);
  const itemCount = computed(() =>
    items.value.reduce((accumulator, item) => accumulator + item.quantity, 0)
  );

  function invalidateCheckoutId() {
    checkoutId.value = null;
  }

  function maxSelectableQuantity(item) {
    return Math.min(
      Math.max(0, Number(item.availability) || 0),
      configStore.maxItemQuantity
    );
  }

  function addItem(product) {
    if (!product?.id || !Number.isFinite(Number(product.price))) {
      return { success: false, message: "Producto inválido." };
    }

    const availability = Math.max(0, Number(product.availability) || 0);
    if (availability <= 0) {
      return { success: false, message: "Este producto no tiene stock." };
    }

    const limit = Math.min(availability, configStore.maxItemQuantity);
    const existing = items.value.find((item) => item.id === product.id);

    if (existing) {
      if (existing.quantity >= limit) {
        const message =
          availability <= configStore.maxItemQuantity
            ? "No hay suficiente stock para agregar más unidades."
            : `Puedes agregar hasta ${configStore.maxItemQuantity} unidades por producto.`;
        return { success: false, message };
      }
      existing.quantity += 1;
    } else {
      items.value.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image ?? "",
        availability,
        quantity: 1,
      });
    }

    invalidateCheckoutId();
    return { success: true };
  }

  function updateQuantity(itemId, quantity) {
    const parsed = Math.trunc(Number(quantity));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      removeItem(itemId);
      return { success: true };
    }

    const item = items.value.find((entry) => entry.id === itemId);
    if (!item) return { success: false, message: "Producto no encontrado." };

    const limit = maxSelectableQuantity(item);
    if (parsed > limit) {
      const message =
        Number(item.availability) <= configStore.maxItemQuantity
          ? "No hay suficiente stock para esa cantidad."
          : `El máximo por producto es ${configStore.maxItemQuantity}.`;
      return { success: false, message };
    }

    item.quantity = parsed;
    invalidateCheckoutId();
    return { success: true };
  }

  function removeItem(itemId) {
    items.value = items.value.filter((item) => item.id !== itemId);
    invalidateCheckoutId();
  }

  /**
   * Reconcile the cart with fresh inventory data. This prevents selling a
   * product that was removed, ran out of stock or changed price in another tab.
   */
  function syncWithProducts(products) {
    const productsById = new Map(products.map((product) => [product.id, product]));
    const removed = [];
    let changed = false;

    items.value = items.value.reduce((accumulator, item) => {
      const product = productsById.get(item.id);
      const availability = Math.max(0, Number(product?.availability) || 0);

      if (!product || availability <= 0) {
        removed.push(item.name);
        changed = true;
        return accumulator;
      }

      const nextQuantity = Math.min(
        item.quantity,
        availability,
        configStore.maxItemQuantity
      );
      const nextPrice = Number(product.price);

      if (
        nextQuantity !== item.quantity ||
        nextPrice !== item.price ||
        product.name !== item.name ||
        product.image !== item.image
      ) {
        changed = true;
      }

      accumulator.push({
        ...item,
        name: product.name,
        price: nextPrice,
        image: product.image ?? "",
        availability,
        quantity: nextQuantity,
      });
      return accumulator;
    }, []);

    if (changed) invalidateCheckoutId();
    return { changed, removed };
  }

  function clear() {
    items.value = [];
    checkoutError.value = "";
    invalidateCheckoutId();
  }

  async function checkout() {
    if (items.value.length === 0) {
      return { success: false, message: "El carrito está vacío." };
    }

    if (!authStore.isAuthenticated) {
      return {
        success: false,
        requiresAuth: true,
        message: "Inicia sesión para confirmar la venta.",
      };
    }

    if (isCheckingOut.value) {
      return { success: false, message: "La venta ya se está procesando." };
    }

    if (!checkoutId.value) {
      checkoutId.value = createUuid();
    }

    isCheckingOut.value = true;
    checkoutError.value = "";

    try {
      const sale = await checkoutSale({
        checkoutId: checkoutId.value,
        items: items.value.map((item) => ({
          id: item.id,
          quantity: item.quantity,
        })),
        couponCode: couponStore.appliedCoupon?.code ?? null,
      });

      clear();
      couponStore.reset();
      return { success: true, sale };
    } catch (error) {
      checkoutError.value =
        error?.message || "No se pudo procesar la venta. Intenta nuevamente.";
      return {
        success: false,
        message: checkoutError.value,
        code: error?.code,
        details: error?.details,
      };
    } finally {
      isCheckingOut.value = false;
    }
  }

  return {
    items,
    isCheckingOut,
    checkoutError,
    subtotal,
    discount,
    taxes,
    total,
    isCartEmpty,
    itemCount,
    maxItemQuantity,
    maxSelectableQuantity,
    addItem,
    updateQuantity,
    removeItem,
    syncWithProducts,
    clear,
    checkout,
  };
});
