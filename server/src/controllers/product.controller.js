import { asyncHandler } from "../utils/asyncHandler.js";

export function createProductController({ productService }) {
  return {
    list: asyncHandler(async (_req, res) => {
      res.json({ data: await productService.list() });
    }),

    get: asyncHandler(async (req, res) => {
      res.json({ data: await productService.getById(req.params.id) });
    }),

    create: asyncHandler(async (req, res) => {
      const product = await productService.create(req.body);
      res.status(201).json({ data: product });
    }),

    update: asyncHandler(async (req, res) => {
      const product = await productService.update(req.params.id, req.body);
      res.json({ data: product });
    }),

    remove: asyncHandler(async (req, res) => {
      await productService.remove(req.params.id);
      res.status(204).send();
    }),
  };
}
