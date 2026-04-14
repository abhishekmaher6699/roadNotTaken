import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { cloudinarySignatureHandler } from "./uploads.controller";

const router = Router();

router.get("/cloudinary/signature", authMiddleware, cloudinarySignatureHandler);

export default router;
