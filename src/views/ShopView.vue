<script setup>
import { onMounted, ref } from "vue";
import AppNav from "@/components/AppNav.vue";
import ProductCard from "@/components/ProductCard.vue";
import RetryBanner from "@/components/RetryBanner.vue";
import ShoppingCart from "@/components/ShoppingCart.vue";
import StateMessage from "@/components/StateMessage.vue";
import { useCartStore } from "@/stores/cart";
import { useProductsStore } from "@/stores/products";
import { useUiStore } from "@/stores/ui";
import { useCurrency } from "@/composables/useCurrency";

const cartStore = useCartStore();
const productsStore = useProductsStore();
const uiStore = useUiStore();
const currency = useCurrency();
const cartSection = ref(null);

async function refreshProducts() {
  await productsStore.fetchProducts();
  const sync = cartStore.syncWithProducts(productsStore.items);
  if (sync.removed.length > 0) {
    uiStore.warning(
      `Se quitaron del carrito productos sin stock: ${sync.removed.join(", ")}.`
    );
  }
}

function selectCategory(value) {
  productsStore.selectedCategory = value;
}

function scrollToCart() {
  cartSection.value?.scrollIntoView({ behavior: "smooth", block: "start" });
}

onMounted(refreshProducts);
</script>

<template>
  <div class="min-h-screen bg-stone-50 pb-28 lg:pb-12">
    <AppNav />

    <main class="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-6 lg:flex-row lg:gap-10 lg:px-8 lg:py-10">
      <section class="min-w-0 flex-1" aria-labelledby="catalog-title">
        <div class="mb-6 space-y-5">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                Catálogo
              </p>
              <h1 id="catalog-title" class="mt-1 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
                Productos
              </h1>
              <p class="mt-1 text-sm text-stone-500">
                {{ productsStore.totalProducts }} producto(s) en inventario
              </p>
            </div>

            <button
              type="button"
              class="inline-flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-stone-300 hover:bg-stone-50 disabled:opacity-50"
              :disabled="productsStore.loading"
              @click="refreshProducts"
            >
              <span
                class="inline-block"
                :class="productsStore.loading ? 'animate-spin' : ''"
                aria-hidden="true"
              >↻</span>
              {{ productsStore.loading ? "Actualizando..." : "Actualizar" }}
            </button>
          </div>

          <div class="relative">
            <label for="product-search" class="sr-only">Buscar productos</label>
            <svg
              class="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <path stroke-linecap="round" d="m20 20-3.5-3.5" />
            </svg>
            <input
              id="product-search"
              v-model="productsStore.searchQuery"
              type="search"
              placeholder="Buscar por nombre..."
              autocomplete="off"
              class="h-12 w-full rounded-2xl border border-stone-200 bg-white pl-12 pr-4 text-base shadow-sm transition placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15"
            />
          </div>

          <div
            class="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:px-0"
            role="group"
            aria-label="Filtrar por categoría"
          >
            <button
              v-for="category in productsStore.categoryOptions"
              :key="category.value"
              type="button"
              :aria-pressed="productsStore.selectedCategory === category.value"
              class="shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition"
              :class="
                productsStore.selectedCategory === category.value
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-100'
              "
              @click="selectCategory(category.value)"
            >
              {{ category.label }}
            </button>
          </div>
        </div>

        <RetryBanner
          v-if="productsStore.error && productsStore.items.length > 0"
          :message="`No se pudo actualizar el inventario: ${productsStore.error}`"
          :retrying="productsStore.loading"
          @retry="refreshProducts"
        />

        <StateMessage
          v-if="productsStore.loading && productsStore.items.length === 0"
          variant="loading"
          title="Cargando productos"
          message="Estamos consultando el inventario."
        />

        <StateMessage
          v-else-if="productsStore.error && productsStore.items.length === 0"
          variant="error"
          title="No se pudo cargar el inventario"
          :message="productsStore.error"
          @retry="refreshProducts"
        />

        <StateMessage
          v-else-if="productsStore.noResults"
          variant="empty"
          title="Sin productos"
          message="No encontramos productos con esa búsqueda o categoría."
        />

        <div
          v-else
          class="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-3 2xl:grid-cols-4"
        >
          <ProductCard
            v-for="product in productsStore.filteredProducts"
            :key="product.id"
            :product="product"
          />
        </div>
      </section>

      <aside
        id="cart"
        ref="cartSection"
        class="w-full scroll-mt-24 lg:sticky lg:top-24 lg:w-[24rem] lg:shrink-0 lg:self-start"
        aria-labelledby="cart-title"
      >
        <div class="rounded-3xl border border-stone-200/70 bg-white p-5 shadow-sm sm:p-6">
          <h2 id="cart-title" class="sr-only">Carrito de compras</h2>
          <ShoppingCart />
        </div>
      </aside>
    </main>

    <Transition name="slide-up">
      <div
        v-if="cartStore.itemCount > 0"
        class="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden"
      >
        <button
          type="button"
          class="flex h-14 w-full items-center justify-between gap-4 rounded-2xl bg-emerald-600 px-5 text-white shadow-lg shadow-emerald-600/30 transition active:scale-[0.99]"
          @click="scrollToCart"
        >
          <span class="text-sm font-semibold">Ver carrito · {{ cartStore.itemCount }}</span>
          <span class="text-base font-extrabold">{{ currency(cartStore.total) }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>
