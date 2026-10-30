import { assertFirebaseConfiguration, getDb } from "../src/config/firebase.js";
import { createDailySummary } from "../src/utils/dailySummary.js";
import { logger } from "../src/utils/logger.js";

/**
 * Builds dailySummaries/{dateKey} from existing sales. Each day is rewritten
 * from scratch, so running it again does not double count.
 *
 * Run `npm run migrate:sales` first if some sales still have legacy dates.
 * Dry run by default. Pass --apply to write.
 *
 * Sales committed while this script runs may be missed. Run it during low
 * traffic, or re-run it after the checkout is quiet.
 */
const apply = process.argv.includes("--apply");
const BATCH_LIMIT = 400;

function toSale(data) {
  return {
    items: Array.isArray(data.items) ? data.items : [],
    total: Number(data.total) || 0,
  };
}

async function main() {
  assertFirebaseConfiguration();
  const db = getDb();
  const snapshot = await db.collection("sales").get();

  const salesByDay = new Map();
  let skipped = 0;

  for (const document of snapshot.docs) {
    const data = document.data();
    if (!data.dateKey) {
      skipped += 1;
      continue;
    }

    const group = salesByDay.get(data.dateKey) ?? [];
    group.push(toSale(data));
    salesByDay.set(data.dateKey, group);
  }

  const summaries = [...salesByDay.entries()].map(([dateKey, sales]) =>
    createDailySummary(dateKey, sales)
  );

  logger.info(
    { sales: snapshot.size, days: summaries.length, skipped, applied: apply },
    apply ? "Escribiendo resúmenes diarios" : "Simulación. Usa --apply para escribir."
  );

  if (!apply) return;

  const now = new Date().toISOString();
  for (let index = 0; index < summaries.length; index += BATCH_LIMIT) {
    const batch = db.batch();
    for (const summary of summaries.slice(index, index + BATCH_LIMIT)) {
      batch.set(db.collection("dailySummaries").doc(summary.dateKey), {
        ...summary,
        updatedAt: now,
      });
    }
    await batch.commit();
  }

  logger.info({ days: summaries.length }, "Resúmenes diarios generados");
}

main().catch((error) => {
  logger.fatal({ err: error }, "No se pudo generar los resúmenes diarios");
  process.exit(1);
});
