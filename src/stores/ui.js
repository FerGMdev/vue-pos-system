import { ref } from "vue";
import { defineStore } from "pinia";

let nextId = 1;
const timers = new Map();

export const useUiStore = defineStore("ui", () => {
  const toasts = ref([]);

  function dismiss(id) {
    toasts.value = toasts.value.filter((toast) => toast.id !== id);
    const timer = timers.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.delete(id);
    }
  }

  function notify(message, { type = "info", timeout = 4500 } = {}) {
    const id = nextId++;
    toasts.value.push({ id, message, type });

    if (timeout > 0) {
      timers.set(
        id,
        setTimeout(() => dismiss(id), timeout)
      );
    }

    return id;
  }

  return {
    toasts,
    dismiss,
    notify,
    success: (message, options) =>
      notify(message, { ...options, type: "success" }),
    error: (message, options) =>
      notify(message, { ...options, type: "error", timeout: 6500 }),
    warning: (message, options) =>
      notify(message, { ...options, type: "warning" }),
    info: (message, options) => notify(message, { ...options, type: "info" }),
  };
});
