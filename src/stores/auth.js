import { computed, ref } from "vue";
import { defineStore } from "pinia";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  firebaseAuth,
  firebaseConfigError,
  isFirebaseConfigured,
} from "@/config/firebase";

function mapAuthError(error) {
  switch (error?.code) {
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "Correo o contraseña incorrectos.";
    case "auth/invalid-email":
      return "El correo electrónico no es válido.";
    case "auth/user-disabled":
      return "Esta cuenta está deshabilitada.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos e intenta de nuevo.";
    case "auth/network-request-failed":
      return "No se pudo conectar con Firebase. Revisa tu conexión.";
    default:
      return error?.message || "No se pudo iniciar sesión.";
  }
}

export const useAuthStore = defineStore("auth", () => {
  const user = ref(null);
  const role = ref(null);
  const initialized = ref(false);
  const loading = ref(false);
  const error = ref("");
  let initPromise = null;

  async function applyUser(firebaseUser, { forceRefresh = false } = {}) {
    if (!firebaseUser) {
      user.value = null;
      role.value = null;
      return;
    }

    const token = await firebaseUser.getIdTokenResult(forceRefresh);
    user.value = {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
    };
    role.value = token.claims.role ?? (token.claims.admin === true ? "admin" : null);
  }

  function init() {
    if (initialized.value) return Promise.resolve();
    if (initPromise) return initPromise;

    initPromise = new Promise((resolve) => {
      if (!isFirebaseConfigured || !firebaseAuth) {
        error.value = firebaseConfigError;
        initialized.value = true;
        resolve();
        return;
      }

      onAuthStateChanged(
        firebaseAuth,
        async (firebaseUser) => {
          try {
            await applyUser(firebaseUser);
          } catch (authError) {
            error.value = mapAuthError(authError);
            user.value = null;
            role.value = null;
          } finally {
            if (!initialized.value) {
              initialized.value = true;
              resolve();
            }
          }
        },
        (authError) => {
          error.value = mapAuthError(authError);
          if (!initialized.value) {
            initialized.value = true;
            resolve();
          }
        }
      );
    });

    return initPromise;
  }

  async function login(email, password) {
    error.value = "";

    if (!isFirebaseConfigured || !firebaseAuth) {
      error.value = firebaseConfigError;
      return { success: false, message: error.value };
    }

    loading.value = true;
    try {
      const credential = await signInWithEmailAndPassword(
        firebaseAuth,
        email.trim(),
        password
      );
      await applyUser(credential.user, { forceRefresh: true });
      return { success: true };
    } catch (authError) {
      error.value = mapAuthError(authError);
      return { success: false, message: error.value };
    } finally {
      loading.value = false;
    }
  }

  async function logout() {
    error.value = "";
    try {
      if (firebaseAuth) await signOut(firebaseAuth);
    } finally {
      user.value = null;
      role.value = null;
    }
  }

  async function handleUnauthorized() {
    if (!firebaseAuth?.currentUser) return;
    try {
      await signOut(firebaseAuth);
    } catch {
      // The local session is cleared even if the network call fails.
    } finally {
      user.value = null;
      role.value = null;
    }
  }

  if (typeof window !== "undefined") {
    window.addEventListener("pos:unauthorized", handleUnauthorized);
  }

  const isAuthenticated = computed(() => Boolean(user.value));
  const isAdmin = computed(() => role.value === "admin");
  const isCashier = computed(() => role.value === "cashier");

  return {
    user,
    role,
    initialized,
    loading,
    error,
    init,
    login,
    logout,
    isAuthenticated,
    isAdmin,
    isCashier,
  };
});
