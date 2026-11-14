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
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', validate(loginSchema), login);
router.post('/demo', validate(demoSchema), demo);
router.get('/me', requireAuth, me);

export default router;

