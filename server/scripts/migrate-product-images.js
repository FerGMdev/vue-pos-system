import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { assertFirebaseConfiguration, getDb } from "../src/config/firebase.js";
import { logger } from "../src/utils/logger.js";

/**
 * Replaces Firebase Storage URLs with local files served from public/products.
 * Use this when Storage is not available (for example, the Spark plan).
 *
 * Dry run by default. Pass --apply to write changes.
 */
const apply = process.argv.includes("--apply");
const publicDir = fileURLToPath(new URL("../../public", import.meta.url));

function toLocalPath(imageUrl) {
  const decoded = decodeURIComponent(String(imageUrl ?? ""));
  const match = decoded.match(/products\/([A-Za-z0-9._-]+\.(?:jpg|jpeg|png|webp))/i);
  if (!match) return null;

  const localPath = `/products/${match[1]}`;
  return existsSync(`${publicDir}${localPath}`) ? localPath : null;
}

async function main() {
  assertFirebaseConfiguration();
  const db = getDb();
  const snapshot = await db.collection("products").get();

  let updated = 0;
  let skipped = 0;
  const batch = db.batch();

  for (const document of snapshot.docs) {
    const current = document.data().image ?? "";
    const localPath = toLocalPath(current);

    if (!localPath || current === localPath) {
      skipped += 1;
      logger.warn({ id: document.id, image: current }, "Sin archivo local, se omite");
      continue;
    }

    logger.info({ id: document.id, from: current, to: localPath }, apply ? "Actualizando" : "Simulación");
    if (apply) {
      batch.update(document.ref, { image: localPath, updatedAt: new Date().toISOString() });
    }
    updated += 1;
  }

  if (apply && updated > 0) await batch.commit();

  logger.info(
    { total: snapshot.size, updated, skipped, applied: apply },
    apply ? "Migración de imágenes finalizada" : "Simulación finalizada. Usa --apply para escribir."
  );
}

main().catch((error) => {
  logger.fatal({ err: error }, "No se pudo migrar las imágenes");
  process.exit(1);
});
