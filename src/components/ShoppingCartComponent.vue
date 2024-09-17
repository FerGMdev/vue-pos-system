<script setup>
import ShoppingCartItemComponent from "./ShoppingCartItemComponent.vue";
import CouponFormComponent from "./CouponFormComponent.vue";
import AmountComponent from "./AmountComponent.vue";
import { useCartStore } from "@/stores/cart";
import { useCouponStore } from "@/stores/coupons";
import { formatCurency } from "@/helpers";

const cartStore = useCartStore();
const couponStore = useCouponStore();
</script>

<template>
  <div>
    <p
      class="text-xl text-center font-bold text-gray-500"
      v-if="cartStore.isCartEmpty"
    >
      No hay productos en el carrito
    </p>
    <div v-else>
      <h2 class="text-4xl font-bold text-gray-500">Resumen de compra</h2>
      <ul role="list" class="flex flex-col mt-10 divide-y divide-slate-300">
        <ShoppingCartItemComponent
          v-for="item in cartStore.items"
          :key="item.id"
          :item="item"
        />
      </ul>

      <dl class="space-y-6 border-slate-300 pt-6 text-sm text-slate-700">
        <AmountComponent>
          <template #label>Subtotal</template>
          {{ formatCurency(cartStore.subtotal) }}
        </AmountComponent>
        <AmountComponent>
          <template #label>Impuestos</template>
          {{ formatCurency(cartStore.taxes) }}
        </AmountComponent>
        <AmountComponent
          v-if="couponStore.isCouponApplied"
          class="text-green-600"
        >
          <template #label>Descuento</template>
          {{ formatCurency(couponStore.discount) }}
        </AmountComponent>
        <AmountComponent>
          <template #label>Total</template>
          {{ formatCurency(cartStore.total) }}
        </AmountComponent>
      </dl>
      <CouponFormComponent />
      <button
        class="bg-slate-600 text-white w-full mt-10 px-4 py-2 rounded-md hover:bg-slate-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-600"
        @click="cartStore.checkout"
      >
        Confirmar compra
      </button>
    </div>
  </div>
</template>

<style lang="css" scoped></style>
