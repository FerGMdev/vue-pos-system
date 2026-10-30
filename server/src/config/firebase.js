import {
  applicationDefault,
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { env } from "./env.js";

let cachedApp;
let cachedDb;

function isEmulatorMode() {
  return Boolean(
    process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.FIREBASE_AUTH_EMULATOR_HOST ||
      process.env.FIREBASE_STORAGE_EMULATOR_HOST
  );
}

function buildAppOptions() {
  if (env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    let credentials;
    try {
      credentials = JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON no contiene un JSON válido. Revisa server/.env"
      );
    }

    return {
      credential: cert(credentials),
      projectId: env.FIREBASE_PROJECT_ID || credentials.project_id,
      storageBucket: env.storageBucket,
    };
  }

  if (isEmulatorMode()) {
    return {
      projectId: env.FIREBASE_PROJECT_ID || "demo-pos",
      storageBucket: env.storageBucket || "demo-pos.appspot.com",
    };
  }

  return {
    credential: applicationDefault(),
    projectId: env.FIREBASE_PROJECT_ID,
    storageBucket: env.storageBucket,
  };
}

export function assertFirebaseConfiguration() {
  if (
    !isEmulatorMode() &&
    !env.FIREBASE_SERVICE_ACCOUNT_JSON &&
    !env.GOOGLE_APPLICATION_CREDENTIALS
  ) {
    throw new Error(
      "Faltan credenciales de Firebase. Define FIREBASE_SERVICE_ACCOUNT_JSON " +
        "o GOOGLE_APPLICATION_CREDENTIALS en server/.env, o usa los emuladores."
    );
  }
}

export function getFirebaseApp() {
  if (cachedApp) return cachedApp;
  if (getApps().length > 0) {
    cachedApp = getApp();
    return cachedApp;
  }
  cachedApp = initializeApp(buildAppOptions());
  return cachedApp;
}

export function getDb() {
  if (cachedDb) return cachedDb;
  cachedDb = getFirestore(getFirebaseApp());
  cachedDb.settings({ ignoreUndefinedProperties: true });
  return cachedDb;
}

export function getFirebaseAuth() {
  return getAuth(getFirebaseApp());
}

export function getStorageBucket() {
  if (!env.storageBucket) return null;
  return getStorage(getFirebaseApp()).bucket(env.storageBucket);
}
