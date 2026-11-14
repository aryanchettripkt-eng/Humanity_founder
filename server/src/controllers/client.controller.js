import { z } from 'zod';
import { Message } from '../models/Message.js';
import { Thread } from '../models/Thread.js';
import {
  emitCountsChanged,
  emitDraftCreated,
  emitThreadUpdated,
} from '../realtime/socket.js';
import { recordActivity } from '../services/activity.service.js';
import { generateThreadDraft } from '../services/draft.service.js';
import { notFound } from '../utils/errors.js';

export const clientActionSchema = {
  body: z.object({
    action: z.enum(['handling', 'handled', 'handoff', 'note']),
    note: z.string().trim().max(1000).optional(),
  }),
};

export async function getClientQueue(req, res, next) {
  try {
    const threads = await Thread.find({
      clientId: req.clientId,
      owner: 'client',
      archived: false,
      'handoff.state': { $ne: 'handled' },
    }).sort({ important: -1, lastMessageAt: -1 });

    res.json({ data: threads.map((t) => t.toJSON()) });
  } catch (err) {
    next(err);
  }
}

export async function getClientThreadDetail(req, res, next) {
  try {
    const thread = await Thread.findOne({
      _id: req.params.id,
      clientId: req.clientId,
    });
    if (!thread) return next(notFound('Thread not found'));

    const messages = await Message.find({ threadId: thread._id }).sort({ sentAt: 1 });
    const json = thread.toJSON();
    delete json.history;

    res.json({
      data: {
        ...json,
        messages: messages.map((m) => m.toJSON()),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function postClientAction(req, res, next) {
  try {
    const thread = await Thread.findOne({
      _id: req.params.id,
      clientId: req.clientId,
    });
    if (!thread) return next(notFound('Thread not found'));

    const { action, note } = req.body;
    const now = new Date();
    const prevOwner = thread.owner;
    let activityType = 'client_handling';

    if (action === 'handling') {
      thread.handoff = { state: 'client_handling', at: now };
      activityType = 'client_handling';
    } else if (action === 'handled') {
      thread.handoff = { state: 'handled', at: now };
      thread.status = 'done';
      thread.owner = 'none';
      thread.ownerSource = 'client';
      thread.actionRequired = false;
      activityType = 'client_handled';
    } else if (action === 'handoff' || action === 'note') {
      thread.owner = 'assistant';
      thread.ownerSource = 'client';
      thread.suggestedOwner = undefined;
      thread.handoff = {
        state: 'handed_to_assistant',
        ...(note ? { note } : {}),
        at: now,
      };
      activityType = action === 'note' ? 'client_note' : 'client_handoff';
    }

    if (thread.owner !== prevOwner) {
      thread.history.push({
        at: now,
        from: prevOwner,
        to: thread.owner,
        source: 'client',
        reason: note ? `Client note: ${note}` : `Client action: ${action}`,
      });
    }

    await thread.save();
    const json = thread.toJSON();

    if (action === 'note' && note) {
      const draft = await generateThreadDraft({
        thread,
        tone: 'friendly',
        sourceNote: note,
      });
      emitDraftCreated(thread.clientId, draft.toJSON());
    }

    await recordActivity({
      clientId: thread.clientId,
      actor: { type: 'client', name: req.user.name },
      type: activityType,
      threadId: thread._id,
      payload: {
        subject: thread.subject,
        ...(note ? { note } : {}),
      },
    });

    emitThreadUpdated(thread.clientId, json);
    emitCountsChanged(thread.clientId);

    res.json({ data: json });
  } catch (err) {
    next(err);
  }
}
