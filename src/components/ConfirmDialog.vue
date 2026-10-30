<script setup>
import { nextTick, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, default: "Confirmar acción" },
  message: { type: String, default: "" },
  confirmLabel: { type: String, default: "Confirmar" },
  cancelLabel: { type: String, default: "Cancelar" },
  loading: { type: Boolean, default: false },
  danger: { type: Boolean, default: false },
});
const emit = defineEmits(["confirm", "cancel"]);
const confirmButton = ref(null);

function close() {
  if (props.loading) return;
  emit("cancel");
}

function onKeydown(event) {
  if (event.key === "Escape") close();
}

watch(
  () => props.open,
  async (open) => {
    if (open) {
      window.addEventListener("keydown", onKeydown);
      await nextTick();
      confirmButton.value?.focus();
    } else {
      window.removeEventListener("keydown", onKeydown);
    }
  },
  { immediate: true }
);

onBeforeUnmount(() => window.removeEventListener("keydown", onKeydown));
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      @click.self="close"
    >
      <div
        class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <h2 id="confirm-dialog-title" class="text-xl font-bold text-slate-800">
          {{ title }}
        </h2>
        <p
          v-if="message"
          id="confirm-dialog-message"
          class="mt-3 text-sm text-slate-600"
        >
          {{ message }}
        </p>

        <div class="mt-6 flex justify-end gap-3">
          <button
            type="button"
            class="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            :disabled="loading"
            @click="close"
          >
            {{ cancelLabel }}
          </button>
          <button
            ref="confirmButton"
            type="button"
            class="rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            :class="danger ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'"
            :disabled="loading"
            @click="$emit('confirm')"
          >
            {{ loading ? "Procesando..." : confirmLabel }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
