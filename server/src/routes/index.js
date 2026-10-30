import { Router } from "express";
import { z } from "zod";
import { createCouponController } from "../controllers/coupon.controller.js";
import { createDashboardController } from "../controllers/dashboard.controller.js";
import { createProductController } from "../controllers/product.controller.js";
import { createSaleController } from "../controllers/sale.controller.js";
import { createSystemController } from "../controllers/system.controller.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import {
  couponCodeSchema,
  checkoutSchema,
  salesDateSchema,
} from "../schemas/sale.schema.js";
import {
  createProductSchema,
  productIdSchema,
  updateProductSchema,
} from "../schemas/product.schema.js";

const productIdParams = z.object({ id: productIdSchema }).strict();
const salesQuery = z.object({ date: salesDateSchema }).strict();

export function createApiRouter({ services, auth, config }) {
  const router = Router();

  const systemController = createSystemController({ config });
  const productController = createProductController({
    productService: services.productService,
  });
  const saleController = createSaleController({
    saleService: services.saleService,
  });
  const couponController = createCouponController({
    couponService: services.couponService,
  });
  const dashboardController = createDashboardController({
    dashboardService: services.dashboardService,
  });

  const checkoutLimiter = createRateLimiter({
    max: config.checkoutRateLimitMax,
    code: "CHECKOUT_RATE_LIMITED",
    message: "Demasiados intentos de venta. Espera un momento.",
  });
  const couponLimiter = createRateLimiter({
    max: 20,
    code: "COUPON_RATE_LIMITED",
    message: "Demasiados intentos de cupón. Espera un momento.",
  });

  router.get("/health", systemController.health);
  router.get("/config", systemController.config);

  router.get("/auth/me", auth.requireAuth, systemController.me);

  router.post(
    "/coupons/validate",
    couponLimiter,
    validate({ body: couponCodeSchema }),
    couponController.validate
  );

  router.get("/products", productController.list);
  router.get(
    "/products/:id",
    validate({ params: productIdParams }),
    productController.get
  );
  router.post(
    "/products",
    auth.requireAuth,
    auth.requireRole("admin"),
    validate({ body: createProductSchema }),
    productController.create
  );
  router.patch(
    "/products/:id",
    auth.requireAuth,
    auth.requireRole("admin"),
    validate({ params: productIdParams, body: updateProductSchema }),
    productController.update
  );
  router.delete(
    "/products/:id",
    auth.requireAuth,
    auth.requireRole("admin"),
    validate({ params: productIdParams }),
    productController.remove
  );

  router.post(
    "/sales/checkout",
    checkoutLimiter,
    auth.requireAuth,
    validate({ body: checkoutSchema }),
    saleController.checkout
  );
  router.get(
    "/sales",
    auth.requireAuth,
    auth.requireRole("admin"),
    validate({ query: salesQuery }),
    saleController.listByDate
  );

  router.get(
    "/dashboard/summary",
    auth.requireAuth,
    auth.requireRole("admin"),
    dashboardController.summary
  );

  return router;
}
