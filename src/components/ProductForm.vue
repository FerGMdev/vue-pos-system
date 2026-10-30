<script setup>
import { computed, ref } from "vue";
import LinkButton from "./LinkButton.vue";
import ProductImage from "./ProductImage.vue";
import useImage from "@/composables/useImage";
import { useProductsStore } from "@/stores/products";

const props = defineProps({
  initialValues: { type: Object, default: () => ({}) },
  submitLabel: { type: String, default: "Guardar producto" },
  submitting: { type: Boolean, default: false },
  existingImage: { type: String, default: "" },
  existingImagePath: { type: String, default: "" },
  requireImage: { type: Boolean, default: false },
});
const emit = defineEmits(["submit"]);

const productsStore = useProductsStore();
const {
  url,
  path,
  uploadProgress,
  error: uploadError,
  isUploading,
  onFileChange,
  reset,
} = useImage();

const localError = ref("");
const fileInput = ref(null);

const formValue = computed(() => ({
  name: props.initialValues?.name ?? "",
  category: props.initialValues?.category ?? "",
  price: props.initialValues?.price ?? "",
  availability: props.initialValues?.availability ?? "",
}));

const previewUrl = computed(() => url.value || props.existingImage);
const previewPath = computed(() => path.value || props.existingImagePath);
const isBusy = computed(() => props.submitting || isUploading.value);
const hasNewImage = computed(() => Boolean(url.value));

const submitText = computed(() => {
  if (isUploading.value) return "Subiendo imagen...";
  if (props.submitting) return "Guardando...";
  return props.submitLabel;
});

async function handleFileChange(event) {
  localError.value = "";
  const input = event.target;
  try {
    await onFileChange(event);
  } finally {
    // Permite volver a seleccionar el mismo archivo (p. ej. tras un error).
    input.value = "";
  }
}

function submitHandler(data) {
  localError.value = "";

  if (props.submitting) return;

  if (isUploading.value) {
    localError.value = "Espera a que termine la subida de la imagen.";
    return;
  }

  if (uploadError.value) {
    localError.value = uploadError.value;
    return;
  }

  if (props.requireImage && !previewUrl.value) {
    localError.value = "Selecciona una imagen para el producto.";
    return;
  }

  emit("submit", {
    name: String(data.name ?? "").trim(),
    category: Number(data.category),
    price: Number(data.price),
    availability: Number(data.availability),
    image: previewUrl.value,
    imagePath: previewPath.value,
  });
}

function clearSelectedImage() {
  reset();
  if (fileInput.value) fileInput.value.value = "";
  localError.value = "";
}
</script>

<template>
  <div class="rounded-lg bg-white p-6 shadow-md lg:p-8">
    <FormKit
      type="form"
      :value="formValue"
      :submit-label="submitText"
      :disabled="isBusy"
      incomplete-message="Revisa los campos marcados antes de guardar."
      @submit="submitHandler"
    >
      <FormKit
        label="Nombre"
        name="name"
        type="text"
        placeholder="Nombre del producto"
        validation="required|length:2,120"
        :validation-messages="{
          required: 'El nombre del producto es requerido',
          length: 'El nombre debe tener entre 2 y 120 caracteres',
        }"
      />

      <div class="mb-6">
        <label for="product-image" class="mb-2 block font-bold">
          Imagen del producto
        </label>
        <input
          id="product-image"
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          class="block w-full cursor-pointer rounded-md border border-gray-300 p-2 text-sm text-slate-600 file:mr-4 file:rounded-md file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
          :disabled="isBusy"
          @change="handleFileChange"
        />
        <p class="mt-1 text-sm text-slate-500">
          JPG, PNG o WebP. Máximo 5 MB.
        </p>

        <div v-if="isUploading" class="mt-3">
          <div class="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              class="h-full bg-green-600 transition-all"
              :style="{ width: `${uploadProgress}%` }"
            ></div>
          </div>
          <p class="mt-1 text-sm text-slate-500">
            Subiendo imagen: {{ uploadProgress }}%
          </p>
        </div>

        <p v-if="uploadError" class="mt-2 text-sm font-semibold text-red-600" role="alert">
          {{ uploadError }}
        </p>

        <div v-if="previewUrl" class="mt-4 w-full max-w-sm overflow-hidden rounded-md border border-slate-200">
          <p class="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500">
            {{ hasNewImage ? "Nueva imagen" : "Imagen actual" }}
          </p>
          <ProductImage
            :src="previewUrl"
            alt="Vista previa del producto"
            img-class="h-56 w-full object-cover"
          />
        </div>

        <button
          v-if="hasNewImage"
          type="button"
          class="mt-2 text-sm font-semibold text-red-600 hover:underline"
          @click="clearSelectedImage"
        >
          Quitar imagen seleccionada
        </button>

        <p
          v-else-if="requireImage"
          class="mt-2 text-sm text-slate-500"
        >
          La imagen es obligatoria para crear un producto.
        </p>
      </div>

      <FormKit
        label="Categoría"
        name="category"
        type="select"
        placeholder="Selecciona una categoría"
        validation="required"
        :validation-messages="{ required: 'La categoría es requerida' }"
        :options="productsStore.formCategoryOptions"
      />

      <FormKit
        label="Precio ($)"
        name="price"
        type="number"
        placeholder="0.00"
        step="0.01"
        min="0.01"
        validation="required|number|min:0.01"
        :validation-messages="{
          required: 'El precio es requerido',
          number: 'El precio debe ser un número',
          min: 'El precio debe ser mayor que cero',
        }"
      />

      <FormKit
        label="Disponibilidad"
        name="availability"
        type="number"
        placeholder="0"
        step="1"
        min="0"
        validation="required|number|min:0"
        :validation-messages="{
          required: 'La disponibilidad es requerida',
          number: 'La disponibilidad debe ser un número',
          min: 'La disponibilidad no puede ser negativa',
        }"
      />

      <p
        v-if="localError"
        class="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
        role="alert"
      >
        {{ localError }}
      </p>
    </FormKit>

    <div class="mt-4">
      <LinkButton to="products" variant="outline">Volver al inventario</LinkButton>
    </div>
  </div>
</template>
