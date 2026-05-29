import { Router, type RequestHandler } from 'express';
import { createPinHandler, deletePinHandler, getPinByIdHandler, getPinSummariesForTilesHandler, getPinsForTilesHandler, getPinsHandler, likePinHandler, searchPinsHandler, unlikePinHandler, updatePinHandler } from './pins.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { createRateLimitMiddleware } from '../../middleware/rate-limit.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';

const router = Router();
const authenticated = (
  handler: (req: AuthenticatedRequest, res: Parameters<RequestHandler>[1]) => Promise<unknown>,
): RequestHandler => (req, res, next) => {
  void handler(req as AuthenticatedRequest, res).catch(next);
};
const likePinRateLimit = createRateLimitMiddleware({
  keyPrefix: "pins:like",
  windowMs: 60 * 1000,
  max: 60,
});

router.get('/', getPinsHandler);
router.get('/search', searchPinsHandler);
router.post('/tiles/query', getPinsForTilesHandler);
router.post('/tiles/summary', getPinSummariesForTilesHandler);
router.get('/:id', getPinByIdHandler);

router.post('/', authMiddleware, authenticated(createPinHandler));
router.post('/:id/like', authMiddleware, likePinRateLimit, authenticated(likePinHandler));
router.delete('/:id/like', authMiddleware, likePinRateLimit, authenticated(unlikePinHandler));
router.put('/:id', authMiddleware, authenticated(updatePinHandler));
router.delete('/:id', authMiddleware, authenticated(deletePinHandler));

export default router;
