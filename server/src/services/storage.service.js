import { logger } from "../utils/logger.js";

const PRODUCT_IMAGE_PREFIX = "products/";

function isSafeProductImagePath(path) {
  return (
    typeof path === "string" &&
    path.startsWith(PRODUCT_IMAGE_PREFIX) &&
    !path.includes("..") &&
    !path.includes("\\")
  );
}

export function createStorageService({ bucket }) {
  async function deleteImage(path) {
    if (!bucket || !isSafeProductImagePath(path)) return false;

    try {
      await bucket.file(path).delete({ ignoreNotFound: true });
      return true;
    } catch (error) {
      // A failed image cleanup must not break the product operation.
      logger.warn({ err: error, path }, "No se pudo eliminar la imagen");
      return false;
    }
  }

  return { deleteImage, isSafeProductImagePath };
}
