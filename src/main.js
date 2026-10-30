import "./assets/main.css";

import { createApp } from "vue";
import { createPinia } from "pinia";
import { plugin, defaultConfig } from "@formkit/vue";
import formkitConfig from "../formkit.config";
import App from "./App.vue";
import router from "./router";
import { useAuthStore } from "@/stores/auth";
import { useConfigStore } from "@/stores/config";
import { useUiStore } from "@/stores/ui";

async function bootstrap() {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(plugin, defaultConfig(formkitConfig));

  const authStore = useAuthStore(pinia);
  const configStore = useConfigStore(pinia);
  const uiStore = useUiStore(pinia);

  // The app can render with safe defaults if the API is temporarily down.
  await Promise.allSettled([authStore.init(), configStore.load()]);

  app.config.errorHandler = (error, _instance, info) => {
    console.error(`[POS] Error no controlado (${info})`, error);
    uiStore.error(
      "Ocurrió un error inesperado en la aplicación. Recarga la página si el problema continúa."
    );
  };

  window.addEventListener("unhandledrejection", (event) => {
    console.error("[POS] Promesa rechazada sin manejar", event.reason);
  });

  app.use(router);
  app.mount("#app");
}

bootstrap().catch((error) => {
  console.error("[POS] No se pudo iniciar la aplicación", error);
  const root = document.querySelector("#app");
  if (root) {
    root.innerHTML = `
      <div style="font-family: system-ui, sans-serif; max-width: 40rem; margin: 4rem auto; padding: 1.5rem; border: 1px solid #fecaca; border-radius: 0.5rem; background: #fef2f2; color: #7f1d1d;">
        <h1 style="margin-top: 0; font-size: 1.25rem;">No se pudo iniciar la aplicación</h1>
        <p style="margin-bottom: 0;">Revisa la configuración del entorno y recarga la página.</p>
      </div>
    `;
  }
});
