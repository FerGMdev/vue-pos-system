import { LOW_STOCK_THRESHOLD } from "../../../shared/constants.js";
import { fromCents, rankProductSales } from "../utils/dailySummary.js";
import { getDateKey, shiftDateKey } from "../utils/date.js";
import { isCouponActiveOn, toOffer } from "../utils/offers.js";

export const TOP_SELLER_WINDOW_DAYS = 30;
export const TOP_SELLER_LIMIT = 5;
export const RESTOCK_LIST_LIMIT = 10;
export const RECENT_PRODUCT_LIMIT = 6;

function toCompactProduct(product) {
  return {
    id: product.id,
    name: product.name,
    image: product.image ?? "",
    price: product.price,
    availability: product.availability,
    category: product.category,
    createdAt: product.createdAt ?? null,
  };
}

function byNewestFirst(left, right) {
  return String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""));
}

function byLowestStockFirst(left, right) {
  return (
    left.availability - right.availability ||
    String(left.name).localeCompare(String(right.name), "es")
  );
}

/**
 * Aggregates what the administrator needs on the home screen. Reads products once
 * and at most TOP_SELLER_WINDOW_DAYS small summary documents, never the sales.
 *
 * The result is cached for cacheTtlMs so reloading the home screen does not
 * repeat the reads.
 */
export function createDashboardService({
  productRepository,
  dailySummaryRepository,
  coupons,
  config,
  now = () => new Date(),
  cacheTtlMs = 60_000,
}) {
  let cache = null;

  async function compute() {
    const currentDate = now();
    const today = getDateKey(currentDate, config.timezone);
    const windowStart = shiftDateKey(today, -(TOP_SELLER_WINDOW_DAYS - 1));

    const [products, todaySummary, windowSummaries] = await Promise.all([
      productRepository.findAll(),
      dailySummaryRepository.findByDateKey(today),
      dailySummaryRepository.findRange(windowStart, today),
    ]);

    const productsById = new Map(products.map((product) => [product.id, product]));

    const outOfStock = products.filter((product) => product.availability <= 0);
    const restock = products
      .filter(
        (product) =>
          product.availability >= 0 &&
          product.availability <= LOW_STOCK_THRESHOLD
      )
      .sort(byLowestStockFirst);

    const topSellers = rankProductSales(windowSummaries)
      .filter(({ productId }) => productsById.has(productId))
      .slice(0, TOP_SELLER_LIMIT)
      .map(({ productId, units, revenue }) => {
        const product = productsById.get(productId);
        return {
          id: product.id,
          name: product.name,
          image: product.image ?? "",
          unitsSold: units,
          revenue,
        };
      });

    return {
      generatedAt: currentDate.toISOString(),
      date: today,
      totalProducts: products.length,
      today: {
        salesCount: Number(todaySummary?.salesCount) || 0,
        total: fromCents(todaySummary?.totalCents),
      },
      stock: {
        outOfStock: outOfStock.length,
        lowStock: restock.length - outOfStock.length,
        lowStockThreshold: LOW_STOCK_THRESHOLD,
      },
      restockProducts: restock.slice(0, RESTOCK_LIST_LIMIT).map(toCompactProduct),
      topSellers,
      topSellersPeriodDays: TOP_SELLER_WINDOW_DAYS,
      activeOffers: coupons
        .filter((coupon) => isCouponActiveOn(coupon, today))
        .map(toOffer),
      recentProducts: [...products]
        .sort(byNewestFirst)
        .slice(0, RECENT_PRODUCT_LIMIT)
        .map(toCompactProduct),
    };
  }

  async function getSummary() {
    if (cache && cache.expiresAt > Date.now()) return cache.value;

    const value = await compute();
    cache = { value, expiresAt: Date.now() + cacheTtlMs };
    return value;
  }

  return { getSummary };
}
