<script setup>
import LinkButton from "@/components/LinkButton.vue";
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4">
    <div class="max-w-md rounded-lg bg-white p-8 text-center shadow-md">
      <p class="text-4xl" aria-hidden="true">🔒</p>
      <h1 class="mt-4 text-2xl font-bold text-slate-800">Acceso restringido</h1>
      <p class="mt-2 text-sm text-slate-600">
        Tu cuenta no tiene permisos de administrador. Si necesitas acceso,
        solicita que asignen el rol correspondiente.
      </p>
      <div class="mt-6">
        <LinkButton to="shop">Volver a la tienda</LinkButton>
      </div>
    </div>
  </div>
</template>
