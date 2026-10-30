/**
 * Business constants shared by the API and the web client.
 * Keeping them here avoids the classic "client says 10%, server says 16%" bug.
 */

export const DEFAULT_TAX_RATE = 0.1;
export const DEFAULT_MAX_ITEM_QUANTITY = 5;
export const DEFAULT_CURRENCY = "MXN";
export const DEFAULT_LOCALE = "es-MX";
export const DEFAULT_TIMEZONE = "America/Mexico_City";

/** Products with this many units or fewer appear in the restock list. */
export const LOW_STOCK_THRESHOLD = 3;

export const PRODUCT_CATEGORIES = Object.freeze([
  { id: 1, name: "Sudadera" },
  { id: 2, name: "Tenis" },
  { id: 3, name: "Lentes" },
]);

export const PRODUCT_CATEGORY_IDS = Object.freeze(
  PRODUCT_CATEGORIES.map((category) => category.id)
);

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = Object.freeze([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);
