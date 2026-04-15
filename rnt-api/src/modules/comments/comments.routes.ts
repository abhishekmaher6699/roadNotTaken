import { Router } from 'express';
import { createCommentHandler, getCommentsForPinHandler, deleteCommentHandler } from './comments.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.get('/pins/:pinId/comments', getCommentsForPinHandler);
router.post('/', authMiddleware, createCommentHandler);
router.delete('/:id', authMiddleware, deleteCommentHandler);

export default router;