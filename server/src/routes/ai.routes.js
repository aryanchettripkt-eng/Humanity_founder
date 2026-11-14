import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  askSchema,
  briefRefreshSchema,
  postAsk,
  postBriefRefresh,
} from '../controllers/ai.controller.js';
import { requireAuth, requireClientScope, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: {
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many AI requests; please wait a moment.',
    },
  },
});

router.use(requireAuth, requireRole('assistant'), aiLimiter, requireClientScope({ optional: true }));

router.post('/ask', validate(askSchema), postAsk);
router.post('/brief/refresh', validate(briefRefreshSchema), postBriefRefresh);

export default router;
