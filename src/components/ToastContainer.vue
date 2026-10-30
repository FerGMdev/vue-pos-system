<script setup>
import { storeToRefs } from "pinia";
import { useUiStore } from "@/stores/ui";

const uiStore = useUiStore();
const { toasts } = storeToRefs(uiStore);

const styles = {
  success: "border-green-500 bg-green-50 text-green-900",
  error: "border-red-500 bg-red-50 text-red-900",
  warning: "border-amber-500 bg-amber-50 text-amber-900",
  info: "border-slate-400 bg-white text-slate-800",
};
</script>

<template>
  <div
    class="pointer-events-none fixed right-4 top-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2"
    aria-live="polite"
    aria-atomic="false"
  >
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="pointer-events-auto flex items-start gap-3 rounded-lg border-l-4 px-4 py-3 shadow-lg"
        :class="styles[toast.type] || styles.info"
        :role="toast.type === 'error' ? 'alert' : 'status'"
      >
        <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
        <button
          type="button"
          class="rounded p-1 text-current opacity-60 hover:opacity-100"
          aria-label="Cerrar notificación"
          @click="uiStore.dismiss(toast.id)"
        >
          ✕
        </button>
      </div>
    </TransitionGroup>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.2s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(1rem);
}
</style>
