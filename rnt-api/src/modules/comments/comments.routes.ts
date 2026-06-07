import { Router, type RequestHandler } from 'express';
import { createCommentHandler, deleteCommentHandler, getCommentsForPinHandler, likeCommentHandler, unlikeCommentHandler } from './comments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { createRateLimitMiddleware } from '../../middleware/rate-limit.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  commentPageQuerySchema,
  createCommentBodySchema,
} from './comments.validation';

const router = Router();
const authenticated = (
  handler: (req: AuthenticatedRequest, res: Parameters<RequestHandler>[1]) => Promise<unknown>,
): RequestHandler => (req, res, next) => {
  void handler(req as AuthenticatedRequest, res).catch(next);
};
const createCommentRateLimit = createRateLimitMiddleware({
  keyPrefix: "comments:create",
  windowMs: 5 * 60 * 1000,
  max: 12,
});
const likeCommentRateLimit = createRateLimitMiddleware({
  keyPrefix: "comments:like",
  windowMs: 60 * 1000,
  max: 60,
});

router.get(
  '/pins/:pinId/comments',
  validate({ query: commentPageQuerySchema }),
  getCommentsForPinHandler,
);
router.post(
  '/',
  authMiddleware,
  createCommentRateLimit,
  validate({ body: createCommentBodySchema }),
  authenticated(createCommentHandler),
);
router.post('/:id/like', authMiddleware, likeCommentRateLimit, authenticated(likeCommentHandler));
router.delete('/:id/like', authMiddleware, likeCommentRateLimit, authenticated(unlikeCommentHandler));
router.delete('/:id', authMiddleware, authenticated(deleteCommentHandler));

export default router;
