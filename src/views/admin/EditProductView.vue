<script setup>
import { watch, reactive } from "vue";
import { useRoute, useRouter } from "vue-router";
import { doc } from "firebase/firestore";
import { useFirestore, useDocument } from "vuefire";
import LinkComponent from "@/components/LinkComponent.vue";
import { useProductsStore } from "@/stores/products";
import useImage from "@/composables/useImage";

// Consultar Firestore
const route = useRoute();
const router = useRouter();

const db = useFirestore();
const docRef = doc(db, "products", route.params.id);
const product = useDocument(docRef);

const { onFileChange, url, isImageUploaded } = useImage();
const productsStore = useProductsStore();

const formData = reactive({
  name: "",
  category: "",
  price: "",
  availability: "",
  image: "",
});

watch(product, (product) => {
  console.log("product", product);
  if (!product) {
    router.push({ name: "admin-products" });
  }
  Object.assign(formData, product);
});

const submitHandler = async (data) => {
  try {
    await productsStore.updateProduct(docRef, { ...data, url });
    router.push({ name: "products" });
  } catch (error) {
    console.log("Error al actualizar el producto:", error);
  }
};
</script>

<template>
  <div class="mt-10">
    <LinkComponent to="products"> Volver </LinkComponent>
    <h1 class="text-2xl font-bold my-4">Editar producto</h1>
    <div class="flex justify-center bg-white p-4 rounded-md shadow">
      <div class="mt-10 p-10 w-full 2xl:w-2/4">
        <!-- ============== Formulario ============== -->
        <FormKit
          type="form"
          submit-label="Guardar Cambios"
          incomplete-message="No se pudo agregar el producto, por favor verifica todos los datos"
          @submit="submitHandler"
          :value="formData"
        >
          <!-- ============== Nombre del producto ============== -->
          <FormKit
            label="Nombre"
            name="name"
            type="text"
            placeholder="Nombre del producto"
            validation="required"
            :validation-messages="{
              required: 'El nombre del producto es requerido',
            }"
            v-model.trim="formData.name"
          />

          <!-- ============== Imagen del producto ============== -->
          <FormKit
            type="file"
            label="Cambiar Imagen"
            name="image"
            multiple="false"
            accept=".jpg"
            @change="onFileChange"
          />

          <div
            v-if="isImageUploaded"
            class="w-96 my-4 shadow rounded-md overflow-hidden"
          >
            <p class="text-center text-lg text-gray-500">Nueva Imágen</p>
            <img
              class="w-full h-full object-cover"
              :src="url"
              alt="Imagen del producto"
            />
          </div>

          <div v-else class="w-96 my-4 shadow rounded-md overflow-hidden">
            <p class="text-center text-lg text-gray-500">Imágen Actual</p>
            <img
              :src="formData.image"
              :alt="'Imagen de' + formData.image"
              class="w-full h-full object-cover"
            />
          </div>
          <!-- ============== Categoría del producto ============== -->
          <FormKit
            label="Categoría"
            name="category"
            type="select"
            placeholder="Categoría del producto"
            validation="required"
            :validation-messages="{
              required: 'La categoría del producto es requerida',
            }"
            :options="productsStore.categoryOptions"
            v-model.trim="formData.category"
          />

          <!-- ============== Precio del producto ============== -->
          <FormKit
            label="Precio ($)"
            name="price"
            type="number"
            placeholder="Precio del producto"
            validation="required"
            :validation-messages="{
              required: 'El precio del producto es requerido',
            }"
            min="1"
            v-model.number="formData.price"
          />

          <!-- ============== Disponibilidad del producto ============== -->
          <FormKit
            label="Disponibilidad"
            name="availability"
            type="number"
            placeholder="Disponibilidad del producto"
            validation="required"
            :validation-messages="{
              required: 'La cantidad es requerida',
            }"
            min="1"
            v-model.number="formData.availability"
          />
        </FormKit>
      </div>
    </div>
  </div>
</template>
