import { Router } from 'express';
import {
  clientActionSchema,
  getClientQueue,
  getClientThreadDetail,
  postClientAction,
} from '../controllers/client.controller.js';
import { requireAuth, requireClientScope, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth, requireRole('client'), requireClientScope());

router.get('/queue', getClientQueue);
router.get('/threads/:id', getClientThreadDetail);
router.post('/threads/:id/action', validate(clientActionSchema), postClientAction);

export default router;

