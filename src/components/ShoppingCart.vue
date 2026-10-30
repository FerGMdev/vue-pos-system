<script setup>
import { computed, ref } from "vue";
import { storeToRefs } from "pinia";
import { useRoute, useRouter } from "vue-router";
import CartItem from "./CartItem.vue";
import ConfirmDialog from "./ConfirmDialog.vue";
import CouponForm from "./CouponForm.vue";
import StateMessage from "./StateMessage.vue";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useConfigStore } from "@/stores/config";
import { useProductsStore } from "@/stores/products";
import { useUiStore } from "@/stores/ui";
import { useCurrency } from "@/composables/useCurrency";

const authStore = useAuthStore();
const cartStore = useCartStore();
const configStore = useConfigStore();
const productsStore = useProductsStore();
const uiStore = useUiStore();
const route = useRoute();
const router = useRouter();
const currency = useCurrency();

const { isAuthenticated } = storeToRefs(authStore);
const confirming = ref(false);

const taxRatePercent = computed(() => {
  const rate = configStore.taxRate * 100;
  return Number.isInteger(rate) ? rate : rate.toFixed(2);
});

const checkoutButtonLabel = computed(() => {
  if (cartStore.isCheckingOut) return "Procesando venta...";
  if (!isAuthenticated.value) return "Iniciar sesión para cobrar";
  return `Cobrar ${currency(cartStore.total)}`;
});

function startCheckout() {
  if (cartStore.isCartEmpty || cartStore.isCheckingOut) return;

  if (!isAuthenticated.value) {
    uiStore.info("Inicia sesión para confirmar la venta.");
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }

  confirming.value = true;
}

async function confirmCheckout() {
  const result = await cartStore.checkout();
  confirming.value = false;

  if (result.success) {
    uiStore.success(`Venta registrada por ${currency(result.sale.total)}.`);
    await productsStore.fetchProducts({ silent: true });
    return;
  }

  if (result.requiresAuth) {
    uiStore.info(result.message);
    router.push({ name: "login", query: { redirect: route.fullPath } });
    return;
  }

  uiStore.error(result.message);

  if (["INSUFFICIENT_STOCK", "PRODUCT_NOT_FOUND", "PRICE_CHANGED"].includes(result.code)) {
    await productsStore.fetchProducts({ silent: true });
    const sync = cartStore.syncWithProducts(productsStore.items);
    if (sync.removed.length > 0) {
      uiStore.warning(
        `Se quitaron del carrito productos sin stock: ${sync.removed.join(", ")}.`
      );
    }
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between gap-3">
      <div>
        <h2 class="text-xl font-extrabold tracking-tight text-stone-900">Tu pedido</h2>
        <p class="text-sm text-stone-500">{{ cartStore.itemCount }} artículo(s)</p>
      </div>
      <span
        class="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="h-5 w-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 7h12l-1 12H7L6 7Zm3 0V5a3 3 0 0 1 6 0v2" />
        </svg>
      </span>
    </div>

    <StateMessage
      v-if="cartStore.isCartEmpty"
      class="mt-5"
      variant="empty"
      title="Tu pedido está vacío"
      message="Agrega productos desde el catálogo para comenzar una venta."
    />

    <div v-else class="mt-5">
      <TransitionGroup name="cart-item" tag="ul" role="list" class="divide-y divide-stone-100">
        <CartItem
          v-for="item in cartStore.items"
          :key="item.id"
          :item="item"
        />
      </TransitionGroup>

      <dl class="mt-5 space-y-2.5 rounded-2xl bg-stone-50 p-4 text-sm">
        <div class="flex justify-between text-stone-600">
          <dt>Subtotal</dt>
          <dd class="font-semibold text-stone-900">{{ currency(cartStore.subtotal) }}</dd>
        </div>
        <div v-if="cartStore.discount > 0" class="flex justify-between text-emerald-700">
          <dt>Descuento</dt>
          <dd class="font-semibold">-{{ currency(cartStore.discount) }}</dd>
        </div>
        <div class="flex justify-between text-stone-600">
          <dt>Impuestos ({{ taxRatePercent }}%)</dt>
          <dd class="font-semibold text-stone-900">{{ currency(cartStore.taxes) }}</dd>
        </div>
        <div class="flex items-end justify-between border-t border-stone-200 pt-3">
          <dt class="text-base font-bold text-stone-900">Total</dt>
          <dd class="text-2xl font-extrabold tracking-tight text-stone-900">
            {{ currency(cartStore.total) }}
          </dd>
        </div>
      </dl>

      <CouponForm />

      <p
        v-if="cartStore.checkoutError"
        class="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        role="alert"
      >
        {{ cartStore.checkoutError }}
      </p>

      <button
        type="button"
        class="mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-emerald-600 text-base font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none"
        :disabled="cartStore.isCartEmpty || cartStore.isCheckingOut"
        @click="startCheckout"
      >
        {{ checkoutButtonLabel }}
      </button>
    </div>

    <ConfirmDialog
      :open="confirming"
      title="Confirmar venta"
      :message="`Se cobrarán ${currency(cartStore.total)} por ${cartStore.itemCount} artículo(s). El inventario se descontará al confirmar.`"
      confirm-label="Cobrar"
      :loading="cartStore.isCheckingOut"
      @cancel="confirming = false"
      @confirm="confirmCheckout"
    />
  </div>
</template>

<style scoped>
.cart-item-enter-active,
.cart-item-leave-active {
  transition: all 0.25s ease;
}
.cart-item-enter-from,
.cart-item-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
