import { FieldPath } from "firebase-admin/firestore";

const MAX_IN_QUERY = 30;

function toProduct(documentSnapshot) {
  const data = documentSnapshot.data() ?? {};
  return {
    id: documentSnapshot.id,
    name: String(data.name ?? ""),
    price: Number(data.price) || 0,
    availability: Number(data.availability) || 0,
    category: Number(data.category) || 0,
    image: typeof data.image === "string" ? data.image : "",
    imagePath: typeof data.imagePath === "string" ? data.imagePath : "",
    createdAt: data.createdAt ?? null,
    updatedAt: data.updatedAt ?? null,
  };
}

export function createProductRepository(db) {
  const collection = db.collection("products");

  return {
    async findAll() {
      const snapshot = await collection.get();
      return snapshot.docs.map(toProduct);
    },

    async findById(id) {
      const snapshot = await collection.doc(id).get();
      return snapshot.exists ? toProduct(snapshot) : null;
    },

    async findByIds(ids) {
      const uniqueIds = [...new Set(ids)];
      if (uniqueIds.length === 0) return [];

      const chunks = [];
      for (let index = 0; index < uniqueIds.length; index += MAX_IN_QUERY) {
        chunks.push(uniqueIds.slice(index, index + MAX_IN_QUERY));
      }

      const results = await Promise.all(
        chunks.map((chunk) =>
          collection.where(FieldPath.documentId(), "in", chunk).get()
        )
      );

      return results.flatMap((snapshot) => snapshot.docs.map(toProduct));
    },

    async create(data) {
      const now = new Date().toISOString();
      const payload = { ...data, createdAt: now, updatedAt: now };
      const reference = await collection.add(payload);
      return { id: reference.id, ...payload };
    },

    async update(id, data) {
      const reference = collection.doc(id);
      await reference.update({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      const snapshot = await reference.get();
      return snapshot.exists ? toProduct(snapshot) : null;
    },

    async delete(id) {
      await collection.doc(id).delete();
    },
  };
}
