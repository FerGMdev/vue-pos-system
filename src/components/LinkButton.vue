<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps({
  to: { type: [String, Object], required: true },
  variant: { type: String, default: "primary" },
  block: { type: Boolean, default: false },
});

const variants = {
  primary: "bg-green-600 text-white hover:bg-green-700",
  secondary: "bg-slate-700 text-white hover:bg-slate-800",
  outline:
    "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "text-slate-700 hover:bg-slate-100",
};

const classes = computed(() => [
  "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
  variants[props.variant] || variants.primary,
  props.block ? "w-full" : "",
]);

const target = computed(() =>
  typeof props.to === "string" ? { name: props.to } : props.to
);
</script>

<template>
  <RouterLink :to="target" :class="classes">
    <slot />
  </RouterLink>
</template>
