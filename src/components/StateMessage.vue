<script setup>
defineProps({
  variant: {
    type: String,
    default: "loading",
    validator: (value) => ["loading", "error", "empty", "info"].includes(value),
  },
  title: { type: String, default: "" },
  message: { type: String, default: "" },
  retryLabel: { type: String, default: "Reintentar" },
});
defineEmits(["retry"]);
</script>

<template>
  <div
    class="flex flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-6 py-10 text-center shadow-sm"
    :role="variant === 'error' ? 'alert' : 'status'"
  >
    <span
      v-if="variant === 'loading'"
      class="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-green-600"
      aria-hidden="true"
    ></span>
    <span v-else-if="variant === 'error'" class="text-3xl" aria-hidden="true">⚠️</span>
    <span v-else-if="variant === 'empty'" class="text-3xl" aria-hidden="true">📦</span>
    <span v-else class="text-3xl" aria-hidden="true">ℹ️</span>

    <h2 v-if="title" class="text-lg font-semibold text-slate-800">{{ title }}</h2>
    <p v-if="message" class="max-w-md text-sm text-slate-600">{{ message }}</p>

    <button
      v-if="variant === 'error'"
      type="button"
      class="mt-2 rounded-md bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
      @click="$emit('retry')"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>
