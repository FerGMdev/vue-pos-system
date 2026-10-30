<script setup>
import { computed } from "vue";
import { useCouponStore } from "@/stores/coupons";

const couponStore = useCouponStore();

const canApply = computed(
  () =>
    couponStore.code.trim().length > 0 &&
    !couponStore.isApplied &&
    !couponStore.loading
);

function normalizeInput(event) {
  couponStore.code = event.target.value.toUpperCase();
}

function apply() {
  if (canApply.value) couponStore.apply();
}
</script>

<template>
  <div class="mt-5">
    <label for="coupon-code" class="text-sm font-semibold text-stone-700">
      ¿Tienes un cupón?
    </label>

    <div class="mt-2 flex gap-2">
      <input
        id="coupon-code"
        :value="couponStore.code"
        type="text"
        inputmode="text"
        autocomplete="off"
        placeholder="Código"
        class="h-11 min-w-0 flex-1 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold uppercase tracking-wide transition placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15 disabled:bg-stone-100 disabled:text-stone-500"
        :disabled="couponStore.isApplied || couponStore.loading"
        @input="normalizeInput"
        @keyup.enter="apply"
      />
      <button
        type="button"
        class="h-11 rounded-xl bg-stone-900 px-4 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-200 disabled:text-stone-500"
        :disabled="!canApply"
        @click="apply"
      >
        {{ couponStore.loading ? "Validando..." : "Aplicar" }}
      </button>
    </div>

    <div class="mt-2 min-h-5 text-sm" aria-live="polite">
      <p v-if="couponStore.error" class="font-semibold text-red-600">
        {{ couponStore.error }}
      </p>
      <p v-else-if="couponStore.message" class="font-semibold text-emerald-700">
        {{ couponStore.message }}
      </p>
    </div>

    <button
      v-if="couponStore.isApplied"
      type="button"
      class="mt-1 text-sm font-semibold text-stone-500 underline underline-offset-2 hover:text-stone-900"
      @click="couponStore.remove"
    >
      Quitar cupón
    </button>
  </div>
</template>
