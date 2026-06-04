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
import { createRateLimitMiddleware } from "../../middleware/rate-limit.middleware";

const router = Router()
const isTest = process.env.NODE_ENV === "test";

const signupRateLimit = createRateLimitMiddleware({
  keyPrefix: "auth:signup",
  windowMs: 60 * 60 * 1000,
  max: isTest ? 500 : 5,
});

const loginRateLimit = createRateLimitMiddleware({
  keyPrefix: "auth:login",
  windowMs: 15 * 60 * 1000,
  max: isTest ? 500 : 10,
});

const sessionRateLimit = createRateLimitMiddleware({
  keyPrefix: "auth:session",
  windowMs: 15 * 60 * 1000,
  max: isTest ? 500 : 30,
});

const refreshRateLimit = createRateLimitMiddleware({
  keyPrefix: "auth:refresh",
  windowMs: 15 * 60 * 1000,
  max: isTest ? 500 : 60,
});

router.post('/signup', signupRateLimit, signupHandler)
router.post('/login', loginRateLimit, loginHandler)
router.post('/session', sessionRateLimit, createSessionHandler)
router.post('/refresh', refreshRateLimit, refreshTokenHandler)
router.post('/logout', authMiddleware, logoutHandler)
router.get('/google/url', googleAuthUrlHandler)
router.get('/me', authMiddleware, currentUserHandler)

export default router
