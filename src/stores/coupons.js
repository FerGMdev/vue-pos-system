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
    discount.value = (cartStore.total * discountPercentage.value).toFixed(2);
  });

  function applyCoupon() {
    couponValidateMessage.value = "Validando cupón...";
    if (VALID_COUPONS.some((coupon) => coupon.name === couponInput.value)) {
      setTimeout(() => {
        discountPercentage.value = VALID_COUPONS.find(
          (coupon) => coupon.name === couponInput.value
        ).discount;
        couponValidateMessage.value = `¡Cupón del ${
          discountPercentage.value * 100
        }% aplicado correctamente!`;
      }, 3000);
    } else {
      setTimeout(() => {
        couponInput.value = "";
        couponValidateMessage.value = "Cupón no válido";
      }, 3000);
    }

    setTimeout(() => {
      couponValidateMessage.value = "";
    }, 7000);
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
