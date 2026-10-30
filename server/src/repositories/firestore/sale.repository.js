import { FieldValue } from "firebase-admin/firestore";
import { AppError } from "../../utils/errors.js";
import {
  createDailySummary,
  getSaleSummaryDeltas,
} from "../../utils/dailySummary.js";

function normalizeItem(item) {
  return {
    id: String(item.id ?? ""),
    name: String(item.name ?? ""),
    price: Number(item.price) || 0,
    quantity: Number(item.quantity) || 0,
    image: typeof item.image === "string" ? item.image : "",
  };
}

function toSale(documentSnapshot) {
  const data = documentSnapshot.data() ?? {};
  return {
    id: documentSnapshot.id,
    items: Array.isArray(data.items) ? data.items.map(normalizeItem) : [],
    subtotal: Number(data.subtotal) || 0,
    discount: Number(data.discount) || 0,
    taxes: Number(data.taxes) || 0,
    total: Number(data.total) || 0,
    couponCode: data.couponCode ?? null,
    discountPercentage: Number(data.discountPercentage) || 0,
    createdAt: data.createdAt ?? null,
    dateKey: data.dateKey ?? null,
    createdBy: data.createdBy ?? null,
  };
}

/** Atomic increments for an existing daily summary document. */
function toSummaryIncrements(sale) {
  const deltas = getSaleSummaryDeltas(sale);
  const update = {
    salesCount: FieldValue.increment(deltas.salesCount),
    totalCents: FieldValue.increment(deltas.totalCents),
  };

  for (const [productId, delta] of Object.entries(deltas.products)) {
    update[`products.${productId}.units`] = FieldValue.increment(delta.units);
    update[`products.${productId}.revenueCents`] = FieldValue.increment(
      delta.revenueCents
    );
  }

  return update;
}

export function createSaleRepository(db) {
  const salesCollection = db.collection("sales");
  const productsCollection = db.collection("products");
  const summariesCollection = db.collection("dailySummaries");

  return {
    /**
     * Reads products, validates stock and price, decrements inventory, writes
     * the sale and updates the day's summary in a single Firestore transaction.
     * If anything fails, nothing is written.
     */
    async createAtomic({ saleId, sale, items }) {
      return db.runTransaction(async (transaction) => {
        const saleReference = salesCollection.doc(saleId);
        const summaryReference = summariesCollection.doc(sale.dateKey);
        const productReferences = items.map((item) =>
          productsCollection.doc(item.id)
        );

        // Firestore requires every read before the first write.
        const [saleSnapshot, summarySnapshot, ...productSnapshots] =
          await Promise.all([
            transaction.get(saleReference),
            transaction.get(summaryReference),
            ...productReferences.map((reference) => transaction.get(reference)),
          ]);

        if (saleSnapshot.exists) {
          const existing = toSale(saleSnapshot);
          if (existing.createdBy !== sale.createdBy) {
            throw AppError.conflict(
              "El identificador de venta ya fue utilizado",
              "CHECKOUT_ID_CONFLICT"
            );
          }
          return { sale: existing, duplicate: true };
        }

        const productUpdates = [];

        productSnapshots.forEach((snapshot, index) => {
          const requested = items[index];

          if (!snapshot.exists) {
            throw AppError.conflict(
              `El producto "${requested.name || requested.id}" ya no existe`,
              "PRODUCT_NOT_FOUND",
              { productId: requested.id }
            );
          }

          const data = snapshot.data();
          const available = Number(data.availability) || 0;
          const currentPrice = Number(data.price) || 0;
          const quantity = Number(requested.quantity) || 0;

          if (currentPrice !== Number(requested.price)) {
            throw AppError.conflict(
              `El precio de "${data.name || requested.id}" cambió. Actualiza el carrito e intenta de nuevo.`,
              "PRICE_CHANGED",
              {
                productId: requested.id,
                productName: data.name ?? "",
                previousPrice: Number(requested.price) || 0,
                currentPrice,
              }
            );
          }

          if (available < quantity) {
            throw AppError.conflict(
              `Stock insuficiente para "${data.name || requested.id}". Disponible: ${available}`,
              "INSUFFICIENT_STOCK",
              {
                productId: requested.id,
                productName: data.name ?? "",
                available,
                requested: quantity,
              }
            );
          }

          productUpdates.push({
            reference: productReferences[index],
            availability: available - quantity,
          });
        });

        productUpdates.forEach(({ reference, availability }) => {
          transaction.update(reference, {
            availability,
            updatedAt: new Date().toISOString(),
          });
        });

        if (summarySnapshot.exists) {
          transaction.update(summaryReference, toSummaryIncrements(sale));
        } else {
          transaction.set(
            summaryReference,
            createDailySummary(sale.dateKey, [sale])
          );
        }

        transaction.set(saleReference, sale);

        return { sale: { id: saleId, ...sale }, duplicate: false };
      });
    },

    async findByDateKey(dateKey) {
      const snapshot = await salesCollection
        .where("dateKey", "==", dateKey)
        .get();

      return snapshot.docs
        .map(toSale)
        .sort((left, right) =>
          String(right.createdAt ?? "").localeCompare(String(left.createdAt ?? ""))
        );
    },
  };
}
