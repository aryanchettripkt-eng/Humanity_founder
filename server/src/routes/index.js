import { Router } from 'express';
import { env } from '../config/env.js';
import accountsRoutes from './accounts.routes.js';
import authRoutes from './auth.routes.js';
import threadsRoutes from './threads.routes.js';

const router = Router();

export function healthHandler(_req, res) {
  res.json({
    data: {
      ok: true,
      ai: env.effectiveAiProvider,
    },
  });
}

router.get('/health', healthHandler);
router.use('/auth', authRoutes);
router.use('/accounts', accountsRoutes);
router.use('/threads', threadsRoutes);

export default router;

