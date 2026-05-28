import { apiClient } from "@/lib/api-client";
import {
  CloudinarySignaturePayload,
  CloudinaryUploadResult,
} from "./types";

export type UploadFolder = "pins" | "profiles";

export function getCloudinarySignatureApi(folder: UploadFolder = "pins") {
  return apiClient(
    `/uploads/cloudinary/signature?folder=${folder}`
  ) as Promise<CloudinarySignaturePayload>;
}

export async function uploadImageToCloudinary(
  file: File,
  folder: UploadFolder = "pins",
) {
  const signature = await getCloudinarySignatureApi(folder);
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
