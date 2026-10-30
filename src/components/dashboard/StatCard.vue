<script setup>
import { computed } from "vue";
import { RouterLink } from "vue-router";

const props = defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  hint: { type: String, default: "" },
  tone: {
    type: String,
    default: "neutral",
    validator: (value) => ["neutral", "success", "warning", "danger"].includes(value),
  },
  to: { type: [String, Object], default: null },
});

const accent = computed(
  () =>
    ({
      neutral: "bg-stone-900",
      success: "bg-emerald-600",
      warning: "bg-amber-500",
      danger: "bg-red-600",
    })[props.tone]
);

const cardClass =
  "group relative block overflow-hidden rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm transition duration-300";
const interactiveClass = "hover:-translate-y-0.5 hover:shadow-md";

const target = computed(() =>
  typeof props.to === "string" ? { name: props.to } : props.to
);
</script>

<template>
  <RouterLink v-if="to" :to="target" :class="[cardClass, interactiveClass]">
    <span class="absolute inset-y-0 left-0 w-1" :class="accent" aria-hidden="true"></span>
    <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">{{ label }}</p>
    <p class="mt-2 text-3xl font-extrabold tracking-tight text-stone-900 tabular-nums">
      {{ value }}
    </p>
    <p v-if="hint" class="mt-1 text-sm text-stone-500">{{ hint }}</p>
  </RouterLink>

  <div v-else :class="cardClass">
    <span class="absolute inset-y-0 left-0 w-1" :class="accent" aria-hidden="true"></span>
    <p class="text-xs font-semibold uppercase tracking-wide text-stone-500">{{ label }}</p>
    <p class="mt-2 text-3xl font-extrabold tracking-tight text-stone-900 tabular-nums">
      {{ value }}
    </p>
    <p v-if="hint" class="mt-1 text-sm text-stone-500">{{ hint }}</p>
  </div>
</template>
