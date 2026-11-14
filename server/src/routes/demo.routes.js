import { Router } from 'express';
import { resetDemo, simulateEmail, simulateEmailSchema } from '../controllers/demo.controller.js';
import { requireAuth, requireClientScope, requireRole } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth, requireRole('assistant'));

router.post(
  '/simulate-email',
  aiLimiter,
  requireClientScope({ optional: true }),
  validate(simulateEmailSchema),
  simulateEmail
);
router.post('/reset', resetDemo);

export default router;

