import { describe, expect, it } from "vitest";
import {
  createDailySummary,
  getSaleSummaryDeltas,
  rankProductSales,
} from "./dailySummary.js";

const saleA = {
  total: 198,
  items: [
    { id: "p1", price: 100, quantity: 2 },
    { id: "p2", price: 50, quantity: 1 },
  ],
};
const saleB = {
  total: 110,
  items: [{ id: "p1", price: 100, quantity: 1 }],
};

describe("daily summary", () => {
  it("returns deltas for one sale with cents and per-product totals", () => {
    expect(getSaleSummaryDeltas(saleA)).toEqual({
      salesCount: 1,
      totalCents: 19800,
      products: {
        p1: { units: 2, revenueCents: 20000 },
        p2: { units: 1, revenueCents: 5000 },
      },
    });
  });

  it("builds a day summary from several sales", () => {
    const summary = createDailySummary("2026-10-29", [saleA, saleB]);

    expect(summary.dateKey).toBe("2026-10-29");
    expect(summary.salesCount).toBe(2);
    expect(summary.totalCents).toBe(30800);
    expect(summary.products.p1).toEqual({ units: 3, revenueCents: 30000 });
    expect(summary.products.p2).toEqual({ units: 1, revenueCents: 5000 });
  });

  it("ranks products by units, then revenue, across days", () => {
    const summaries = [
      createDailySummary("2026-10-28", [saleA]),
      createDailySummary("2026-10-29", [saleB]),
      { dateKey: "2026-10-27", products: { p3: { units: 3, revenueCents: 9000 } } },
    ];

    const ranking = rankProductSales(summaries);

    expect(ranking.map((row) => row.productId)).toEqual(["p1", "p3", "p2"]);
    expect(ranking[0]).toEqual({ productId: "p1", units: 3, revenue: 300 });
  });

  it("tolerates summaries without products", () => {
    expect(rankProductSales([{ dateKey: "2026-10-01" }, null])).toEqual([]);
  });
});
