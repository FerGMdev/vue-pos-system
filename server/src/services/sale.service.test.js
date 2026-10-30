import { describe, expect, it, vi } from "vitest";
import { createSaleService } from "./sale.service.js";
import { createCouponService } from "./coupon.service.js";
import { AppError } from "../utils/errors.js";

const products = [
  {
    id: "p1",
    name: "Sudadera",
    price: 100,
    availability: 10,
    category: 1,
    image: "https://example.com/1.jpg",
  },
  {
    id: "p2",
    name: "Tenis",
    price: 50,
    availability: 2,
    category: 2,
    image: "",
  },
];

function createFakes() {
  const productRepository = {
    findByIds: vi.fn(async (ids) =>
      products.filter((product) => ids.includes(product.id))
    ),
  };
  const saleRepository = {
    createAtomic: vi.fn(async ({ saleId, sale }) => ({
      sale: { id: saleId, ...sale },
      duplicate: false,
    })),
    findByDateKey: vi.fn(async () => []),
  };
  const couponService = createCouponService([
    { code: "10DESCUENTO", percentage: 0.1, active: true },
  ]);

  const service = createSaleService({
    productRepository,
    saleRepository,
    couponService,
    config: {
      taxRate: 0.1,
      maxItemQuantity: 5,
      timezone: "America/Mexico_City",
    },
    now: () => new Date("2026-10-29T18:00:00.000Z"),
  });

  return { service, productRepository, saleRepository };
}

describe("sale service", () => {
  it("uses server-side prices and calculates totals with a coupon", async () => {
    const { service, saleRepository } = createFakes();

    const result = await service.checkout(
      {
        checkoutId: "0b9d0b9e-6f1a-4d8e-9f4e-1f0b2c3d4e5f",
        items: [{ id: "p1", quantity: 2 }],
        couponCode: "10descuento",
      },
      { uid: "user-1" }
    );

    expect(result.sale.subtotal).toBe(200);
    expect(result.sale.discount).toBe(20);
    expect(result.sale.taxes).toBe(18);
    expect(result.sale.total).toBe(198);
    expect(result.sale.couponCode).toBe("10DESCUENTO");
    expect(result.sale.createdBy).toBe("user-1");
    expect(result.sale.dateKey).toBe("2026-10-29");
    expect(result.sale.items[0]).toEqual({
      id: "p1",
      name: "Sudadera",
      price: 100,
      quantity: 2,
      image: "https://example.com/1.jpg",
    });

    expect(saleRepository.createAtomic).toHaveBeenCalledOnce();
  });

  it("rejects quantities above the configured limit", async () => {
    const { service } = createFakes();

    await expect(
      service.checkout(
        {
          checkoutId: "0b9d0b9e-6f1a-4d8e-9f4e-1f0b2c3d4e5f",
          items: [{ id: "p1", quantity: 6 }],
        },
        { uid: "user-1" }
      )
    ).rejects.toMatchObject({ code: "QUANTITY_LIMIT_EXCEEDED", status: 400 });
  });

  it("rejects products that no longer exist", async () => {
    const { service } = createFakes();

    await expect(
      service.checkout(
        {
          checkoutId: "0b9d0b9e-6f1a-4d8e-9f4e-1f0b2c3d4e5f",
          items: [{ id: "missing", quantity: 1 }],
        },
        { uid: "user-1" }
      )
    ).rejects.toMatchObject({ code: "PRODUCT_NOT_FOUND", status: 409 });
  });

  it("requires an authenticated user", async () => {
    const { service } = createFakes();

    await expect(
      service.checkout(
        {
          checkoutId: "0b9d0b9e-6f1a-4d8e-9f4e-1f0b2c3d4e5f",
          items: [{ id: "p1", quantity: 1 }],
        },
        null
      )
    ).rejects.toBeInstanceOf(AppError);
  });

  it("validates the date before querying sales", async () => {
    const { service } = createFakes();

    await expect(service.listByDate("29/10/2026")).rejects.toMatchObject({
      code: "INVALID_DATE",
      status: 400,
    });
  });
});
