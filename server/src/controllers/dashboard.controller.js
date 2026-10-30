import { asyncHandler } from "../utils/asyncHandler.js";

export function createDashboardController({ dashboardService }) {
  return {
    summary: asyncHandler(async (_req, res) => {
      res.json({ data: await dashboardService.getSummary() });
    }),
  };
}
