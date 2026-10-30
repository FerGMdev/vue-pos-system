<script setup>
import { storeToRefs } from "pinia";
import { RouterLink, useRouter } from "vue-router";
import LinkButton from "./LinkButton.vue";
import Logo from "./Logo.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

const authStore = useAuthStore();
const uiStore = useUiStore();
const router = useRouter();
const { isAuthenticated, isAdmin, user } = storeToRefs(authStore);

async function logout() {
  await authStore.logout();
  uiStore.info("Sesión cerrada.");
  router.push({ name: "shop" });
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-stone-200/80 bg-white/85 backdrop-blur-md">
    <div class="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
      <Logo tone="light" />

      <nav class="flex items-center gap-1 sm:gap-2" aria-label="Navegación principal">
        <RouterLink
          v-if="isAdmin"
          :to="{ name: 'products' }"
          class="rounded-full px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
        >
          Administración
        </RouterLink>

        <template v-if="isAuthenticated">
          <span
            class="hidden max-w-[12rem] truncate rounded-full bg-stone-100 px-3 py-1.5 text-xs font-medium text-stone-600 md:inline-block"
          >
            {{ user?.email }}
          </span>
          <button
            type="button"
            class="rounded-full px-4 py-2 text-sm font-semibold text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
            @click="logout"
          >
            Cerrar sesión
          </button>
        </template>
        <LinkButton v-else to="login" variant="primary">Iniciar sesión</LinkButton>
      </nav>
    </div>
  </header>
</template>
