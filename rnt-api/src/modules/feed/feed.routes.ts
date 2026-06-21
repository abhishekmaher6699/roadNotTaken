import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import { getFeedHandler } from "./feed.controller";

const router = Router();

router.get("/", authMiddleware, getFeedHandler);

export default router;
