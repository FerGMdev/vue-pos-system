import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  PRODUCT_CATEGORIES,
} from "../../shared/constants.js";
import { createApp } from "./app.js";
import { COUPONS } from "./config/coupons.js";
import { env } from "./config/env.js";
import {
  assertFirebaseConfiguration,
  getDb,
  getFirebaseAuth,
  getStorageBucket,
} from "./config/firebase.js";
import { createDailySummaryRepository } from "./repositories/firestore/daily-summary.repository.js";
import { createProductRepository } from "./repositories/firestore/product.repository.js";
import { createSaleRepository } from "./repositories/firestore/sale.repository.js";
import { createCouponService } from "./services/coupon.service.js";
import { createDashboardService } from "./services/dashboard.service.js";
import { createProductService } from "./services/product.service.js";
import { createSaleService } from "./services/sale.service.js";
import { createStorageService } from "./services/storage.service.js";
import { logger } from "./utils/logger.js";

function start() {
  assertFirebaseConfiguration();

  const db = getDb();
  const auth = getFirebaseAuth();
  const storageService = createStorageService({ bucket: getStorageBucket() });

  const couponService = createCouponService(COUPONS);
  const productService = createProductService({
    productRepository: createProductRepository(db),
    storageService,
  });
  const saleService = createSaleService({
    productRepository: createProductRepository(db),
    saleRepository: createSaleRepository(db),
    couponService,
    config: {
      taxRate: env.TAX_RATE,
      maxItemQuantity: env.MAX_ITEM_QUANTITY,
      timezone: env.TIMEZONE,
    },
  });

  const dashboardService = createDashboardService({
    productRepository: createProductRepository(db),
    dailySummaryRepository: createDailySummaryRepository(db),
    coupons: COUPONS,
    config: { timezone: env.TIMEZONE },
    cacheTtlMs: env.DASHBOARD_CACHE_TTL_MS,
  });

  const app = createApp({
    services: { productService, saleService, couponService, dashboardService },
    auth,
    logger,
    config: {
      taxRate: env.TAX_RATE,
      maxItemQuantity: env.MAX_ITEM_QUANTITY,
      currency: DEFAULT_CURRENCY,
      locale: DEFAULT_LOCALE,
      timezone: env.TIMEZONE,
      categories: PRODUCT_CATEGORIES,
      checkoutRateLimitMax: env.CHECKOUT_RATE_LIMIT_MAX,
    },
  });

  const server = app.listen(env.PORT, () => {
    logger.info(
      {
        port: env.PORT,
        nodeEnv: env.NODE_ENV,
        corsOrigins: env.corsOrigins,
        taxRate: env.TAX_RATE,
        timezone: env.TIMEZONE,
      },
      "POS API iniciada"
    );
  });

  server.on("error", (error) => {
    logger.fatal({ err: error }, "No se pudo iniciar el servidor");
    process.exit(1);
  });

  let shuttingDown = false;
  function shutdown(signal) {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "Cerrando servidor...");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

try {
  start();
} catch (error) {
  logger.fatal({ err: error }, "Error de arranque");
  process.exit(1);
}
