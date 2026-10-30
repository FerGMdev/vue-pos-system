<script setup>
import { storeToRefs } from "pinia";
import { RouterLink, useRouter } from "vue-router";
import Logo from "./Logo.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

const authStore = useAuthStore();
const uiStore = useUiStore();
const router = useRouter();
const { user } = storeToRefs(authStore);

async function logout() {
  await authStore.logout();
  uiStore.info("Sesión cerrada.");
  router.push({ name: "shop" });
}

const linkClass =
  "rounded-md px-4 py-2 text-sm font-bold text-white hover:bg-slate-600";
</script>

<template>
  <header class="sticky top-0 z-30 bg-slate-700 px-6 py-4 shadow-md lg:px-10">
    <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
      <Logo />

      <nav class="flex flex-wrap items-center gap-2" aria-label="Navegación de administración">
        <RouterLink
          :to="{ name: 'dashboard' }"
          :class="linkClass"
          active-class="bg-slate-600"
        >
          Inicio
        </RouterLink>
        <RouterLink
          :to="{ name: 'products' }"
          :class="linkClass"
          active-class="bg-slate-600"
        >
          Productos
        </RouterLink>
        <RouterLink
          :to="{ name: 'sales' }"
          :class="linkClass"
          active-class="bg-slate-600"
        >
          Ventas
        </RouterLink>
        <RouterLink :to="{ name: 'shop' }" :class="linkClass">
          Ir a la tienda
        </RouterLink>

        <span class="hidden px-2 text-sm text-slate-300 md:inline">
          {{ user?.email }}
        </span>
        <button
          type="button"
          class="rounded-md px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
          @click="logout"
        >
          Cerrar sesión
        </button>
      </nav>
    </div>
  </header>
</template>
