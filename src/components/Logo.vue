<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps({
  tone: {
    type: String,
    default: "dark",
    validator: (value) => ["dark", "light"].includes(value),
  },
});

const titleClass = computed(() =>
  props.tone === "light" ? "text-stone-900" : "text-white"
);
const subtitleClass = computed(() =>
  props.tone === "light" ? "text-emerald-700" : "text-green-400"
);
</script>

<template>
  <RouterLink
    :to="{ name: 'shop' }"
    class="group flex items-center gap-3"
    aria-label="Ir a la tienda"
  >
    <span
      class="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-sm font-black tracking-tight text-white shadow-sm transition group-hover:bg-emerald-700"
      aria-hidden="true"
    >
      MU
    </span>
    <span class="leading-tight">
      <span class="block text-base font-extrabold tracking-tight" :class="titleClass">
        Moda Urbana
      </span>
      <span
        class="block text-[11px] font-semibold uppercase tracking-[0.18em]"
        :class="subtitleClass"
      >
        Punto de venta
      </span>
    </span>
  </RouterLink>
</template>
