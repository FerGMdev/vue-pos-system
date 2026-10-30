import { products } from "../data/products.js";
import { assertFirebaseConfiguration, getDb } from "../src/config/firebase.js";
import { logger } from "../src/utils/logger.js";

const replace = process.argv.includes("--replace");

async function deleteCollection(db, collection) {
  const snapshot = await collection.get();
  let batch = db.batch();
  let pending = 0;

  for (const document of snapshot.docs) {
    batch.delete(document.ref);
    pending += 1;
    if (pending === 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();
  return snapshot.size;
}

async function main() {
  assertFirebaseConfiguration();
  const db = getDb();
  const collection = db.collection("products");
  const existing = await collection.count().get();
  const total = existing.data().count;

  if (total > 0 && !replace) {
    logger.warn(
      { total },
      "La colección products ya tiene documentos. Usa --replace para reemplazarlos."
    );
    return;
  }

  if (total > 0 && replace) {
    const deleted = await deleteCollection(db, collection);
    logger.info({ deleted }, "Productos anteriores eliminados");
  }

  const now = new Date().toISOString();
  let batch = db.batch();
  let pending = 0;

  for (const product of products) {
    const reference = collection.doc();
    batch.set(reference, {
      name: product.name,
      price: Number(product.price),
      availability: Number(product.availability),
      category: Number(product.category),
      image: "",
      imagePath: "",
      createdAt: now,
      updatedAt: now,
    });
    pending += 1;

    if (pending === 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();
  logger.info({ inserted: products.length }, "Catálogo de ejemplo cargado");
}

main().catch((error) => {
  logger.fatal({ err: error }, "No se pudo ejecutar el seed");
  process.exit(1);
});
