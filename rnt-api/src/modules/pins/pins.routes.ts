import { Router } from 'express';
import { createPinHandler, deletePinHandler, getPinSummariesForTilesHandler, getPinsForTilesHandler, getPinsHandler, likePinHandler, searchPinsHandler, unlikePinHandler, updatePinHandler } from './pins.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { createRateLimitMiddleware } from '../../middleware/rate-limit.middleware';

const router = Router();
const likePinRateLimit = createRateLimitMiddleware({
  keyPrefix: "pins:like",
  windowMs: 60 * 1000,
  max: 60,
});

router.get('/', getPinsHandler);
router.get('/search', searchPinsHandler);
router.post('/tiles/query', getPinsForTilesHandler);
router.post('/tiles/summary', getPinSummariesForTilesHandler);

router.post('/', authMiddleware, createPinHandler);
router.post('/:id/like', authMiddleware, likePinRateLimit, likePinHandler);
router.delete('/:id/like', authMiddleware, likePinRateLimit, unlikePinHandler);
router.put('/:id', authMiddleware, updatePinHandler);
router.delete('/:id', authMiddleware, deletePinHandler);

export default router;
