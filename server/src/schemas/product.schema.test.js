import { describe, expect, it } from "vitest";
import { createProductSchema, updateProductSchema } from "./product.schema.js";

const validProduct = {
  name: "Sudadera",
  price: 49,
  availability: 5,
  category: 1,
  image: "https://example.com/image.jpg",
  imagePath: "products/image.jpg",
};

describe("product schemas", () => {
  it("accepts a valid product and coerces numeric strings", () => {
    const parsed = createProductSchema.parse({
      ...validProduct,
      price: "49.50",
      availability: "5",
      category: "1",
    });

    expect(parsed.price).toBe(49.5);
    expect(parsed.availability).toBe(5);
    expect(parsed.category).toBe(1);
  });

  it("rejects invalid categories, prices and availability", () => {
    expect(() =>
      createProductSchema.parse({ ...validProduct, category: 99 })
    ).toThrow();
    expect(() =>
      createProductSchema.parse({ ...validProduct, price: -1 })
    ).toThrow();
    expect(() =>
      createProductSchema.parse({ ...validProduct, availability: 1.5 })
    ).toThrow();
  });

  it("does not inject empty image fields on partial updates", () => {
    const parsed = updateProductSchema.parse({ price: 20 });
    expect(parsed).toEqual({ price: 20 });
  });

  it("rejects empty updates", () => {
    expect(() => updateProductSchema.parse({})).toThrow();
  });

  it("rejects image paths outside products/", () => {
    expect(() =>
      createProductSchema.parse({
        ...validProduct,
        imagePath: "secrets/private.jpg",
      })
    ).toThrow();
  });
});
