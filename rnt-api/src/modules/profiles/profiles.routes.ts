import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  getMyProfileHandler,
  getPublicProfileHandler,
  updateMyProfileHandler,
} from "./profiles.controller";

const router = Router();

router.get("/me", authMiddleware, getMyProfileHandler);
router.put("/me", authMiddleware, updateMyProfileHandler);
router.get("/:userId", getPublicProfileHandler);

export default router;
