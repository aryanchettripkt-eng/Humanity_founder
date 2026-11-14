import { Router } from 'express';
import { listActivity } from '../controllers/dashboard.controller.js';
import { requireAuth, requireClientScope, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('assistant'), requireClientScope({ optional: true }));
router.get('/', listActivity);

export default router;
