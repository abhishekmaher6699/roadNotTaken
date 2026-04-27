import { Router } from 'express';
import { createCommentHandler, deleteCommentHandler, getCommentsForPinHandler, likeCommentHandler, unlikeCommentHandler } from './comments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { createRateLimitMiddleware } from '../../middleware/rate-limit.middleware';

const router = Router();
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

router.get('/pins/:pinId/comments', getCommentsForPinHandler);
router.post('/', authMiddleware, createCommentRateLimit, createCommentHandler);
router.post('/:id/like', authMiddleware, likeCommentRateLimit, likeCommentHandler);
router.delete('/:id/like', authMiddleware, likeCommentRateLimit, unlikeCommentHandler);
router.delete('/:id', authMiddleware, deleteCommentHandler);

export default router;
