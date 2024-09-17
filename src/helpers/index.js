export function formatCurency(price) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);
}

export const getCurrentDate = () => {
  const date = new Date();
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

export const getLocalizedDate = (dateString) => {
  // Split the date string into components
  const [day, month, year] = dateString.split("/").map(Number);

  // Create a new Date object (months are 0-indexed in JavaScript)
  const date = new Date(year, month - 1, day);

  // Return the localized string for the day and month
  return date.toLocaleString("default", { day: "numeric", month: "long" });
};
