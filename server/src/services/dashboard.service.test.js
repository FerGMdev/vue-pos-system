import { describe, expect, it, vi } from "vitest";
import { createDashboardService } from "./dashboard.service.js";
import { createDailySummary } from "../utils/dailySummary.js";

const products = [
  { id: "p1", name: "Sudadera", price: 100, availability: 0, category: 1, image: "", createdAt: "2026-10-20T10:00:00.000Z" },
  { id: "p2", name: "Tenis", price: 50, availability: 2, category: 2, image: "", createdAt: "2026-10-28T10:00:00.000Z" },
  { id: "p3", name: "Lentes", price: 30, availability: 3, category: 3, image: "", createdAt: "2026-10-25T10:00:00.000Z" },
  { id: "p4", name: "Gorra", price: 20, availability: 40, category: 1, image: "", createdAt: "2026-10-29T10:00:00.000Z" },
];

function createFakes({ summaries = [], today = null, cacheTtlMs = 60_000 } = {}) {
  const productRepository = { findAll: vi.fn(async () => products) };
  const dailySummaryRepository = {
    findByDateKey: vi.fn(async () => today),
    findRange: vi.fn(async () => summaries),
  };

  const service = createDashboardService({
    productRepository,
    dailySummaryRepository,
    coupons: [
      { code: "10DESCUENTO", percentage: 0.1, active: true },
      { code: "OFF", percentage: 0.5, active: false },
    ],
    config: { timezone: "America/Mexico_City" },
    now: () => new Date("2026-10-29T18:00:00.000Z"),
    cacheTtlMs,
  });

  return { service, productRepository, dailySummaryRepository };
}

describe("dashboard service", () => {
  it("lists restock products with zero stock first", async () => {
    const { service } = createFakes();
    const summary = await service.getSummary();

    expect(summary.restockProducts.map((product) => product.id)).toEqual(["p1", "p2", "p3"]);
    expect(summary.stock).toEqual({ outOfStock: 1, lowStock: 2, lowStockThreshold: 3 });
    expect(summary.totalProducts).toBe(4);
  });

  it("returns the latest products first", async () => {
    const { service } = createFakes();
    const summary = await service.getSummary();

    expect(summary.recentProducts[0].id).toBe("p4");
    expect(summary.recentProducts[1].id).toBe("p2");
  });

  it("uses today's summary for sales and totals", async () => {
    const today = createDailySummary("2026-10-29", [
      { total: 198, items: [{ id: "p4", price: 20, quantity: 2 }] },
    ]);
    const { service } = createFakes({ today });
    const summary = await service.getSummary();

    expect(summary.today).toEqual({ salesCount: 1, total: 198 });
  });

  it("ranks top sellers and skips deleted products", async () => {
    const summaries = [
      createDailySummary("2026-10-28", [
        { total: 0, items: [{ id: "gone", price: 10, quantity: 9 }] },
        { total: 0, items: [{ id: "p2", price: 50, quantity: 4 }] },
      ]),
    ];
    const { service, dailySummaryRepository } = createFakes({ summaries });
    const summary = await service.getSummary();

    expect(dailySummaryRepository.findRange).toHaveBeenCalledWith("2026-09-30", "2026-10-29");
    expect(summary.topSellers).toEqual([
      { id: "p2", name: "Tenis", image: "", unitsSold: 4, revenue: 200 },
    ]);
    expect(summary.topSellersPeriodDays).toBe(30);
  });

  it("only returns offers that are active today", async () => {
    const { service } = createFakes();
    const summary = await service.getSummary();

    expect(summary.activeOffers.map((offer) => offer.code)).toEqual(["10DESCUENTO"]);
  });

  it("caches the summary to avoid repeated reads", async () => {
    const { service, productRepository } = createFakes();

    await service.getSummary();
    await service.getSummary();

    expect(productRepository.findAll).toHaveBeenCalledOnce();
  });
});
