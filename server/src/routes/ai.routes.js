import { Router } from 'express';
import {
  askSchema,
  briefRefreshSchema,
  postAsk,
  postBriefRefresh,
} from '../controllers/ai.controller.js';
import { requireAuth, requireClientScope, requireRole } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth, requireRole('assistant'), aiLimiter, requireClientScope({ optional: true }));

router.post('/ask', validate(askSchema), postAsk);
router.post('/brief/refresh', validate(briefRefreshSchema), postBriefRefresh);

export default router;

