<script setup>
defineProps({
  message: { type: String, default: "" },
  retryLabel: { type: String, default: "Reintentar" },
  retrying: { type: Boolean, default: false },
});
defineEmits(["retry"]);
</script>

<template>
  <div
    class="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
    role="alert"
  >
    <span>{{ message }}</span>
    <button
      type="button"
      class="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
      :disabled="retrying"
      @click="$emit('retry')"
    >
      {{ retrying ? "Reintentando..." : retryLabel }}
    </button>
  </div>
</template>
