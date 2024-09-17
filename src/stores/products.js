import { computed, ref } from "vue";
import { defineStore } from "pinia";
import { useFirestore, useCollection, useFirebaseStorage } from "vuefire";
import {
  collection,
  addDoc,
  where,
  query,
  limit,
  orderBy,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
} from "firebase/firestore";
import { ref as storageRef, deleteObject } from "firebase/storage";

/**
 * ============================== NOTES ==============================
 * -> categories: Array with the categories of the products
 * -> categoryOptions: Computed property that returns the categories options for the form. We do this because this is how FormKit needs the options to be passed.
 * -> createProduct: Function to create a new product
 */

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
    await addDoc(collection(db, "products"), product);
  }

  async function updateProduct(docRef, product) {
    const { image, url, ...values } = product;
    await updateDoc(docRef, values);

    if (image.length) {
      await updateDoc(docRef, {
        ...values,
        image: url.value,
      });
    } else {
      await updateDoc(docRef, values);
    }
  }

  async function deleteProduct(id) {
    console.log("ID del producto a eliminar:", id);
    if (confirm("¿Estás seguro de eliminar éste producto?")) {
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);
      const { image } = docSnap.data();
      const imageRef = storageRef(storage, image);

      await Promise.all([deleteDoc(docRef), deleteObject(imageRef)]);
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
      .filter((product) => product.availability > 0);
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
