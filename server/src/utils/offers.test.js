import { describe, expect, it } from "vitest";
import { isCouponActiveOn, toOffer } from "./offers.js";

describe("offer validity", () => {
  it("treats coupons without dates as permanent while active", () => {
    expect(isCouponActiveOn({ active: true }, "2026-10-29")).toBe(true);
  });

  it("respects inclusive start and end dates", () => {
    const coupon = { active: true, startsAt: "2026-10-01", endsAt: "2026-10-31" };

    expect(isCouponActiveOn(coupon, "2026-09-30")).toBe(false);
    expect(isCouponActiveOn(coupon, "2026-10-01")).toBe(true);
    expect(isCouponActiveOn(coupon, "2026-10-31")).toBe(true);
    expect(isCouponActiveOn(coupon, "2026-11-01")).toBe(false);
  });

  it("never shows inactive coupons", () => {
    expect(isCouponActiveOn({ active: false }, "2026-10-29")).toBe(false);
  });

  it("maps a coupon to an offer with a display name", () => {
    expect(
      toOffer({ code: "10DESCUENTO", percentage: 0.1, active: true })
    ).toEqual({
      code: "10DESCUENTO",
      name: "10DESCUENTO",
      percentage: 0.1,
      discountPercentage: 10,
      startsAt: null,
      endsAt: null,
    });
  });
});
