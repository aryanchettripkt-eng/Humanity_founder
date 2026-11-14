import { Router } from 'express';
import {
  authorizeAccount,
  authorizeAccountSchema,
  connectAccount,
  connectAccountSchema,
  disconnectAccount,
  listAccounts,
  syncAccount,
} from '../controllers/accounts.controller.js';
import {
  completeGmailConnect,
  completeGmailSchema,
  startGmailConnect,
  startGmailSchema,
} from '../controllers/google.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth, requireRole('assistant'));

router.get('/', listAccounts);
router.post('/connect', validate(connectAccountSchema), connectAccount);
router.post('/gmail/start', validate(startGmailSchema), startGmailConnect);
router.post('/gmail/complete', validate(completeGmailSchema), completeGmailConnect);
router.post('/:id/authorize', validate(authorizeAccountSchema), authorizeAccount);
router.post('/:id/sync', syncAccount);
router.delete('/:id', disconnectAccount);

export default router;

