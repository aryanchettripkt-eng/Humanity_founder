import { Router } from 'express';
import { createDraftSchema, createThreadDraft } from '../controllers/drafts.controller.js';
import {
  getThreadCounts,
  getThreadDetail,
  handleSuggestion,
  listThreads,
  listThreadsSchema,
  patchOwnerSchema,
  patchThread,
  patchThreadOwner,
  patchThreadSchema,
  reclassifyThread,
  suggestionSchema,
} from '../controllers/threads.controller.js';
import { requireAuth, requireClientScope, requireRole } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth, requireRole('assistant'));

router.get('/', requireClientScope({ optional: true }), validate(listThreadsSchema), listThreads);
router.get('/counts', requireClientScope({ optional: true }), getThreadCounts);
router.get('/:id', getThreadDetail);
router.patch('/:id', validate(patchThreadSchema), patchThread);
router.patch('/:id/owner', validate(patchOwnerSchema), patchThreadOwner);
router.post('/:id/reclassify', reclassifyThread);
router.post('/:id/suggestion', validate(suggestionSchema), handleSuggestion);
router.post('/:id/drafts', validate(createDraftSchema), createThreadDraft);

export default router;
