<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import LinkComponent from "@/components/LinkComponent.vue";
import useImage from "@/composables/useImage";
import { useProductsStore } from "@/stores/products";

/**
 * ============================== NOTES ==============================
 * -> useImage: This is a composable that contains the logic to upload an image to Firebase Storage. In this case, we can use destructuring to get the methods because it's an array.
 * -> useProductsStore: This is a store that contains the products. When we create a new instance of a store, we can't use destructuring to get the methods. Because it's an object, we need to use the dot notation to access the methods.
 * ============================== End of NOTES ==============================
 */

const { onFileChange, url, isImageUploaded } = useImage();
const productsStore = useProductsStore();
const router = useRouter();
const formData = reactive({
  name: "",
  image: "",
  category: "",
  price: "",
  availability: "",
});

const submitHandler = async (data) => {
  const { image, ...values } = data;
  console.log({
    ...values,
    image: url.value,
  });
  try {
    await productsStore.createProduct({
      ...values,
      image: url.value,
    });
    router.push("/admin/productos");
  } catch (error) {
    console.error(error);
  }
};
</script>

<template>
  <div class="mt-10">
    <LinkComponent to="products">Volver</LinkComponent>

    <h1 class="text-2xl font-bold my-4">Nuevo producto</h1>
    <div class="flex justify-center bg-white p-4 rounded-md shadow">
      <div class="mt-10 p-10 w-full 2xl:w-2/4">
        <!-- ============== Formulario ============== -->
        <FormKit
          type="form"
          submit-label="Agregar Producto"
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
            label="Imagen del producto"
            name="image"
            type="file"
            validation="required"
            :validation-messages="{
              required: 'La imagen del producto es requerida',
            }"
            accept=".jpg"
            @change="onFileChange"
          />
          <div
            v-if="isImageUploaded"
            class="w-96 my-4 shadow rounded-md overflow-hidden"
          >
            <p class="text-center text-lg text-gray-500">Imágen del producto</p>
            <img
              class="w-full h-full object-cover"
              :src="url"
              alt="Imagen del producto"
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

<style lang="css" scoped></style>
