/**
 * Daily sales summaries are stored in dailySummaries/{dateKey}. Each checkout
 * increments them inside the same transaction that writes the sale, so reports
 * never need to read every sale of the month.
 *
 * Money is stored as integer cents to avoid floating-point drift over time.
 */

export function toCents(value) {
  return Math.round((Number(value) || 0) * 100);
}

export function fromCents(value) {
  return (Number(value) || 0) / 100;
}

/** Amounts to add to a day's summary for one committed sale. */
export function getSaleSummaryDeltas(sale) {
  const products = {};

  for (const item of sale.items ?? []) {
    const current = products[item.id] ?? { units: 0, revenueCents: 0 };
    current.units += Number(item.quantity) || 0;
    current.revenueCents += toCents(Number(item.price) * Number(item.quantity));
    products[item.id] = current;
  }

  return {
    salesCount: 1,
    totalCents: toCents(sale.total),
    products,
  };
}

/** Builds a complete daily summary from a list of sales (used by backfill and tests). */
export function createDailySummary(dateKey, sales) {
  const summary = { dateKey, salesCount: 0, totalCents: 0, products: {} };

  for (const sale of sales) {
    const deltas = getSaleSummaryDeltas(sale);
    summary.salesCount += deltas.salesCount;
    summary.totalCents += deltas.totalCents;

    for (const [productId, delta] of Object.entries(deltas.products)) {
      const current = summary.products[productId] ?? { units: 0, revenueCents: 0 };
      current.units += delta.units;
      current.revenueCents += delta.revenueCents;
      summary.products[productId] = current;
    }
  }

  return summary;
}

/**
 * Sums product units and gross revenue across daily summaries.
 * Returns every product sorted by units (then revenue). Callers decide the limit
 * after removing products that no longer exist.
 */
export function rankProductSales(summaries) {
  const totals = new Map();

  for (const summary of summaries) {
    for (const [productId, delta] of Object.entries(summary?.products ?? {})) {
      const current = totals.get(productId) ?? { units: 0, revenueCents: 0 };
      current.units += Number(delta.units) || 0;
      current.revenueCents += Number(delta.revenueCents) || 0;
      totals.set(productId, current);
    }
  }

  return [...totals.entries()]
    .map(([productId, total]) => ({
      productId,
      units: total.units,
      revenue: fromCents(total.revenueCents),
    }))
    .sort((left, right) => right.units - left.units || right.revenue - left.revenue);
}
