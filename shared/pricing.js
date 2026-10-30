import { DEFAULT_TAX_RATE } from "./constants.js";

/** Coerce user/API input to a finite number without throwing. */
export function toNumber(value, fallback = 0) {
  if (typeof value === "string") {
    const normalized = value.trim().replace(",", ".");
    if (normalized === "") return fallback;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Money is rounded to cents using a single, shared rule. */
export function roundCurrency(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

/** Percentages are expressed as decimals: 0.1 === 10%. */
export function clampPercentage(value) {
  const parsed = toNumber(value);
  if (parsed <= 0) return 0;
  if (parsed >= 1) return 1;
  return parsed;
}

/**
 * Single source of truth for cart and sale totals.
 *
 * Business rules:
 * - Discounts apply to the subtotal (not to taxes).
 * - Taxes are calculated on the discounted subtotal.
 * - Every amount is rounded to cents before the next step.
 */
export function calculateTotals({
  items = [],
  taxRate = DEFAULT_TAX_RATE,
  discountPercentage = 0,
} = {}) {
  const subtotal = roundCurrency(
    items.reduce((accumulator, item) => {
      const price = Math.max(0, toNumber(item?.price));
      const quantity = Math.max(0, Math.trunc(toNumber(item?.quantity)));
      return accumulator + price * quantity;
    }, 0)
  );

  const discount = roundCurrency(subtotal * clampPercentage(discountPercentage));
  const taxableBase = roundCurrency(Math.max(0, subtotal - discount));
  const taxes = roundCurrency(taxableBase * clampPercentage(taxRate));
  const total = roundCurrency(taxableBase + taxes);

  return {
    subtotal,
    discount,
    taxableBase,
    taxes,
    total,
  };
}
