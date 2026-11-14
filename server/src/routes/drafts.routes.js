import { Router } from 'express';
import {
  deleteDraft,
  patchDraft,
  patchDraftSchema,
  sendDraft,
} from '../controllers/drafts.controller.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth, requireRole('assistant'));

router.patch('/:id', validate(patchDraftSchema), patchDraft);
router.post('/:id/send', sendDraft);
router.delete('/:id', deleteDraft);

export default router;
