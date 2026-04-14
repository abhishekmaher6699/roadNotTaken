import { apiClient } from "@/lib/api-client";
import {
  CloudinarySignaturePayload,
  CloudinaryUploadResult,
} from "./types";

export function getCloudinarySignatureApi() {
  return apiClient(
    "/uploads/cloudinary/signature"
  ) as Promise<CloudinarySignaturePayload>;
}

export async function uploadImageToCloudinary(file: File) {
  const signature = await getCloudinarySignatureApi();
  const formData = new FormData();

  formData.append("file", file);
  formData.append("api_key", signature.apiKey);
  formData.append("timestamp", String(signature.timestamp));
  formData.append("signature", signature.signature);
  formData.append("folder", signature.folder);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const error = await response.json().catch(() => null);
    const message =
      error?.error?.message ||
      error?.message ||
      "Image upload failed";
    throw new Error(message);
  }

  return (await response.json()) as CloudinaryUploadResult;
}
