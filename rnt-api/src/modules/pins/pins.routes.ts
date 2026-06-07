import { Router, type RequestHandler } from 'express';
import { createPinHandler, deletePinHandler, getPinByIdHandler, getPinSummariesForTilesHandler, getPinsForTilesHandler, getPinsHandler, likePinHandler, searchPinsHandler, unlikePinHandler, unvisitPinHandler, updatePinHandler, visitPinHandler } from './pins.controller';
import { authMiddleware } from '../../middleware/auth.middleware';
import { createRateLimitMiddleware } from '../../middleware/rate-limit.middleware';
import type { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';
import {
  createPinBodySchema,
  pinListQuerySchema,
  searchPinsQuerySchema,
  summaryTileQueryBodySchema,
  tileQueryBodySchema,
  updatePinBodySchema,
} from './pins.validation';

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
const visitPinRateLimit = createRateLimitMiddleware({
  keyPrefix: "pins:visit",
  windowMs: 60 * 1000,
  max: 60,
});

router.get('/', validate({ query: pinListQuerySchema }), getPinsHandler);
router.get('/search', validate({ query: searchPinsQuerySchema }), searchPinsHandler);
router.post('/tiles/query', validate({ body: tileQueryBodySchema }), getPinsForTilesHandler);
router.post('/tiles/summary', validate({ body: summaryTileQueryBodySchema }), getPinSummariesForTilesHandler);
router.get('/:id', getPinByIdHandler);

router.post('/', authMiddleware, validate({ body: createPinBodySchema }), authenticated(createPinHandler));
router.post('/:id/like', authMiddleware, likePinRateLimit, authenticated(likePinHandler));
router.delete('/:id/like', authMiddleware, likePinRateLimit, authenticated(unlikePinHandler));
router.post('/:id/visit', authMiddleware, visitPinRateLimit, authenticated(visitPinHandler));
router.delete('/:id/visit', authMiddleware, visitPinRateLimit, authenticated(unvisitPinHandler));
router.put('/:id', authMiddleware, validate({ body: updatePinBodySchema }), authenticated(updatePinHandler));
router.delete('/:id', authMiddleware, authenticated(deletePinHandler));

export default router;
