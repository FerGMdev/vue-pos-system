import { describe, expect, it, vi } from "vitest";
import { createProductService } from "./product.service.js";

function createFakes() {
  const existing = {
    id: "p1",
    name: "Producto",
    price: 10,
    availability: 5,
    category: 1,
    image: "https://example.com/old.jpg",
    imagePath: "products/old.jpg",
  };

  const productRepository = {
    findAll: vi.fn(async () => [existing]),
    findById: vi.fn(async (id) => (id === "p1" ? existing : null)),
    create: vi.fn(async (data) => ({ id: "new", ...data })),
    update: vi.fn(async (id, data) => ({ ...existing, ...data })),
    delete: vi.fn(async () => undefined),
  };
  const storageService = { deleteImage: vi.fn(async () => true) };

  return {
    existing,
    productRepository,
    storageService,
    service: createProductService({ productRepository, storageService }),
  };
}

describe("product service", () => {
  it("sorts products by category and name", async () => {
    const { service, productRepository } = createFakes();
    productRepository.findAll.mockResolvedValueOnce([
      { id: "b", category: 2, name: "B" },
      { id: "a", category: 1, name: "Z" },
      { id: "c", category: 1, name: "A" },
    ]);

    const result = await service.list();
    expect(result.map((product) => product.id)).toEqual(["c", "a", "b"]);
  });

  it("throws a 404 when a product does not exist", async () => {
    const { service } = createFakes();
    await expect(service.getById("missing")).rejects.toMatchObject({
      status: 404,
      code: "PRODUCT_NOT_FOUND",
    });
  });

  it("deletes the previous image when the image changes", async () => {
    const { service, storageService } = createFakes();

    await service.update("p1", { imagePath: "products/new.jpg" });

    expect(storageService.deleteImage).toHaveBeenCalledWith("products/old.jpg");
  });

  it("does not delete the image when only the price changes", async () => {
    const { service, storageService } = createFakes();

    await service.update("p1", { price: 20 });

    expect(storageService.deleteImage).not.toHaveBeenCalled();
  });

  it("deletes the image when the product is removed", async () => {
    const { service, storageService, productRepository } = createFakes();

    await service.remove("p1");

    expect(productRepository.delete).toHaveBeenCalledWith("p1");
    expect(storageService.deleteImage).toHaveBeenCalledWith("products/old.jpg");
  });
});
