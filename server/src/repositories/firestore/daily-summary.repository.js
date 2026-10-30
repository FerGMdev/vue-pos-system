import { FieldPath } from "firebase-admin/firestore";

/** Reads daily summaries by document id (YYYY-MM-DD). Never scans sales. */
export function createDailySummaryRepository(db) {
  const collection = db.collection("dailySummaries");

  return {
    async findByDateKey(dateKey) {
      const snapshot = await collection.doc(dateKey).get();
      return snapshot.exists ? { id: snapshot.id, ...snapshot.data() } : null;
    },

    async findRange(startKey, endKey) {
      const snapshot = await collection
        .where(FieldPath.documentId(), ">=", startKey)
        .where(FieldPath.documentId(), "<=", endKey)
        .get();

      return snapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));
    },
  };
}
