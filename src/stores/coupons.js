import { ref, watch, computed } from "vue";
import { defineStore } from "pinia";
import { useCartStore } from "./cart";

export const useCouponStore = defineStore("coupon", () => {
  const cartStore = useCartStore();

  const couponInput = ref("");
  const couponValidateMessage = ref("");
  const discountPercentage = ref(0);
  const discount = ref(0);

  const VALID_COUPONS = [
    { name: "10DESCUENTO", discount: 0.1 },
    { name: "20DESCUENTO", discount: 0.2 },
    { name: "30DESCUENTO", discount: 0.3 },
  ];

  watch(discountPercentage, () => {
    const base = Number(cartStore.subtotal || 0);
    discount.value = Number((base * discountPercentage.value).toFixed(2));
  });

  function applyCoupon() {
    couponValidateMessage.value = "Validando cupón...";
    if (cartStore.subtotal <= 0) {
      setTimeout(() => {
        couponInput.value = "";
        couponValidateMessage.value = "Agrega productos al carrito para aplicar un cupón";
      }, 800);
      setTimeout(() => {
        couponValidateMessage.value = "";
      }, 4000);
      return;
    }
    const found = VALID_COUPONS.find(
      (coupon) => coupon.name === couponInput.value.trim().toUpperCase()
    );
    if (found) {
      setTimeout(() => {
        discountPercentage.value = found.discount;
        couponValidateMessage.value = `¡Cupón del ${found.discount * 100}% aplicado correctamente!`;
      }, 800);
    } else {
      setTimeout(() => {
        couponInput.value = "";
        couponValidateMessage.value = "Cupón no válido";
        discountPercentage.value = 0;
        discount.value = 0;
      }, 800);
    }

    setTimeout(() => {
      couponValidateMessage.value = "";
    }, 6000);
  }

  function $reset() {
    couponInput.value = "";
    couponValidateMessage.value = "";
    discountPercentage.value = 0;
    discount.value = 0;
  }

  const isCouponApplied = computed(() => discountPercentage.value > 0);

  return {
    couponInput,
    discount,
    couponValidateMessage,
    applyCoupon,
    $reset,
    discountPercentage,
    isCouponApplied,
  };
});
