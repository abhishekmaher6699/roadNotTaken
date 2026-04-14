import { Request, Response } from "express";
import { getCloudinaryUploadSignature } from "./uploads.service";

export function cloudinarySignatureHandler(req: Request, res: Response) {
  try {
    const payload = getCloudinaryUploadSignature();
    res.json(payload);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to generate upload signature",
    });
  }
}
