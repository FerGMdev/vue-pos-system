import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { validateCoupon } from "@/api/coupons.api";

export const useCouponStore = defineStore("coupons", () => {
  const code = ref("");
  const appliedCoupon = ref(null);
  const loading = ref(false);
  const error = ref("");
  const message = ref("");

  async function apply() {
    const normalized = code.value.trim().toUpperCase();
    error.value = "";
    message.value = "";

    if (!normalized) {
      error.value = "Ingresa un código de cupón.";
      return { success: false, message: error.value };
    }

    loading.value = true;
    try {
      const coupon = await validateCoupon(normalized);
      appliedCoupon.value = coupon;
      code.value = coupon.code;
      message.value = `Cupón ${coupon.code} aplicado: ${coupon.discountPercentage}% de descuento.`;
      return { success: true, coupon };
    } catch (applyError) {
      appliedCoupon.value = null;
      error.value = applyError?.message || "Cupón no válido.";
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  }

  function remove() {
    appliedCoupon.value = null;
    code.value = "";
    error.value = "";
    message.value = "";
  }

  function reset() {
    remove();
  }

  const discountPercentage = computed(
    () => appliedCoupon.value?.percentage ?? 0
  );
  const isApplied = computed(() => Boolean(appliedCoupon.value));

  return {
    code,
    appliedCoupon,
    loading,
    error,
    message,
    apply,
    remove,
    reset,
    discountPercentage,
    isApplied,
  };
});
