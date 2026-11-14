import { Router } from 'express';
import {
  demo,
  demoSchema,
  login,
  loginSchema,
  me,
  signup,
  signupSchema,
} from '../controllers/auth.controller.js';
import { startGoogleLogin } from '../controllers/google.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/signup', authLimiter, validate(signupSchema), signup);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/demo', validate(demoSchema), demo);
router.get('/me', requireAuth, me);
router.get('/google/start', startGoogleLogin);

export default router;

