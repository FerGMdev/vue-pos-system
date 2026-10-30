import { assertFirebaseConfiguration, getDb } from "../src/config/firebase.js";
import { env } from "../src/config/env.js";
import { getDateKey, legacyDateToIso } from "../src/utils/date.js";
import { logger } from "../src/utils/logger.js";

function resolveIso(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const legacy = legacyDateToIso(value);
    if (legacy) return legacy;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }
  if (typeof value?.toDate === "function") {
    return value.toDate().toISOString();
  }
  return null;
}

async function main() {
  assertFirebaseConfiguration();
  const db = getDb();
  const snapshot = await db.collection("sales").get();

  let updated = 0;
  let skipped = 0;
  let batch = db.batch();
  let pending = 0;

  for (const document of snapshot.docs) {
    const data = document.data();
    const iso = resolveIso(data.createdAt);

    if (!iso) {
      skipped += 1;
      continue;
    }

    const dateKey = getDateKey(new Date(iso), env.TIMEZONE);
    const needsUpdate =
      data.createdAt !== iso || data.dateKey !== dateKey;

    if (!needsUpdate) {
      skipped += 1;
      continue;
    }

    batch.update(document.ref, { createdAt: iso, dateKey });
    updated += 1;
    pending += 1;

    if (pending === 400) {
      await batch.commit();
      batch = db.batch();
      pending = 0;
    }
  }

  if (pending > 0) await batch.commit();

  logger.info(
    { total: snapshot.size, updated, skipped },
    "Migración de ventas finalizada"
  );
}

main().catch((error) => {
  logger.fatal({ err: error }, "No se pudo migrar las ventas");
  process.exit(1);
});
