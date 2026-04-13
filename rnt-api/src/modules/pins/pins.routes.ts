import { Router } from 'express';
import { createPinHandler, getPinsHandler } from './pins.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', getPinsHandler);

router.post('/', authMiddleware, createPinHandler)

export default router;