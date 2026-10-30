import { describe, expect, it } from "vitest";
import { calculateTotals, roundCurrency, toNumber } from "./pricing.js";

describe("pricing", () => {
  it("calculates subtotal, taxes and total for a simple cart", () => {
    const totals = calculateTotals({
      items: [{ price: 50, quantity: 2 }],
      taxRate: 0.1,
    });

    expect(totals).toEqual({
      subtotal: 100,
      discount: 0,
      taxableBase: 100,
      taxes: 10,
      total: 110,
    });
  });

  it("applies the discount before taxes", () => {
    const totals = calculateTotals({
      items: [{ price: 100, quantity: 1 }],
      taxRate: 0.1,
      discountPercentage: 0.1,
    });

    expect(totals.subtotal).toBe(100);
    expect(totals.discount).toBe(10);
    expect(totals.taxableBase).toBe(90);
    expect(totals.taxes).toBe(9);
    expect(totals.total).toBe(99);
  });

  it("rounds each step to cents", () => {
    const totals = calculateTotals({
      items: [
        { price: 10.005, quantity: 3 },
        { price: 0.1, quantity: 1 },
      ],
      taxRate: 0.16,
    });

    expect(totals.subtotal).toBe(30.12);
    expect(totals.taxes).toBe(4.82);
    expect(totals.total).toBe(34.94);
  });

  it("ignores invalid prices and quantities", () => {
    const totals = calculateTotals({
      items: [
        { price: "no-es-numero", quantity: 2 },
        { price: 10, quantity: -3 },
        { price: 20, quantity: "2" },
      ],
      taxRate: 0,
    });

    expect(totals.subtotal).toBe(40);
    expect(totals.total).toBe(40);
  });

  it("clamps out-of-range percentages", () => {
    const totals = calculateTotals({
      items: [{ price: 100, quantity: 1 }],
      taxRate: 2,
      discountPercentage: 2,
    });

    expect(totals.discount).toBe(100);
    expect(totals.taxes).toBe(0);
    expect(totals.total).toBe(0);
  });

  it("supports comma decimal separators", () => {
    expect(toNumber("12,50")).toBe(12.5);
    expect(roundCurrency(12.505)).toBe(12.51);
  });
});
