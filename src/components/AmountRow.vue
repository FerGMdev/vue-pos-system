<script setup>
defineProps({
  label: { type: String, required: true },
});
</script>

<template>
  <div class="flex justify-between border-b border-slate-200 p-1">
    <dt class="font-semibold">
      <slot name="label">{{ label }}</slot>
    </dt>
    <dd class="font-bold">
      <slot />
    </dd>
  </div>
</template>
