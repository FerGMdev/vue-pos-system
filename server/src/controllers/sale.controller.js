import { asyncHandler } from "../utils/asyncHandler.js";

export function createSaleController({ saleService }) {
  return {
    checkout: asyncHandler(async (req, res) => {
      const result = await saleService.checkout(req.body, req.user);
      res
        .status(result.duplicate ? 200 : 201)
        .json({ data: result.sale, meta: { duplicate: result.duplicate } });
    }),

    listByDate: asyncHandler(async (req, res) => {
      const sales = await saleService.listByDate(req.query.date);
      res.json({ data: sales });
    }),
  };
}
