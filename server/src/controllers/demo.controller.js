import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { env } from '../config/env.js';
import { Client } from '../models/Client.js';
import { EmailAccount } from '../models/EmailAccount.js';
import { Message } from '../models/Message.js';
import { Thread } from '../models/Thread.js';
import { emitCountsChanged, emitThreadCreated, emitThreadUpdated } from '../realtime/socket.js';
import { seedDatabase } from '../seed/seed.js';
import { recordActivity } from '../services/activity.service.js';
import { classifyThread } from '../services/classification.service.js';
import { badRequest, forbidden } from '../utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCENARIOS_PATH = path.join(__dirname, '..', 'seed', 'data', 'scenarios.json');

const FALLBACK_SCENARIOS = [
  {
    id: 'investor-term-sheet',
    mode: 'new',
    subject: 'Updated Series A Term Sheet — Signature Requested',
    from: { name: 'Elena Vance', email: 'elena@horizonvc.example.com' },
    bodyText:
      'Hi Priya, we incorporated your counsel’s redlines into the Series A term sheet. Could you review and sign by Friday 5 PM?',
  },
  {
    id: 'dinner-reschedule-flip',
    mode: 'append',
    matchSubject: 'Reschedule Tuesday Coffee with Marcus',
    from: { name: 'Marcus Vance', email: 'marcus@designco.example.com' },
    bodyText:
      'Actually Priya, I also wanted your personal decision on whether you want to join our design advisory board before we meet.',
  },
  {
    id: 'vendor-invoice',
    mode: 'new',
    subject: 'Catering Invoice #1042 for Thursday Offsite',
    from: { name: 'Bistro Catering', email: 'billing@bistrocatering.example.com' },
    bodyText:
      'Hello, please find attached invoice #1042 for Thursday’s offsite lunch. Can you confirm the billing address and schedule payment?',
  },
  {
    id: 'newsletter-digest',
    mode: 'new',
    subject: 'Weekly Founder Digest — Issue #88',
    from: { name: 'Founder Weekly', email: 'digest@founderweekly.example.com' },
    bodyText:
      'Top reads this week in AI and SaaS. Click unsubscribe at the bottom to manage preferences.',
  },
];

let scenarioCursor = 0;

async function loadScenarios() {
  try {
    const raw = await fs.readFile(SCENARIOS_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // scenarios.json not created yet; use fallback
  }
  return FALLBACK_SCENARIOS;
}

export const simulateEmailSchema = {
  body: z.object({
    clientId: z.string().optional(),
    scenarioId: z.string().optional(),
  }),
};

export async function simulateEmail(req, res, next) {
  try {
    if (!env.DEMO_MODE) {
      return next(forbidden('Demo mode is disabled'));
    }
    if (!req.clientId) {
      return next(badRequest('No client available to simulate email'));
    }

    const scenarios = await loadScenarios();
    const scenario = req.body.scenarioId
      ? scenarios.find((s) => s.id === req.body.scenarioId) || scenarios[0]
      : scenarios[scenarioCursor++ % scenarios.length];

    const [client, account] = await Promise.all([
      Client.findById(req.clientId),
      EmailAccount.findOne({ clientId: req.clientId }),
    ]);

    if (!client || !account) {
      return next(badRequest('Client or email account not found'));
    }

    const now = new Date();
    let thread = null;
    let isNew = true;

    if (scenario.mode === 'append' && scenario.matchSubject) {
      thread = await Thread.findOne({
        clientId: client._id,
        subject: scenario.matchSubject,
      });
      if (thread) isNew = false;
    }

    if (!thread) {
      thread = await Thread.create({
        clientId: client._id,
        accountId: account._id,
        subject: scenario.subject || 'New simulated email',
        snippet: String(scenario.bodyText || '').slice(0, 140),
        participants: [scenario.from, { name: client.name, email: client.email }],
        lastMessageAt: now,
        messageCount: 1,
        lastSender: 'them',
        unread: true,
        status: 'open',
        owner: 'review',
        ownerSource: 'ai',
        aiStatus: 'pending',
      });
    } else {
      thread.lastMessageAt = now;
      thread.messageCount += 1;
      thread.lastSender = 'them';
      thread.unread = true;
      thread.snippet = String(scenario.bodyText || '').slice(0, 140);
      await thread.save();
    }

    await Message.create({
      threadId: thread._id,
      clientId: client._id,
      from: scenario.from,
      to: [{ name: client.name, email: client.email }],
      cc: [],
      sentAt: now,
      bodyText: scenario.bodyText,
      direction: 'inbound',
      simulated: true,
    });

    const classified = await classifyThread(thread._id, { emit: false });

    await recordActivity({
      clientId: client._id,
      actor: { type: 'system', name: scenario.from?.name || 'Incoming Mail' },
      type: 'new_email',
      threadId: thread._id,
      payload: { subject: thread.subject, from: scenario.from?.email, isNew },
    });

    if (isNew) {
      emitThreadCreated(client._id, classified);
    } else {
      emitThreadUpdated(client._id, classified);
    }
    emitCountsChanged(client._id);

    res.status(isNew ? 201 : 200).json({ data: classified });
  } catch (err) {
    next(err);
  }
}

export async function resetDemo(_req, res, next) {
  try {
    if (!env.DEMO_MODE) {
      return next(forbidden('Demo mode is disabled'));
    }
    await seedDatabase({ classify: false });
    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}
