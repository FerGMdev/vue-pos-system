<script setup>
import AdminNavComponent from "@/components/AdminNavComponent.vue";
</script>

<template>
  <AdminNavComponent />

  <div class="py-32 container mx-auto lg:min-h-screen">
    <RouterView />
  </div>
</template>

<style lang="css" scoped></style>
