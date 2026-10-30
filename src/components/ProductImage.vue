<script setup>
import { ref, watch } from "vue";
import placeholder from "@/assets/product-placeholder.svg";

const props = defineProps({
  src: { type: String, default: "" },
  alt: { type: String, default: "Imagen del producto" },
  imgClass: { type: String, default: "" },
});

const failed = ref(false);
watch(
  () => props.src,
  () => {
    failed.value = false;
  }
);
</script>

<template>
  <img
    v-if="src && !failed"
    :src="src"
    :alt="alt"
    :class="imgClass"
    loading="lazy"
    @error="failed = true"
  />
  <img v-else :src="placeholder" :alt="alt" :class="imgClass" />
</template>
