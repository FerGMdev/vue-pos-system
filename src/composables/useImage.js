import { ref, computed } from "vue";
import { uid } from "uid";
import { useFirebaseStorage } from "vuefire";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

export default function useImage() {
  const storage = useFirebaseStorage();
  const url = ref("");
  const uploadProgress = ref(0);
  const uploadError = ref("");
  const isUploading = ref(false);

  const onFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      uploadError.value = "Formato de imagen no válido. Usa JPG, PNG o WebP.";
      return;
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      uploadError.value = "La imagen es muy grande. Máximo 5MB.";
      return;
    }

    uploadError.value = "";
    isUploading.value = true;
    uploadProgress.value = 0;

    const extension = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
    const filename = uid() + "." + extension;
    const sRef = storageRef(storage, "products/" + filename);

    const uploadTask = uploadBytesResumable(sRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        uploadProgress.value = Math.round(progress);
      },
      (error) => {
        console.error("Error uploading file:", error);
        uploadError.value = "Error al subir la imagen. Intenta nuevamente.";
        isUploading.value = false;
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref)
          .then((downloadURL) => {
            url.value = downloadURL;
            isUploading.value = false;
          })
          .catch((error) => {
            console.error("Error getting download URL:", error);
            uploadError.value = "Error al obtener la URL de la imagen.";
            isUploading.value = false;
          });
      }
    );
  };

  const isImageUploaded = computed(() => url.value !== "");
  return {
    onFileChange,
    url,
    isImageUploaded,
    uploadProgress,
    uploadError,
    isUploading,
  };
}
