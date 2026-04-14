import crypto from "crypto";
import { CloudinarySignaturePayload } from "./uploads.types";

const DEFAULT_UPLOAD_FOLDER = "road-not-taken/pins";

export function getCloudinaryUploadSignature(): CloudinarySignaturePayload {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_UPLOAD_FOLDER || DEFAULT_UPLOAD_FOLDER;

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error("Cloudinary env vars are missing");
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return {
    timestamp,
    folder,
    signature,
    cloudName,
    apiKey,
  };
}
