import { ref, computed } from "vue";
import { uid } from "uid";
import { useFirebaseStorage } from "vuefire";
import {
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";

/**
 * ============================== NOTES ==============================
 * -> file: file to upload. In this case, we use position 0 because we only have one file.
 * -> filename: name of the file. We use the uid to generate a unique name.
 * -> sRef: reference to the storage. It needs two arguments:
 *  1. The storage instance.
 *  2. The path where the file will be stored.
 * -> uploadTask: task to upload the file to Firebase Storage. And takes two arguments:
 *  1. The reference to the storage.
 *  2. The file to upload.
 * -> uploadTask.on("state_changed"): This is an event listener that is triggered during the upload process. And take as arguments three functions:
 *  1. snapshot: contains information about the upload progress.
 *  2. error: triggered when an error occurs.
 *  3. complete: triggered when the upload is complete.
 * -> getDownloadURL(uploadTask.snapshot.ref): This function returns a promise that resolves to the download URL of the file.
 * ============================== End of NOTES ==============================
 */

export default function useImage() {
  const storage = useFirebaseStorage();
  const url = ref("");

  const onFileChange = (event) => {
    const file = event.target.files[0];
    const filename = uid() + ".jpg";
    const sRef = storageRef(storage, "products/" + filename);

    // Upload the file to Firebase Storage
    const uploadTask = uploadBytesResumable(sRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log("Upload is", progress, "% done");
      },
      (error) => {
        console.error("Error uploading file:", error);
      },
      () => {
        console.log("File uploaded successfully");
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          url.value = downloadURL;
        });
      }
    );
  };

  const isImageUploaded = computed(() => url.value !== "");
  return {
    onFileChange,
    url,
    isImageUploaded,
  };
}
