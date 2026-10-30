import { apiRequest } from "./client";

export function validateCoupon(code) {
  return apiRequest("/coupons/validate", {
    method: "POST",
    body: { code },
  });
}
