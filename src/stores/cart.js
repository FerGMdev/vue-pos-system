import { ref, computed, watchEffect } from "vue";
import { useCouponStore } from "./coupons";
import { defineStore } from "pinia";
import { collection, addDoc, runTransaction, doc } from "firebase/firestore";
import { useFirestore } from "vuefire";
import { getCurrentDate } from "@/helpers";

export const useCartStore = defineStore("cart", () => {
  const couponStore = useCouponStore();
  const db = useFirestore();

  const items = ref([]);
  const subtotal = ref(0);
  const taxes = ref(0);
  const total = ref(0);

  const MAX_PRODUCT_QUANTITY = 5;
  const TAX_RATE = 0.1;

  watchEffect(() => {
    subtotal.value = Number(
      items.value
        .reduce((acc, item) => acc + Number(item.price) * Number(item.quantity), 0)
        .toFixed(2)
    );
    taxes.value = Number((subtotal.value * TAX_RATE).toFixed(2));
    total.value = Number(
      (subtotal.value + taxes.value - Number(couponStore.discount || 0)).toFixed(2)
    );
  });

  function isItemInCart(itemId) {
    return items.value.findIndex((i) => i.id === itemId);
  }

  function addItemToCart(item) {
    if (!item || item.availability === undefined || item.availability === null) {
      alert("Producto inválido");
      return;
    }
    if (Number(item.availability) <= 0) {
      alert("Producto sin stock");
      return;
    }

    const itemIndex = isItemInCart(item.id);

    if (itemIndex >= 0) {
      const currentQty = items.value[itemIndex].quantity;
      if (currentQty >= Number(item.availability)) {
        alert("No hay suficiente stock para este producto");
        return;
      }
      if (currentQty >= MAX_PRODUCT_QUANTITY) {
        alert("Has llegado al límite para este producto");
        return;
      }
      items.value[itemIndex].quantity++;
    } else {
      if (MAX_PRODUCT_QUANTITY < 1) {
        alert("No se puede agregar este producto");
        return;
      }
      items.value.push({ ...item, quantity: 1, id: item.id });
    }
  }

  function updateQuantity(itemId, quantity) {
    const qty = Number(quantity);
    if (isNaN(qty) || qty <= 0) {
      removeItemFromCart(itemId);
      return;
    }
    const itemIndex = isItemInCart(itemId);
    if (itemIndex < 0) return;
    const item = items.value[itemIndex];
    if (qty > Number(item.availability)) {
      alert("No hay suficiente stock para esta cantidad");
      return;
    }
    if (qty > MAX_PRODUCT_QUANTITY) {
      alert("Has llegado al límite para este producto");
      return;
    }
    items.value[itemIndex].quantity = qty;
  }

  function removeItemFromCart(itemId) {
    items.value = items.value.filter((item) => item.id !== itemId);
  }

  async function checkout() {
    try {
      if (items.value.length === 0) {
        alert("El carrito está vacío");
        return;
      }

      for (const item of items.value) {
        if (!item.id) throw new Error("Producto inválido");
        if (Number(item.quantity) <= 0) throw new Error("Cantidad inválida");
        if (Number(item.quantity) > MAX_PRODUCT_QUANTITY) {
          throw new Error(`Cantidad máxima permitida: ${MAX_PRODUCT_QUANTITY}`);
        }
      }

      await Promise.all(
        items.value.map(async (item) => {
          const productRef = doc(db, "products", item.id);
          await runTransaction(db, async (transaction) => {
            const currentProduct = await transaction.get(productRef);
            if (!currentProduct.exists()) {
              throw new Error("Producto no existe");
            }
            const currentAvailability = Number(currentProduct.data().availability || 0);
            if (currentAvailability < Number(item.quantity)) {
              throw new Error(`Stock insuficiente para ${item.name}`);
            }
            const availability = currentAvailability - Number(item.quantity);
            transaction.update(productRef, { availability });
          });
        })
      );

      await addDoc(collection(db, "sales"), {
        items: items.value.map((item) => {
          const { availability, category, ...data } = item;
          return data;
        }),
        subtotal: subtotal.value,
        taxes: taxes.value,
        total: total.value,
        discount: Number(couponStore.discount || 0),
        createdAt: getCurrentDate(),
      });

      $reset();
      couponStore.$reset();
    } catch (error) {
      console.error("Error al procesar la venta:", error);
      alert(error?.message || "Error al procesar la venta. Intenta nuevamente.");
    }
  }

  function $reset() {
    items.value = [];
    subtotal.value = 0;
    taxes.value = 0;
    total.value = 0;
  }

  const isCartEmpty = computed(() => items.value.length === 0);

  const checkProductAvailability = computed(() => {
    return (product) =>
      Number(product.availability) < MAX_PRODUCT_QUANTITY
        ? Number(product.availability)
        : MAX_PRODUCT_QUANTITY;
  });

  return {
    items,
    subtotal,
    taxes,
    total,
    addItemToCart,
    updateQuantity,
    removeItemFromCart,
    checkout,
    isCartEmpty,
    checkProductAvailability,
  };
});
