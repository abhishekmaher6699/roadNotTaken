import { Router } from 'express';
import { createPinHandler, deletePinHandler, getPinsForTilesHandler, getPinsHandler, updatePinHandler } from './pins.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', getPinsHandler);
router.post('/tiles/query', getPinsForTilesHandler);

router.post('/', authMiddleware, createPinHandler);
router.put('/:id', authMiddleware, updatePinHandler);
router.delete('/:id', authMiddleware, deletePinHandler);

export default router;
