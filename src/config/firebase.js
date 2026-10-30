import { getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectStorageEmulator, getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

export const firebaseConfigError =
  "Firebase no está configurado. Revisa las variables VITE_FIREBASE_* en tu archivo .env.";

function createFirebaseApp() {
  if (!isFirebaseConfigured) return null;
  return getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
}

export const firebaseApp = createFirebaseApp();
export const firebaseAuth = firebaseApp ? getAuth(firebaseApp) : null;
export const firebaseStorage = firebaseApp ? getStorage(firebaseApp) : null;

if (import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true" && firebaseApp) {
  const authUrl =
    import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_URL || "http://127.0.0.1:9099";
  const storageHost =
    import.meta.env.VITE_FIREBASE_STORAGE_EMULATOR_HOST || "127.0.0.1:9199";
  const [storageHostname, storagePort] = storageHost.split(":");

  connectAuthEmulator(firebaseAuth, authUrl, { disableWarnings: true });
  connectStorageEmulator(
    firebaseStorage,
    storageHostname,
    Number(storagePort || 9199)
  );
}
