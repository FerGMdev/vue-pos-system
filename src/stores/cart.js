import { ref, computed, watchEffect } from "vue";
import { useCouponStore } from "./coupons";
import { defineStore } from "pinia";
import { collection, addDoc, runTransaction, doc } from "firebase/firestore";
import { useFirestore } from "vuefire";
import { getCurrentDate } from "@/helpers";
/**
 * -> items: ref([]): This is a reactive reference to an array that will store the items in the cart.
 * -> MAX_PRODUCT_QUANTITY: A constant set to 5, representing the maximum quantity of a product that can be added to the cart.
 * -> addItemToCart(item): This function adds an item to the cart. It first checks if the item already exists in the cart by looking for an item with the same id.
 * -> updateQuantity(itemId, quantity): This function updates the quantity of an item in the cart. It first checks if the quantity is greater than the maximum allowed quantity.
 * -> If the item exists, it increments the quantity of that item. If not, it adds the item to the cart with a quantity of 1.
 * -> isCartEmpty: A computed property that returns true if the cart is empty (i.e., the items array has no elements).
 * -> checkProductAvailability: A computed property that takes a product as input and returns the maximum quantity of that product that can be added to the cart based on its availability.
 */
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
    subtotal.value = items.value.reduce(
      (acc, item) => acc + item.price * item.quantity,
      0
    );
    taxes.value = Number((subtotal.value * TAX_RATE).toFixed(2));
    total.value = Number(
      (subtotal.value + taxes.value - couponStore.discount).toFixed(2)
    );
  });

  function addItemToCart(item) {
    const itemIndex = isItemInCart(item.id);

    if (itemIndex >= 0) {
      if (isProductAvailable(item, itemIndex)) {
        alert("Has llegado al límite para este producto");
        return;
      }
      items.value[itemIndex].quantity++;
    } else {
      items.value.push({ ...item, quantity: 1, id: item.id });
    }
  }

  function updateQuantity(itemId, quantity) {
    console.log(itemId, quantity);
    items.value = items.value.map((item) =>
      item.id === itemId ? { ...item, quantity } : item
    );
  }

  function removeItemFromCart(itemId) {
    items.value = items.value.filter((item) => item.id !== itemId);
  }

  async function checkout() {
    try {
      await addDoc(collection(db, "sales"), {
        items: items.value.map((item) => {
          const { availability, category, ...data } = item;
          return data;
        }),
        subtotal: subtotal.value,
        taxes: taxes.value,
        total: total.value,
        discount: couponStore.discount,
        createdAt: getCurrentDate(),
      });

      // Substract the items from the inventory

      items.value.forEach(async (item) => {
        const productRef = doc(db, "products", item.id);
        await runTransaction(db, async (transaction) => {
          const currentProduct = await transaction.get(productRef);
          const availability =
            currentProduct.data().availability - item.quantity;

          transaction.update(productRef, { availability });
        });
      });

      // Reset the cart and the coupon store once the checkout is successful
      $reset();
      couponStore.$reset();

      console.log("checkout successful");
    } catch (error) {
      console.log(error);
    }
  }

  function $reset() {
    items.value = [];
    subtotal.value = 0;
    taxes.value = 0;
    total.value = 0;
  }

  const isItemInCart = (itemId) =>
    items.value.findIndex((i) => i.id === itemId);

  // Verify if the product is available in the cart or if the quantity is greater than the maximum allowed quantity
  const isProductAvailable = (item, index) => {
    return (
      items.value[index].quantity >= item.availability ||
      items.value[index].quantity >= MAX_PRODUCT_QUANTITY
    );
  };
  const isCartEmpty = computed(() => items.value.length === 0);

  const checkProductAvailability = computed(() => {
    return (product) =>
      product.availability < MAX_PRODUCT_QUANTITY
        ? product.availability
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
