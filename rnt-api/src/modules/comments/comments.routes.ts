import { Router } from 'express';
import { createCommentHandler, deleteCommentHandler, getCommentsForPinHandler, likeCommentHandler, unlikeCommentHandler } from './comments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.get('/pins/:pinId/comments', getCommentsForPinHandler);
router.post('/', authMiddleware, createCommentHandler);
router.post('/:id/like', authMiddleware, likeCommentHandler);
router.delete('/:id/like', authMiddleware, unlikeCommentHandler);
router.delete('/:id', authMiddleware, deleteCommentHandler);

export default router;
