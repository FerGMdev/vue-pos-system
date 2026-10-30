import { computed, ref } from "vue";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytesResumable,
} from "firebase/storage";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_SIZE_BYTES,
} from "@shared/constants.js";
import {
  firebaseConfigError,
  firebaseStorage,
  isFirebaseConfigured,
} from "@/config/firebase";
import { createUuid } from "@/utils/uuid";

const EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function mapUploadError(error) {
  switch (error?.code) {
    case "storage/unauthorized":
      return "No tienes permisos para subir imágenes. Verifica tu rol de administrador.";
    case "storage/canceled":
      return "La subida de la imagen fue cancelada.";
    case "storage/quota-exceeded":
      return "Se agotó la cuota de almacenamiento.";
    case "storage/retry-limit-exceeded":
      return "La conexión es inestable. Intenta subir la imagen nuevamente.";
    default:
      return "No se pudo subir la imagen. Intenta nuevamente.";
  }
}

export default function useImage() {
  const url = ref("");
  const path = ref("");
  const uploadProgress = ref(0);
  const error = ref("");
  const isUploading = ref(false);
  let activeTask = null;

  function reset() {
    const task = activeTask;
    activeTask = null;
    if (task) task.cancel();
    url.value = "";
    path.value = "";
    uploadProgress.value = 0;
    error.value = "";
    isUploading.value = false;
  }

  function validateFile(file) {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "Formato no válido. Usa JPG, PNG o WebP.";
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return "La imagen es demasiado grande. El máximo es 5 MB.";
    }
    return "";
  }

  function uploadFile(file) {
    reset();

    if (!isFirebaseConfigured || !firebaseStorage) {
      error.value = firebaseConfigError;
      return Promise.resolve(null);
    }

    const validationError = validateFile(file);
    if (validationError) {
      error.value = validationError;
      return Promise.resolve(null);
    }

    const extension = EXTENSIONS[file.type] || "jpg";
    const imagePath = `products/${createUuid()}.${extension}`;
    const reference = storageRef(firebaseStorage, imagePath);
    const task = uploadBytesResumable(reference, file, {
      contentType: file.type,
      cacheControl: "public,max-age=31536000",
    });

    activeTask = task;
    isUploading.value = true;
    error.value = "";
    path.value = imagePath;

    return new Promise((resolve) => {
      task.on(
        "state_changed",
        (snapshot) => {
          if (activeTask !== task) return;
          uploadProgress.value = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
        },
        (uploadError) => {
          if (activeTask !== task) return;
          error.value = mapUploadError(uploadError);
          path.value = "";
          uploadProgress.value = 0;
          isUploading.value = false;
          activeTask = null;
          resolve(null);
        },
        async () => {
          if (activeTask !== task) {
            resolve(null);
            return;
          }
          try {
            url.value = await getDownloadURL(task.snapshot.ref);
            uploadProgress.value = 100;
            resolve(url.value);
          } catch (downloadError) {
            error.value = mapUploadError(downloadError);
            path.value = "";
            resolve(null);
          } finally {
            isUploading.value = false;
            activeTask = null;
          }
        }
      );
    });
  }

  function onFileChange(event) {
    const file = event?.target?.files?.[0];
    if (!file) return Promise.resolve(null);
    return uploadFile(file);
  }

  const isImageUploaded = computed(() => Boolean(url.value));

  return {
    url,
    path,
    uploadProgress,
    error,
    isUploading,
    isImageUploaded,
    onFileChange,
    uploadFile,
    reset,
  };
}
