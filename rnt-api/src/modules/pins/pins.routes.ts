import { Router } from 'express';
import { createPinHandler, deletePinHandler, getPinsHandler } from './pins.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', getPinsHandler);

router.post('/', authMiddleware, createPinHandler);
router.delete('/:id', authMiddleware, deletePinHandler);

export default router;
