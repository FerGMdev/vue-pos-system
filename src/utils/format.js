export function formatCurrency(
  value,
  { currency = "MXN", locale = "es-MX" } = {}
) {
  const amount = Number(value);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(Number.isFinite(amount) ? amount : 0);
}

export function formatDateKey(dateKey, locale = "es-MX") {
  if (typeof dateKey !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return "";
  }

  const date = new Date(`${dateKey}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/** "hace 2 minutos", "hace 3 días". Falls back to the absolute time for old values. */
export function formatRelativeTime(value, locale = "es-MX", now = new Date()) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  const units = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];

  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) {
      return formatter.format(Math.round(seconds / size), unit);
    }
  }
  return formatter.format(0, "minute");
}

export function formatDateTime(value, locale = "es-MX") {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleString(locale, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

/**
 * vue-tailwind-datepicker works with DD/MM/YYYY. The API uses YYYY-MM-DD.
 */
export function displayDateToDateKey(value) {
  if (typeof value !== "string") return "";

  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "";

  const [, day, month, year] = match;
  const paddedDay = day.padStart(2, "0");
  const paddedMonth = month.padStart(2, "0");
  const date = new Date(`${year}-${paddedMonth}-${paddedDay}T12:00:00`);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== Number(year) ||
    date.getMonth() !== Number(month) - 1 ||
    date.getDate() !== Number(day)
  ) {
    return "";
  }

  return `${year}-${paddedMonth}-${paddedDay}`;
}
