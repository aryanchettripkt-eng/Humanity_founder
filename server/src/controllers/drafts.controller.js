import { z } from 'zod';
import { Client } from '../models/Client.js';
import { Draft } from '../models/Draft.js';
import { Message } from '../models/Message.js';
import { Thread } from '../models/Thread.js';
import { emitCountsChanged, emitThreadUpdated } from '../realtime/socket.js';
import { recordActivity } from '../services/activity.service.js';
import { generateThreadDraft, sendSimulatedDraft } from '../services/draft.service.js';
import { badRequest, notFound } from '../utils/errors.js';

export const createDraftSchema = {
  body: z.object({
    tone: z.enum(['formal', 'friendly', 'brief']).default('friendly'),
    instruction: z.string().trim().max(500).optional(),
  }),
};

export const patchDraftSchema = {
  body: z
    .object({
      body: z.string().min(1).optional(),
      subject: z.string().min(1).optional(),
      to: z
        .array(z.object({ name: z.string().default(''), email: z.string().email() }))
        .optional(),
    })
    .refine((o) => Object.keys(o).length > 0, { message: 'No fields to update' }),
};

async function findOwnedDraft(draftId, assistantId) {
  const draft = await Draft.findById(draftId);
  if (!draft) throw notFound('Draft not found');
  const owns = await Client.exists({ _id: draft.clientId, assistantId });
  if (!owns) throw notFound('Draft not found');
  return draft;
}

export async function createThreadDraft(req, res, next) {
  try {
    const thread = await Thread.findById(req.params.id);
    if (!thread) return next(notFound('Thread not found'));

    const owns = await Client.exists({ _id: thread.clientId, assistantId: req.user._id });
    if (!owns) return next(notFound('Thread not found'));

    const draft = await generateThreadDraft({
      thread,
      tone: req.body.tone,
      instruction: req.body.instruction,
      assistantName: req.user.name,
    });

    res.status(201).json({ data: draft.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function patchDraft(req, res, next) {
  try {
    const draft = await findOwnedDraft(req.params.id, req.user._id);
    if (draft.status !== 'draft') {
      return next(badRequest('Cannot edit a draft that has already been sent or discarded'));
    }

    for (const key of ['body', 'subject', 'to']) {
      if (req.body[key] !== undefined) {
        draft[key] = req.body[key];
      }
    }
    draft.createdBy = 'user';
    await draft.save();

    res.json({ data: draft.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function sendDraft(req, res, next) {
  try {
    const existing = await findOwnedDraft(req.params.id, req.user._id);
    if (existing.status !== 'draft') {
      return next(badRequest('Draft has already been sent or discarded'));
    }

    const result = await sendSimulatedDraft(existing.id, req.user._id, req.user.name);
    if (!result) return next(notFound('Draft or thread not found'));

    const { thread } = result;
    const threadJson = thread.toJSON();

    await recordActivity({
      clientId: thread.clientId,
      actor: { type: 'assistant', name: req.user.name },
      type: 'draft_sent',
      threadId: thread._id,
      payload: { subject: thread.subject },
    });

    emitThreadUpdated(thread.clientId, threadJson);
    emitCountsChanged(thread.clientId);

    const messages = await Message.find({ threadId: thread._id }).sort({ sentAt: 1 });
    res.json({
      data: {
        ...threadJson,
        messages: messages.map((m) => m.toJSON()),
        draft: null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDraft(req, res, next) {
  try {
    const draft = await findOwnedDraft(req.params.id, req.user._id);
    draft.status = 'discarded';
    await draft.save();
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

