import { Router } from "express";
import { authMiddleware } from "../../middleware/auth.middleware";
import {
  followProfileHandler,
  getMyProfileHandler,
  getPublicProfileHandler,
  searchProfilesHandler,
  unfollowProfileHandler,
  updateMyProfileHandler,
} from "./profiles.controller";

const router = Router();

router.get("/me", authMiddleware, getMyProfileHandler);
router.put("/me", authMiddleware, updateMyProfileHandler);
router.get("/search", searchProfilesHandler);
router.post("/:userId/follow", authMiddleware, followProfileHandler);
router.delete("/:userId/follow", authMiddleware, unfollowProfileHandler);
router.get("/:userId", getPublicProfileHandler);

export default router;
