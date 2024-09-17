<script setup></script>

<template>
  <div class="flex justify-between p-1 border-b border-slate-300">
    <dt class="font-semibold">
      <slot name="label"></slot>
    </dt>
    <dd class="font-bold">
      <slot></slot>
    </dd>
  </div>
</template>

<style lang="css" scoped></style>
