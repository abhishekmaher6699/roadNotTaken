import { uploadImageToCloudinary, type UploadFolder } from "./api";

export function useCloudinaryUpload() {
  const uploadImage = async (file: File, folder?: UploadFolder) => {
    const result = await uploadImageToCloudinary(file, folder);
    return result.secure_url;
  };

  return { uploadImage };
}
