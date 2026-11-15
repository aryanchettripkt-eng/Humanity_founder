import { z } from 'zod';
import { Draft } from '../models/Draft.js';
import { Message } from '../models/Message.js';
import { Rule } from '../models/Rule.js';
import { Thread } from '../models/Thread.js';
import { emitCountsChanged, emitThreadUpdated } from '../realtime/socket.js';
import { recordActivity } from '../services/activity.service.js';
import { classifyThread } from '../services/classification.service.js';
import { computeSegmentCounts, SEGMENT_IDS, segmentFilter } from '../services/segments.js';
import { badRequest, notFound } from '../utils/errors.js';

export const listThreadsSchema = {
  query: z.object({
    clientId: z.string().optional(),
    segment: z.enum(SEGMENT_IDS).optional().default('inbox'),
    q: z.string().trim().optional(),
    filters: z.string().optional(),
    handoff: z.enum(['client_handling', 'handed_to_assistant', 'handled']).optional(),
    account: z.string().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(50),
  }),
};

export const patchThreadSchema = {
  body: z
    .object({
      unread: z.boolean().optional(),
      important: z.boolean().optional(),
      archived: z.boolean().optional(),
      status: z.enum(['open', 'done']).optional(),
    })
    .refine((obj) => Object.keys(obj).length > 0, { message: 'No fields to update' }),
};

export const patchOwnerSchema = {
  body: z.object({
    owner: z.enum(['assistant', 'client', 'none', 'review']),
    remember: z.enum(['sender', 'domain']).nullable().optional(),
  }),
};

export const suggestionSchema = {
  body: z.object({
    action: z.enum(['apply', 'dismiss']),
  }),
};

async function assertAssistantThread(threadId, assistantId) {
  const thread = await Thread.findById(threadId);
  if (!thread) throw notFound('Thread not found');
  // Verify client belongs to assistant
  const { Client } = await import('../models/Client.js');
  const owns = await Client.exists({ _id: thread.clientId, assistantId });
  if (!owns) throw notFound('Thread not found');
  return thread;
}

export async function listThreads(req, res, next) {
  try {
    if (!req.clientId) {
      return res.json({ data: [], meta: { total: 0, page: 1, pageSize: req.query.pageSize } });
    }

    const { segment, q, filters, handoff, account, page, pageSize } = req.query;
    const query = {
      clientId: req.clientId,
      ...segmentFilter(segment),
    };

    if (account) {
      query.accountId = account;
    }

    if (handoff) {
      query['handoff.state'] = handoff;
    }

    if (filters) {
      const parts = filters.split(',').map((s) => s.trim());
      if (parts.includes('unread')) query.unread = true;
      if (parts.includes('important')) query.important = true;
      if (parts.includes('dated')) query['entities.0'] = { $exists: true };
    }

    if (q) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escaped, 'i');
      const bodyMatchedThreadIds = await Message.distinct('threadId', {
        clientId: req.clientId,
        bodyText: regex,
      });
      const searchCond = {
        $or: [
          { subject: regex },
          { snippet: regex },
          { summary: regex },
          { 'participants.email': regex },
          { 'participants.name': regex },
          ...(bodyMatchedThreadIds.length > 0 ? [{ _id: { $in: bodyMatchedThreadIds } }] : []),
        ],
      };
      if (query.$or) {
        query.$and = [{ $or: query.$or }, searchCond];
        delete query.$or;
      } else {
        Object.assign(query, searchCond);
      }
    }

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      Thread.find(query).sort({ lastMessageAt: -1 }).skip(skip).limit(pageSize),
      Thread.countDocuments(query),
    ]);

    res.json({
      data: items.map((t) => t.toJSON()),
      meta: { total, page, pageSize },
    });
  } catch (err) {
    next(err);
  }
}

export async function getThreadCounts(req, res, next) {
  try {
    if (!req.clientId) {
      const empty = Object.fromEntries(SEGMENT_IDS.map((s) => [s, 0]));
      return res.json({ data: empty });
    }
    const counts = await computeSegmentCounts(req.clientId);
    res.json({ data: counts });
  } catch (err) {
    next(err);
  }
}

