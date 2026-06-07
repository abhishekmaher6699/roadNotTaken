import { apiClient } from "@/lib/api-client";
import {
  CloudinarySignaturePayload,
  CloudinaryUploadResult,
} from "./types";

export type UploadFolder = "pins" | "profiles";

const SIGNATURE_TTL_MS = 45_000;
const MAX_UPLOAD_BYTES: Record<UploadFolder, number> = {
  pins: 8 * 1024 * 1024,
  profiles: 4 * 1024 * 1024,
};
const signatureCache = new Map<
  UploadFolder,
  {
    expiresAt: number;
    payload?: CloudinarySignaturePayload;
    request?: Promise<CloudinarySignaturePayload>;
  }
>();

function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)}MB`;
}

function validateImageFile(file: File, folder: UploadFolder) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files can be uploaded");
  }

  const maxBytes = MAX_UPLOAD_BYTES[folder];
  if (file.size > maxBytes) {
    throw new Error(`Image must be ${formatMegabytes(maxBytes)} or smaller`);
  }
}

export function getCloudinarySignatureApi(folder: UploadFolder = "pins") {
  const cached = signatureCache.get(folder);
  const now = Date.now();

  if (cached?.payload && cached.expiresAt > now) {
    return Promise.resolve(cached.payload);
  }

  if (cached?.request) {
    return cached.request;
  }

  const request = (apiClient(
    `/uploads/cloudinary/signature?folder=${folder}`
  ) as Promise<CloudinarySignaturePayload>)
    .then((payload) => {
      signatureCache.set(folder, {
        payload,
        expiresAt: Date.now() + SIGNATURE_TTL_MS,
      });
      return payload;
    })
    .catch((error) => {
      signatureCache.delete(folder);
      throw error;
    });

  signatureCache.set(folder, {
    request,
    expiresAt: now + SIGNATURE_TTL_MS,
  });

  return request;
}

export async function uploadImageToCloudinary(
  file: File,
  folder: UploadFolder = "pins",
) {
  validateImageFile(file, folder);

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
