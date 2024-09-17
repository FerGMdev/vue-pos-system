<script setup>
import { RouterLink } from "vue-router";

const props = defineProps({
  to: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <RouterLink
    :to="{ name: to }"
    class="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 font-semibold transition-all duration-300"
  >
    <slot />
  </RouterLink>
</template>

<style lang="css" scoped></style>
