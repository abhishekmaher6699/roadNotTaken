import { Router } from "express";
import {
  createSessionHandler,
  currentUserHandler,
  googleAuthUrlHandler,
  loginHandler,
  logoutHandler,
  signupHandler,
  refreshTokenHandler,
} from "./auth.controller";
import { authMiddleware } from "../../middleware/auth.middleware";

const router = Router()

router.post('/signup', signupHandler)
router.post('/login', loginHandler)
router.post('/session', createSessionHandler)
router.post('/refresh', refreshTokenHandler)
router.post('/logout', authMiddleware, logoutHandler)
router.get('/google/url', googleAuthUrlHandler)
router.get('/me', authMiddleware, currentUserHandler)

export default router
