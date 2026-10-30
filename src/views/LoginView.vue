<script setup>
import { computed, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { firebaseConfigError, isFirebaseConfigured } from "@/config/firebase";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

const authStore = useAuthStore();
const uiStore = useUiStore();
const route = useRoute();
const router = useRouter();
const localError = ref("");

const redirectTarget = computed(() => {
  const requested = route.query.redirect;
  if (typeof requested === "string" && requested.startsWith("/") && !requested.startsWith("//")) {
    return requested;
  }
  return authStore.isAdmin ? { name: "dashboard" } : { name: "shop" };
});

const configError = computed(() =>
  isFirebaseConfigured ? "" : firebaseConfigError
);

async function submitHandler(data) {
  localError.value = "";
  const result = await authStore.login(data.email, data.password);

  if (!result.success) {
    localError.value = result.message;
    return;
  }

  uiStore.success("Sesión iniciada.");
  router.replace(redirectTarget.value);
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
    <div class="w-full max-w-md">
      <div class="mb-6 text-center">
        <RouterLink :to="{ name: 'shop' }" class="text-3xl font-black text-slate-800">
          Moda Urbana <span class="text-green-600">POS</span>
        </RouterLink>
        <p class="mt-2 text-sm text-slate-500">
          Acceso para personal autorizado
        </p>
      </div>

      <div class="rounded-lg bg-white p-6 shadow-md sm:p-8">
        <h1 class="text-2xl font-bold text-slate-800">Iniciar sesión</h1>
        <p class="mt-1 text-sm text-slate-500">
          Usa la cuenta creada en Firebase Authentication.
        </p>

        <p
          v-if="configError"
          class="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800"
          role="alert"
        >
          {{ configError }}
        </p>

        <FormKit
          type="form"
          submit-label="Entrar"
          :disabled="authStore.loading"
          incomplete-message="Revisa tu correo y contraseña."
          @submit="submitHandler"
        >
          <FormKit
            label="Correo electrónico"
            name="email"
            type="email"
            placeholder="usuario@ejemplo.com"
            autocomplete="email"
            validation="required|email"
            :validation-messages="{
              required: 'El correo es requerido',
              email: 'Ingresa un correo válido',
            }"
          />

          <FormKit
            label="Contraseña"
            name="password"
            type="password"
            placeholder="Tu contraseña"
            autocomplete="current-password"
            validation="required|length:6"
            :validation-messages="{
              required: 'La contraseña es requerida',
              length: 'La contraseña debe tener al menos 6 caracteres',
            }"
          />

          <p
            v-if="localError"
            class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
            role="alert"
          >
            {{ localError }}
          </p>
        </FormKit>

        <p class="mt-4 text-center text-sm text-slate-500">
          <RouterLink :to="{ name: 'shop' }" class="font-semibold text-green-700 hover:underline">
            Volver a la tienda
          </RouterLink>
        </p>
      </div>
    </div>
  </div>
</template>
