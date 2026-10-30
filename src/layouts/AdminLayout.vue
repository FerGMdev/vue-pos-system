<script setup>
import { RouterView } from "vue-router";
import AdminNav from "@/components/AdminNav.vue";
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <AdminNav />
    <main class="mx-auto max-w-7xl px-4 py-10 lg:px-8">
      <RouterView />
    </main>
  </div>
</template>
