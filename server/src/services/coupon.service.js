import { AppError } from "../utils/errors.js";

export function normalizeCouponCode(code) {
  return String(code ?? "").trim().toUpperCase();
}

/**
 * @param {Array<{code: string, percentage: number, active: boolean}>} coupons
 */
export function createCouponService(coupons) {
  const byCode = new Map(
    coupons.map((coupon) => [normalizeCouponCode(coupon.code), coupon])
  );

  function getCoupon(code) {
    const normalized = normalizeCouponCode(code);
    const coupon = byCode.get(normalized);

    if (!coupon || !coupon.active) {
      throw AppError.badRequest("Cupón no válido", "INVALID_COUPON");
    }

    return coupon;
  }

  function validate(code) {
    const coupon = getCoupon(code);
    return {
      code: coupon.code,
      percentage: coupon.percentage,
      discountPercentage: Math.round(coupon.percentage * 100),
    };
  }

  return { getCoupon, validate };
}
