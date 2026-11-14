import { Router } from 'express';
import { resetDemo, simulateEmail, simulateEmailSchema } from '../controllers/demo.controller.js';
import { requireAuth, requireClientScope, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth, requireRole('assistant'));

router.post(
  '/simulate-email',
  requireClientScope({ optional: true }),
  validate(simulateEmailSchema),
  simulateEmail
);
router.post('/reset', resetDemo);

export default router;
