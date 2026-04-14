import { uploadImageToCloudinary } from "./api";

export function useCloudinaryUpload() {
  const uploadImage = async (file: File) => {
    const result = await uploadImageToCloudinary(file);
    return result.secure_url;
  };

  return { uploadImage };
}
