import { asyncHandler } from "../utils/asyncHandler.js";

export function createCouponController({ couponService }) {
  return {
    validate: asyncHandler(async (req, res) => {
      res.json({ data: couponService.validate(req.body.code) });
    }),
  };
}
