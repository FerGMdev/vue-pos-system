/**
 * Coupons live on the server on purpose: the client may display a discount,
 * but only the API decides whether a coupon exists and how much it is worth.
 *
 * To add or disable a coupon, edit this file. No frontend deploy is required.
 *
 * Optional fields:
 * - name: label shown to the administrator in "Ofertas vigentes".
 * - startsAt / endsAt: YYYY-MM-DD validity window (inclusive). Omit for no limit.
 */
export const COUPONS = Object.freeze([
  { code: "10DESCUENTO", name: "Descuento 10 %", percentage: 0.1, active: true },
  { code: "20DESCUENTO", name: "Descuento 20 %", percentage: 0.2, active: true },
  { code: "30DESCUENTO", name: "Descuento 30 %", percentage: 0.3, active: true },
]);
