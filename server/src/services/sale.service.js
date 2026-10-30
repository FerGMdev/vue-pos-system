import { calculateTotals } from "../../../shared/pricing.js";
import { AppError } from "../utils/errors.js";
import { assertDateKey, getDateKey } from "../utils/date.js";
import { normalizeCouponCode } from "./coupon.service.js";

export function createSaleService({
  productRepository,
  saleRepository,
  couponService,
  config,
  now = () => new Date(),
}) {
  async function checkout({ checkoutId, items, couponCode }, user) {
    if (!user?.uid) {
      throw AppError.unauthorized();
    }

    const requestedItems = items.map((item) => ({
      id: item.id,
      quantity: Number(item.quantity),
    }));

    if (requestedItems.length === 0) {
      throw AppError.badRequest("El carrito está vacío", "EMPTY_CART");
    }

    const invalidQuantity = requestedItems.find(
      (item) =>
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > config.maxItemQuantity
    );
    if (invalidQuantity) {
      throw AppError.badRequest(
        `La cantidad debe ser un entero entre 1 y ${config.maxItemQuantity}`,
        "QUANTITY_LIMIT_EXCEEDED",
        { productId: invalidQuantity.id, max: config.maxItemQuantity }
      );
    }

    const products = await productRepository.findByIds(
      requestedItems.map((item) => item.id)
    );
    const productsById = new Map(
      products.map((product) => [product.id, product])
    );

    const lineItems = requestedItems.map((item) => {
      const product = productsById.get(item.id);
      if (!product) {
        throw AppError.conflict(
          "Uno de los productos ya no está disponible",
          "PRODUCT_NOT_FOUND",
          { productId: item.id }
        );
      }

      return {
        id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      };
    });

    const normalizedCouponCode = normalizeCouponCode(couponCode);
    const coupon = normalizedCouponCode
      ? couponService.getCoupon(normalizedCouponCode)
      : null;

    const totals = calculateTotals({
      items: lineItems,
      taxRate: config.taxRate,
      discountPercentage: coupon?.percentage ?? 0,
    });

    const createdAt = now();
    const sale = {
      items: lineItems,
      subtotal: totals.subtotal,
      discount: totals.discount,
      taxes: totals.taxes,
      total: totals.total,
      couponCode: coupon?.code ?? null,
      discountPercentage: coupon?.percentage ?? 0,
      createdAt: createdAt.toISOString(),
      dateKey: getDateKey(createdAt, config.timezone),
      createdBy: user.uid,
    };

    return saleRepository.createAtomic({
      saleId: checkoutId,
      sale,
      items: lineItems,
    });
  }

  async function listByDate(dateKey) {
    assertDateKey(dateKey, "date");
    return saleRepository.findByDateKey(dateKey);
  }

  return { checkout, listByDate };
}
