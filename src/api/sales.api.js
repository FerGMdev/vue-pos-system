import { apiRequest } from "./client";

export function checkoutSale(payload) {
  return apiRequest("/sales/checkout", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

export function listSalesByDate(dateKey) {
  return apiRequest(`/sales?date=${encodeURIComponent(dateKey)}`, {
    auth: true,
  });
}
