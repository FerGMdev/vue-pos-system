<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { RouterLink } from "vue-router";
import DashboardPanel from "@/components/dashboard/DashboardPanel.vue";
import StatCard from "@/components/dashboard/StatCard.vue";
import LinkButton from "@/components/LinkButton.vue";
import ProductImage from "@/components/ProductImage.vue";
import StateMessage from "@/components/StateMessage.vue";
import { useAuthStore } from "@/stores/auth";
import { useConfigStore } from "@/stores/config";
import { useDashboardStore } from "@/stores/dashboard";
import { useCurrency } from "@/composables/useCurrency";
import { formatDateKey, formatRelativeTime } from "@/utils/format";

const STALE_AFTER_MS = 10 * 60 * 1000;

const authStore = useAuthStore();
const configStore = useConfigStore();
const dashboardStore = useDashboardStore();
const currency = useCurrency();

const now = ref(new Date());
let ticker = null;

const summary = computed(() => dashboardStore.summary);
const isNewBusiness = computed(() => summary.value?.totalProducts === 0);
const updatedLabel = computed(() =>
  summary.value ? formatRelativeTime(summary.value.generatedAt, "es-MX", now.value) : ""
);
const isStale = computed(() => {
  if (!summary.value?.generatedAt) return false;
  return now.value - new Date(summary.value.generatedAt) > STALE_AFTER_MS;
});

function categoryName(categoryId) {
  return (
    configStore.categories.find((category) => Number(category.id) === Number(categoryId))
      ?.name ?? ""
  );
}

function offerValidity(offer) {
  if (!offer.endsAt) return "Sin fecha de fin";
  return `Vigente hasta el ${formatDateKey(offer.endsAt)}`;
}

function refresh() {
  return dashboardStore.fetchSummary();
}

onMounted(() => {
  refresh();
  ticker = setInterval(() => {
    now.value = new Date();
  }, 30_000);
});

onBeforeUnmount(() => clearInterval(ticker));
</script>

