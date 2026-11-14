import { Router } from 'express';
import { env } from '../config/env.js';
import accountsRoutes from './accounts.routes.js';
import activityRoutes from './activity.routes.js';
import aiRoutes from './ai.routes.js';
import authRoutes from './auth.routes.js';
import clientRoutes from './client.routes.js';
import dashboardRoutes from './dashboard.routes.js';
import demoRoutes from './demo.routes.js';
import draftsRoutes from './drafts.routes.js';
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
router.use('/drafts', draftsRoutes);
router.use('/client', clientRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/activity', activityRoutes);
router.use('/ai', aiRoutes);
router.use('/demo', demoRoutes);

export default router;

