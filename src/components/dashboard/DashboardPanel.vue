<script setup>
defineProps({
  title: { type: String, required: true },
  subtitle: { type: String, default: "" },
  empty: { type: Boolean, default: false },
  emptyTitle: { type: String, default: "Sin información" },
  emptyMessage: { type: String, default: "" },
});
</script>

<template>
  <section class="flex h-full flex-col rounded-2xl border border-stone-200/70 bg-white p-5 shadow-sm sm:p-6">
    <header class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-lg font-extrabold tracking-tight text-stone-900">{{ title }}</h2>
        <p v-if="subtitle" class="mt-0.5 text-sm text-stone-500">{{ subtitle }}</p>
      </div>
      <slot name="actions" />
    </header>

    <div v-if="empty" class="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
      <span class="grid h-10 w-10 place-items-center rounded-full bg-stone-100 text-lg" aria-hidden="true">✓</span>
      <p class="font-semibold text-stone-800">{{ emptyTitle }}</p>
      <p v-if="emptyMessage" class="max-w-xs text-sm text-stone-500">{{ emptyMessage }}</p>
      <slot name="empty-action" />
    </div>

    <div v-else class="mt-4 flex-1">
      <slot />
    </div>
  </section>
</template>