<template>
  <section aria-labelledby="dashboard-title" class="space-y-8">
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
          Inicio
        </p>
        <h1 id="dashboard-title" class="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">
          Resumen del negocio
        </h1>
        <p class="mt-1 text-sm text-stone-500">
          Hola, {{ authStore.user?.email }}
          <span v-if="summary" class="mx-1">·</span>
          <span
            v-if="summary"
            :class="isStale ? 'font-semibold text-amber-600' : ''"
          >
            Actualizado {{ updatedLabel }}
          </span>
        </p>
      </div>

      <button
        type="button"
        class="inline-flex h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-4 text-sm font-semibold text-stone-700 shadow-sm transition hover:bg-stone-50 disabled:opacity-50"
        :disabled="dashboardStore.loading"
        @click="refresh"
      >
        <span
          class="inline-block"
          :class="dashboardStore.loading ? 'animate-spin' : ''"
          aria-hidden="true"
        >↻</span>
        {{ dashboardStore.loading ? "Actualizando..." : "Actualizar" }}
      </button>
    </header>

    <div v-if="dashboardStore.loading && !summary" aria-busy="true">
      <StateMessage
        variant="loading"
        title="Cargando resumen"
        message="Estamos reuniendo las ventas, el inventario y las ofertas."
      />
    </div>

    <StateMessage
      v-else-if="dashboardStore.error && !summary"
      variant="error"
      title="No se pudo cargar el resumen"
      :message="dashboardStore.error"
      @retry="refresh"
    />

    <template v-else-if="summary">
      <section
        v-if="isNewBusiness"
        class="flex flex-col items-start gap-4 rounded-2xl bg-stone-900 p-8 text-white shadow-lg sm:p-10"
        aria-labelledby="onboarding-title"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-400">Primeros pasos</p>
        <h2 id="onboarding-title" class="text-2xl font-extrabold tracking-tight">
          Empieza agregando tu primer producto
        </h2>
        <p class="max-w-xl text-stone-300">
          Cuando tengas productos, aquí verás qué reabastecer, qué se vende más y las ofertas activas.
        </p>
        <LinkButton to="products-new" variant="primary">Agregar producto</LinkButton>
      </section>

      <template v-else>
        <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard
            label="Ventas hoy"
            :value="summary.today.salesCount"
            hint="Ventas registradas hoy"
            tone="success"
          />
          <StatCard
            label="Ingresos hoy"
            :value="currency(summary.today.total)"
            hint="Total cobrado con impuestos"
            tone="success"
          />
          <StatCard
            label="Sin stock"
            :value="summary.stock.outOfStock"
            :hint="summary.stock.outOfStock > 0 ? 'Reabastecer cuanto antes' : 'Todo tiene existencias'"
            tone="danger"
            to="products"
          />
          <StatCard
            label="Poco stock"
            :value="summary.stock.lowStock"
            :hint="`${summary.stock.lowStockThreshold} unidades o menos`"
            tone="warning"
            to="products"
          />
        </div>

        <div class="grid gap-6 lg:grid-cols-5">
          <DashboardPanel
            class="lg:col-span-3"
            title="Reabastecer"
            subtitle="Productos agotados o con poca existencia"
            :empty="summary.restockProducts.length === 0"
            empty-title="Todo tiene existencias suficientes"
            :empty-message="`Ningún producto tiene ${summary.stock.lowStockThreshold} unidades o menos.`"
          >
            <template #actions>
              <RouterLink
                :to="{ name: 'products' }"
                class="text-sm font-semibold text-emerald-700 hover:underline"
              >
                Ver inventario
              </RouterLink>
            </template>

            <ul class="divide-y divide-stone-100" role="list">
              <li
                v-for="product in summary.restockProducts"
                :key="product.id"
                class="flex items-center gap-4 py-3"
              >
                <ProductImage
                  :src="product.image"
                  :alt="`Imagen de ${product.name}`"
                  img-class="h-12 w-12 shrink-0 rounded-xl bg-stone-100 object-cover"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate font-semibold text-stone-900">{{ product.name }}</p>
                  <p class="text-xs text-stone-500">{{ categoryName(product.category) }}</p>
                </div>
                <span
                  class="shrink-0 rounded-full px-3 py-1 text-xs font-bold"
                  :class="product.availability <= 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'"
                >
                  {{ product.availability <= 0 ? "Agotado" : `${product.availability} disp.` }}
                </span>
                <RouterLink
                  :to="{ name: 'products-edit', params: { id: product.id } }"
                  class="shrink-0 rounded-full bg-stone-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-600"
                >
                  Reabastecer
                </RouterLink>
              </li>
            </ul>
          </DashboardPanel>

          <DashboardPanel
            class="lg:col-span-2"
            title="Más vendidos"
            :subtitle="`Últimos ${summary.topSellersPeriodDays} días`"
            :empty="summary.topSellers.length === 0"
            empty-title="Aún no hay ventas en este periodo"
            empty-message="Cuando registres ventas, aquí verás qué se vende más."
          >
            <ol class="space-y-3">
              <li
                v-for="(product, index) in summary.topSellers"
                :key="product.id"
                class="flex items-center gap-3"
              >
                <span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">
                  {{ index + 1 }}
                </span>
                <ProductImage
                  :src="product.image"
                  :alt="`Imagen de ${product.name}`"
                  img-class="h-10 w-10 shrink-0 rounded-lg bg-stone-100 object-cover"
                />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold text-stone-900">{{ product.name }}</p>
                  <p class="text-xs text-stone-500">
                    {{ product.unitsSold }} uds · {{ currency(product.revenue) }}
                  </p>
                </div>
                <RouterLink
                  :to="{ name: 'products-edit', params: { id: product.id } }"
                  class="text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Editar
                </RouterLink>
              </li>
            </ol>
          </DashboardPanel>
        </div>

        <DashboardPanel
          title="Ofertas vigentes"
          subtitle="Cupones activos hoy"
          :empty="summary.activeOffers.length === 0"
          empty-title="No hay ofertas activas"
          empty-message="Los cupones activos aparecerán aquí."
        >
          <ul class="grid gap-3 md:grid-cols-2 xl:grid-cols-3" role="list">
            <li
              v-for="offer in summary.activeOffers"
              :key="offer.code"
              class="flex items-center justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50 p-4"
            >
              <div class="min-w-0">
                <p class="truncate font-semibold text-stone-900">{{ offer.name }}</p>
                <p class="mt-0.5 text-xs text-stone-500">{{ offerValidity(offer) }}</p>
                <span class="mt-2 inline-block rounded-md bg-white px-2 py-0.5 font-mono text-xs font-bold text-stone-700 ring-1 ring-stone-200">
                  {{ offer.code }}
                </span>
              </div>
              <span class="shrink-0 rounded-2xl bg-emerald-600 px-3 py-2 text-lg font-extrabold text-white">
                −{{ offer.discountPercentage }}%
              </span>
            </li>
          </ul>
        </DashboardPanel>

        <DashboardPanel
          title="Últimos agregados"
          subtitle="Verifica que los productos nuevos se cargaron bien"
          :empty="summary.recentProducts.length === 0"
          empty-title="Todavía no has agregado productos"
        >
          <template #actions>
            <LinkButton to="products-new" variant="outline">Agregar producto</LinkButton>
          </template>

          <ul class="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6" role="list">
            <li
              v-for="product in summary.recentProducts"
              :key="product.id"
              class="group flex flex-col overflow-hidden rounded-xl border border-stone-200 bg-white"
            >
              <ProductImage
                :src="product.image"
                :alt="`Imagen de ${product.name}`"
                img-class="aspect-square w-full object-cover"
              />
              <div class="flex flex-1 flex-col gap-1 p-3">
                <p class="line-clamp-2 text-sm font-semibold text-stone-900">{{ product.name }}</p>
                <p class="text-sm font-bold text-stone-900">{{ currency(product.price) }}</p>
                <p class="text-xs text-stone-500">{{ product.availability }} disp.</p>
                <RouterLink
                  :to="{ name: 'products-edit', params: { id: product.id } }"
                  class="mt-auto pt-2 text-xs font-semibold text-emerald-700 hover:underline"
                >
                  Editar
                </RouterLink>
              </div>
            </li>
          </ul>
        </DashboardPanel>
      </template>
    </template>
  </section>
</template>
