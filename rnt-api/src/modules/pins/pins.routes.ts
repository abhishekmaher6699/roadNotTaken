import { Router } from 'express';
import { createPinHandler, deletePinHandler, getPinSummariesForTilesHandler, getPinsForTilesHandler, getPinsHandler, searchPinsHandler, updatePinHandler } from './pins.controller';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();

router.get('/', getPinsHandler);
router.get('/search', searchPinsHandler);
router.post('/tiles/query', getPinsForTilesHandler);
router.post('/tiles/summary', getPinSummariesForTilesHandler);

router.post('/', authMiddleware, createPinHandler);
router.put('/:id', authMiddleware, updatePinHandler);
router.delete('/:id', authMiddleware, deletePinHandler);

export default router;
