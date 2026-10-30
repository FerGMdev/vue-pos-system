/**
 * A coupon is an offer when it is active and the business date falls inside its
 * optional validity window. Missing dates mean "no limit on that side".
 * Dates are YYYY-MM-DD in the business timezone, so string comparison is safe.
 */
export function isCouponActiveOn(coupon, dateKey) {
  if (!coupon?.active) return false;
  if (coupon.startsAt && dateKey < coupon.startsAt) return false;
  if (coupon.endsAt && dateKey > coupon.endsAt) return false;
  return true;
}

export function toOffer(coupon) {
  return {
    code: coupon.code,
    name: coupon.name ?? coupon.code,
    percentage: coupon.percentage,
    discountPercentage: Math.round(coupon.percentage * 100),
    startsAt: coupon.startsAt ?? null,
    endsAt: coupon.endsAt ?? null,
  };
}
