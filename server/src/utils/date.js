import { AppError } from "./errors.js";

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Return YYYY-MM-DD for a Date in a specific IANA timezone. */
export function getDateKey(date = new Date(), timeZone = "UTC") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

export function isValidDateKey(value) {
  if (typeof value !== "string" || !DATE_KEY_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/** Shift a YYYY-MM-DD key by a number of days (calendar arithmetic, no timezone). */
export function shiftDateKey(dateKey, days) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day + days));
  return shifted.toISOString().slice(0, 10);
}

export function assertDateKey(value, field = "date") {
  if (!isValidDateKey(value)) {
    throw AppError.badRequest(
      `${field} debe tener el formato YYYY-MM-DD y ser una fecha válida`,
      "INVALID_DATE"
    );
  }
  return value;
}

/**
 * Convert the legacy dd/mm/yyyy string used by the original app into an ISO
 * timestamp. Used only by the migration script.
 */
export function legacyDateToIso(value) {
  if (typeof value !== "string") return null;
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return date.toISOString();
}
