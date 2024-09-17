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
    <div>
      <LinkComponent to="admin">Admin</LinkComponent>
    </div>
  </header>
</template>

<style lang="css" scoped></style>
