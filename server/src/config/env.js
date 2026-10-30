import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import {
  DEFAULT_MAX_ITEM_QUANTITY,
  DEFAULT_TAX_RATE,
  DEFAULT_TIMEZONE,
} from "../../../shared/constants.js";

// server/.env is independent from the Vite .env file.
dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  TRUST_PROXY: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
  FIREBASE_PROJECT_ID: z.string().trim().optional(),
  FIREBASE_STORAGE_BUCKET: z.string().trim().optional(),
  FIREBASE_SERVICE_ACCOUNT_JSON: z.string().trim().optional(),
  GOOGLE_APPLICATION_CREDENTIALS: z.string().trim().optional(),
  TAX_RATE: z.coerce.number().min(0).max(1).default(DEFAULT_TAX_RATE),
  MAX_ITEM_QUANTITY: z.coerce
    .number()
    .int()
    .positive()
    .default(DEFAULT_MAX_ITEM_QUANTITY),
  TIMEZONE: z.string().trim().default(DEFAULT_TIMEZONE),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(15 * 60 * 1000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  CHECKOUT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(30),
  DASHBOARD_CACHE_TTL_MS: z.coerce.number().int().min(0).default(60_000),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    "Configuración inválida del servidor:",
    parsed.error.flatten().fieldErrors
  );
  throw new Error("Variables de entorno del servidor inválidas");
}

const raw = parsed.data;
const corsOrigins =
  raw.CORS_ORIGIN === "*"
    ? "*"
    : raw.CORS_ORIGIN.split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);

export const env = Object.freeze({
  ...raw,
  isProduction: raw.NODE_ENV === "production",
  isTest: raw.NODE_ENV === "test",
  corsOrigins,
  storageBucket:
    raw.FIREBASE_STORAGE_BUCKET ||
    (raw.FIREBASE_PROJECT_ID
      ? `${raw.FIREBASE_PROJECT_ID}.appspot.com`
      : undefined),
});
