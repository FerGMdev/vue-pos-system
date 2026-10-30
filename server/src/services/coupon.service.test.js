import { describe, expect, it } from "vitest";
import { AppError } from "../utils/errors.js";
import { createCouponService } from "./coupon.service.js";

const coupons = [
  { code: "10DESCUENTO", percentage: 0.1, active: true },
  { code: "OFF", percentage: 0.5, active: false },
];

describe("coupon service", () => {
  const service = createCouponService(coupons);

  it("normalizes case and whitespace", () => {
    expect(service.validate("  10descuento ")).toEqual({
      code: "10DESCUENTO",
      percentage: 0.1,
      discountPercentage: 10,
    });
  });

  it("rejects unknown coupons", () => {
    expect(() => service.getCoupon("NOPE")).toThrow(AppError);
    try {
      service.getCoupon("NOPE");
    } catch (error) {
      expect(error.code).toBe("INVALID_COUPON");
      expect(error.status).toBe(400);
    }
  });

  it("rejects inactive coupons", () => {
    expect(() => service.getCoupon("OFF")).toThrow("Cupón no válido");
  });
});
