export interface CloudinarySignaturePayload {
  timestamp: number;
  folder: string;
  signature: string;
  cloudName: string;
  apiKey: string;
}

export interface CloudinaryUploadResult {
  secure_url: string;
}
