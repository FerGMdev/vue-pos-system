import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useFirestore, useCollection, useFirebaseStorage } from "vuefire";
import {
  collection,
  addDoc,
  query,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";

export const useProductsStore = defineStore("products", () => {
  const db = useFirestore();
  const storage = useFirebaseStorage();

  const selectCategory = ref("");
  const categories = [
    { id: 1, name: "Sudadera" },
    { id: 2, name: "Tenis" },
    { id: 3, name: "Lentes" },
  ];

  const q = query(collection(db, "products"), orderBy("category", "asc"));

  const productsCollection = useCollection(q);

  async function createProduct(product) {
    if (!product?.name || product?.price === undefined || product?.price === null || product?.availability === undefined || product?.availability === null) {
      throw new Error("Datos de producto incompletos");
    }
    const price = Number(product.price);
    const availability = Number(product.availability);
    if (isNaN(price) || price < 0) throw new Error("Precio inválido");
    if (isNaN(availability) || availability < 0)
      throw new Error("Disponibilidad inválida");

    await addDoc(collection(db, "products"), {
      ...product,
      price,
      availability,
    });
  }

  async function updateProduct(docRef, product) {
    const { image, url, ...values } = product;
    const updateData = { ...values };
    if (values.price !== undefined && values.price !== "") updateData.price = Number(values.price);
    if (values.availability !== undefined && values.availability !== "") updateData.availability = Number(values.availability);

    if (image && image.length) {
      updateData.image = url?.value;
    }

    await updateDoc(docRef, updateData);
  }

  async function deleteProduct(id) {
    if (!id) return;
    if (!confirm("¿Estás seguro de eliminar éste producto?")) {
      return;
    }
    try {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await deleteDoc(docRef);
        return;
      }
      const data = docSnap.data();
      const image = data?.image;

      const tasks = [deleteDoc(docRef)];
      if (image) {
        try {
          const imageRef = storageRef(storage, image);
          tasks.push(deleteObject(imageRef));
        } catch (err) {
          console.warn("No se pudo eliminar la imagen del producto:", err);
        }
      }
      await Promise.allSettled(tasks);
    } catch (error) {
      console.error("Error al eliminar el producto:", error);
      alert("Error al eliminar el producto. Intenta nuevamente.");
    }
  }

  const categoryOptions = computed(() => {
    const options = [
      {
        label: "Seleccione una categoría",
        value: "",
        attrs: { disabled: true },
      },
      ...categories.map((category) => ({
        label: category.name,
        value: category.id,
      })),
    ];
    return options;
  });

  const noResults = computed(() => productsCollection.value.length === 0);

  const filteredProducts = computed(() => {
    return productsCollection.value
      .filter(
        (product) =>
          selectCategory.value === "" ||
          product.category === selectCategory.value
      )
      .filter((product) => Number(product.availability) > 0);
  });

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    categoryOptions,
    productsCollection,
    noResults,
    filteredProducts,
    selectCategory,
  };
});
