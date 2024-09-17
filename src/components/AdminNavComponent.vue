<script setup>
import { RouterLink } from "vue-router";
import LinkComponent from "./LinkComponent.vue";
import LogoComponent from "./LogoComponent.vue";
</script>

<template>
  <header
    class="px-10 py-5 bg-slate-700 flex justify-between absolute top-0 w-full z-10"
  >
    <div>
      <LogoComponent />
    </div>
    <nav class="flex gap-4">
      <RouterLink
        :to="{ name: 'products' }"
        class="rounded-md px-4 py-2 text-white font-bold hover:bg-slate-600"
      >
        Productos
      </RouterLink>
      <RouterLink
        :to="{ name: 'sales' }"
        class="rounded-md px-4 py-2 text-white font-bold hover:bg-slate-600"
      >
        Ventas
      </RouterLink>
      <LinkComponent to="shop">Ir a la tienda</LinkComponent>
    </nav>
  </header>
</template>

<style lang="css" scoped></style>
