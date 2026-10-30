import { asyncHandler } from "../utils/asyncHandler.js";

export function createSystemController({ config }) {
  return {
    health: (_req, res) => {
      res.json({
        data: {
          status: "ok",
          uptime: Math.round(process.uptime()),
          timestamp: new Date().toISOString(),
        },
      });
    },

    config: (_req, res) => {
      res.json({
        data: {
          taxRate: config.taxRate,
          maxItemQuantity: config.maxItemQuantity,
          currency: config.currency,
          locale: config.locale,
          timezone: config.timezone,
          categories: config.categories,
        },
      });
    },

    me: asyncHandler(async (req, res) => {
      res.json({ data: req.user });
    }),
  };
}