export async function getThreadDetail(req, res, next) {
  try {
    const thread = await assertAssistantThread(req.params.id, req.user._id);
    const [messages, draft] = await Promise.all([
      Message.find({ threadId: thread._id }).sort({ sentAt: 1 }),
      Draft.findOne({ threadId: thread._id, status: 'draft' }).sort({ updatedAt: -1 }),
    ]);

    res.json({
      data: {
        ...thread.toJSON(),
        messages: messages.map((m) => m.toJSON()),
        draft: draft ? draft.toJSON() : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function patchThread(req, res, next) {
  try {
    const thread = await assertAssistantThread(req.params.id, req.user._id);
    const updates = req.body;
    for (const key of ['unread', 'important', 'archived', 'status']) {
      if (updates[key] !== undefined) {
        thread[key] = updates[key];
      }
    }
    await thread.save();
    const json = thread.toJSON();
    emitThreadUpdated(thread.clientId, json);
    emitCountsChanged(thread.clientId);
    res.json({ data: json });
  } catch (err) {
    next(err);
  }
}

export async function patchThreadOwner(req, res, next) {
  try {
    const thread = await assertAssistantThread(req.params.id, req.user._id);
    const { owner, remember } = req.body;
    const prevOwner = thread.owner;

    thread.owner = owner;
    thread.ownerSource = 'manual';
    thread.suggestedOwner = undefined;
    if (owner !== prevOwner) {
      thread.history.push({
        at: new Date(),
        from: prevOwner,
        to: owner,
        source: 'manual',
        reason: `Changed manually by ${req.user.name}`,
      });
    }

    if (remember && owner !== 'review') {
      const latestInbound = await Message.findOne({
        threadId: thread._id,
        direction: 'inbound',
      }).sort({ sentAt: -1 });
      const senderEmail =
        latestInbound?.from?.email || thread.participants?.[0]?.email || null;
      if (senderEmail) {
        const value =
          remember === 'domain' ? senderEmail.split('@')[1] : senderEmail.toLowerCase();
        if (value) {
          await Rule.findOneAndUpdate(
            { clientId: thread.clientId, 'match.type': remember, 'match.value': value },
            {
              $set: { owner, createdFromThreadId: thread._id },
              $setOnInsert: { hits: 0 },
            },
            { upsert: true, new: true }
          );
        }
      }
    }

    await thread.save();
    const json = thread.toJSON();

    if (owner !== prevOwner) {
      await recordActivity({
        clientId: thread.clientId,
        actor: { type: 'assistant', name: req.user.name },
        type: 'owner_changed',
        threadId: thread._id,
        payload: { from: prevOwner, to: owner, subject: thread.subject },
      });
    }

    emitThreadUpdated(thread.clientId, json);
    emitCountsChanged(thread.clientId);
    res.json({ data: json });
  } catch (err) {
    next(err);
  }
}

export async function reclassifyThread(req, res, next) {
  try {
    const thread = await assertAssistantThread(req.params.id, req.user._id);
    const updated = await classifyThread(thread._id, { emit: true });
    const [messages, draft] = await Promise.all([
      Message.find({ threadId: thread._id }).sort({ sentAt: 1 }),
      Draft.findOne({ threadId: thread._id, status: 'draft' }).sort({ updatedAt: -1 }),
    ]);

    res.json({
      data: {
        ...updated,
        messages: messages.map((m) => m.toJSON()),
        draft: draft ? draft.toJSON() : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function handleSuggestion(req, res, next) {
  try {
    const thread = await assertAssistantThread(req.params.id, req.user._id);
    const { action } = req.body;

    if (action === 'apply') {
      if (!thread.suggestedOwner) {
        return next(badRequest('No AI suggestion to apply'));
      }
      const prevOwner = thread.owner;
      thread.owner = thread.suggestedOwner;
      thread.ownerSource = 'ai';
      thread.suggestedOwner = undefined;
      thread.history.push({
        at: new Date(),
        from: prevOwner,
        to: thread.owner,
        source: 'ai',
        reason: 'Applied AI suggestion',
      });
    } else {
      thread.suggestedOwner = undefined;
    }

    await thread.save();
    const json = thread.toJSON();
    emitThreadUpdated(thread.clientId, json);
    emitCountsChanged(thread.clientId);
    res.json({ data: json });
  } catch (err) {
    next(err);
  }
}

