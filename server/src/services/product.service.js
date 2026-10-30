import { AppError } from "../utils/errors.js";

function sortProducts(products) {
  return [...products].sort((left, right) => {
    if (left.category !== right.category) return left.category - right.category;
    return left.name.localeCompare(right.name, "es");
  });
}

export function createProductService({ productRepository, storageService }) {
  async function list() {
    return sortProducts(await productRepository.findAll());
  }

  async function getById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw AppError.notFound("Producto no encontrado", "PRODUCT_NOT_FOUND");
    }
    return product;
  }

  async function create(input) {
    return productRepository.create(input);
  }

  async function update(id, input) {
    const existing = await getById(id);
    const updated = await productRepository.update(id, input);

    const imagePathWasSent = Object.prototype.hasOwnProperty.call(
      input,
      "imagePath"
    );
    const nextImagePath = imagePathWasSent
      ? input.imagePath
      : existing.imagePath;

    if (
      existing.imagePath &&
      nextImagePath !== existing.imagePath &&
      storageService
    ) {
      await storageService.deleteImage(existing.imagePath);
    }

    return updated;
  }

  async function remove(id) {
    const existing = await getById(id);
    await productRepository.delete(id);

    if (existing.imagePath && storageService) {
      await storageService.deleteImage(existing.imagePath);
    }

    return { id };
  }

  return { list, getById, create, update, remove };
}
