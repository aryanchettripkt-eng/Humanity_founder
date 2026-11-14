import { Router } from 'express';
import { env } from '../config/env.js';

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

export default router;

