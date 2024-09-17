<script setup>
import { computed } from "vue";
import { useCouponStore } from "@/stores/coupons";

const couponStore = useCouponStore();

const disableApplyButton = computed(
  () => couponStore.couponInput === "" || couponStore.isCouponApplied
);
</script>

<template>
  <p class="mt-4 text-slate-700 border-slate-300 pt-4">¿Tienes un cupón?</p>

  <div class="flex items-center mt-6 gap-4 md:gap-2">
    <input
      placeholder="Ingresa tu cupón"
      type="text"
      class="font-semibold border border-none rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
      v-model="couponStore.couponInput"
      :disabled="couponStore.isCouponApplied"
      @keyup.enter="couponStore.applyCoupon"
    />
    <button
      class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-green-600"
      @click="couponStore.applyCoupon"
      :disabled="disableApplyButton"
    >
      Aplicar
    </button>
  </div>
  <p
    v-if="couponStore.couponValidateMessage"
    class="text-sm mt-2 font-semibold"
  >
    {{ couponStore.couponValidateMessage }}
  </p>
</template>
