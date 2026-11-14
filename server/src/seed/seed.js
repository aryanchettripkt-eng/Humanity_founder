import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../db/connect.js';
import {
  Activity,
  Client,
  Draft,
  EmailAccount,
  Message,
  Rule,
  Thread,
  User,
} from '../models/index.js';
import { classifyThread } from '../services/classification.service.js';
import { logger } from '../utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const THREADS_JSON_PATH = path.join(__dirname, 'data', 'threads.json');

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 3600 * 1000);
}

function getFallbackSeedThreads(priyaEmail, danielEmail) {
  return [
    {
      clientKey: 'priya',
      subject: 'Q3 Board Deck — Final Sign-off Needed',
      participants: [
        { name: 'James Chen', email: 'james@sequoiacap.example.com' },
        { name: 'Priya Raman', email: priyaEmail },
      ],
      owner: 'client',
      ownerSource: 'ai',
      confidence: 0.94,
      reason: 'James asks Priya directly to approve the Q3 board deck before Thursday.',
      clientReason: 'James is waiting on your final approval of the Q3 board deck.',
      category: 'action',
      important: true,
      actionRequired: true,
      waitingOnOthers: false,
      summary: 'Sequoia partner James Chen needs Priya’s final sign-off on the Q3 board deck.',
      keyPoints: ['Final slides attached', 'Approval needed before Thursday'],
      entities: [
        { type: 'deadline', title: 'Board deck sign-off', startsAt: hoursFromNow(36).toISOString() },
      ],
      messages: [
        {
          from: { name: 'James Chen', email: 'james@sequoiacap.example.com' },
          to: [{ name: 'Priya Raman', email: priyaEmail }],
          direction: 'inbound',
          hoursOffset: -4,
          bodyText:
            'Hi Priya, could you review and approve the final Q3 board deck by Thursday afternoon?',
        },
      ],
    },
    {
      clientKey: 'priya',
      subject: 'Reschedule Tuesday Coffee with Marcus',
      participants: [
        { name: 'Marcus Vance', email: 'marcus@designco.example.com' },
        { name: 'Priya Raman', email: priyaEmail },
      ],
      owner: 'assistant',
      ownerSource: 'ai',
      confidence: 0.91,
      reason: 'Routine calendar rescheduling that Alex can coordinate.',
      category: 'meeting',
      important: false,
      actionRequired: true,
      waitingOnOthers: false,
      summary: 'Marcus asked to move Tuesday’s coffee to Wednesday morning.',
      keyPoints: ['Proposes Wed 9:30 AM at Blue Bottle'],
      entities: [
        {
          type: 'meeting',
          title: 'Coffee with Marcus',
          startsAt: hoursFromNow(48).toISOString(),
          location: 'Blue Bottle SOMA',
        },
      ],
      messages: [
        {
          from: { name: 'Marcus Vance', email: 'marcus@designco.example.com' },
          to: [{ name: 'Priya Raman', email: priyaEmail }],
          direction: 'inbound',
          hoursOffset: -6,
          bodyText: 'Hey Priya, can we reschedule Tuesday coffee to Wednesday at 9:30 AM?',
        },
      ],
    },
    {
      clientKey: 'priya',
      subject: 'Stripe Receipt — Raman Studio ($299.00)',
      participants: [{ name: 'Stripe', email: 'receipts@stripe.com' }],
      owner: 'none',
      ownerSource: 'ai',
      confidence: 0.97,
      reason: 'Automated payment receipt; no reply needed.',
      category: 'finance',
      important: false,
      actionRequired: false,
      waitingOnOthers: false,
      summary: 'Monthly Stripe receipt for $299.00.',
      keyPoints: ['Receipt #8492 paid automatically'],
      entities: [],
      messages: [
        {
          from: { name: 'Stripe', email: 'receipts@stripe.com' },
          to: [{ name: 'Priya Raman', email: priyaEmail }],
          direction: 'inbound',
          hoursOffset: -12,
          bodyText: 'Your payment of $299.00 to Acme Cloud has been processed. No reply needed.',
        },
      ],
    },
    {
      clientKey: 'priya',
      subject: 'Quick question',
      participants: [{ name: 'Samir Patel', email: 'samir@unknown.example.com' }],
      owner: 'review',
      ownerSource: 'ai',
      suggestedOwner: 'assistant',
      confidence: 0.54,
      reason: 'Ambiguous request from an unfamiliar sender; needs quick review.',
      category: 'general',
      important: false,
      actionRequired: true,
      waitingOnOthers: false,
      summary: 'Samir wants to chat briefly next week about a potential collaboration.',
      keyPoints: ['Unclear if Priya knows Samir or if Alex should screen'],
      entities: [],
      messages: [
        {
          from: { name: 'Samir Patel', email: 'samir@unknown.example.com' },
          to: [{ name: 'Priya Raman', email: priyaEmail }],
          direction: 'inbound',
          hoursOffset: -2,
          bodyText: 'Hi Priya, quick question — are you around next week for 15 minutes?',
        },
      ],
    },
    {
      clientKey: 'daniel',
      subject: 'Flight confirmation SFO -> JFK',
      participants: [{ name: 'Delta Air Lines', email: 'no-reply@delta.example.com' }],
      owner: 'none',
      ownerSource: 'ai',
      confidence: 0.95,
      reason: 'Automated flight confirmation.',
      category: 'update',
      important: false,
      actionRequired: false,
      waitingOnOthers: false,
      summary: 'Confirmed flight itinerary to JFK.',
      keyPoints: ['Departs Friday 8:15 AM'],
      entities: [
        { type: 'date', title: 'Flight SFO -> JFK', startsAt: hoursFromNow(72).toISOString() },
      ],
      messages: [
        {
          from: { name: 'Delta Air Lines', email: 'no-reply@delta.example.com' },
          to: [{ name: 'Daniel Okafor', email: danielEmail }],
          direction: 'inbound',
          hoursOffset: -20,
          bodyText: 'Your flight DL402 is confirmed for Friday at 8:15 AM.',
        },
      ],
    },
  ];
}

export async function loadSeedThreads(priyaEmail = 'priya@example.com', danielEmail = 'daniel@example.com') {
  try {
    const raw = await fs.readFile(THREADS_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
  } catch {
    // B1.3 threads.json not present yet; use fallback starter threads
  }
  return getFallbackSeedThreads(priyaEmail, danielEmail);
}

/**
 * Create a Thread and its Messages from a seed item.
 * @param {{ client: any, account: any, item: any, pendingAI?: boolean }} params
 */
export async function createThreadWithMessages({ client, account, item, pendingAI = false }) {
  const msgs = item.messages || [];
  const lastMsg = msgs[msgs.length - 1];
  const lastMessageAt = lastMsg?.sentAt
    ? new Date(lastMsg.sentAt)
    : hoursFromNow(lastMsg?.hoursOffset ?? -1);

  const thread = await Thread.create({
    clientId: client._id,
    accountId: account._id,
    subject: item.subject,
    snippet: String(lastMsg?.bodyText || item.snippet || '').slice(0, 140),
    participants: item.participants || [],
    lastMessageAt,
    messageCount: msgs.length,
    lastSender: lastMsg?.direction === 'outbound' ? 'us' : 'them',
    unread: item.unread ?? true,
    important: item.important ?? false,
    archived: item.archived ?? false,
    status: item.status || 'open',
    owner: pendingAI ? 'review' : item.owner || 'review',
    ownerSource: item.ownerSource || 'ai',
    suggestedOwner: pendingAI ? undefined : item.suggestedOwner,
    confidence: pendingAI ? 0 : item.confidence ?? 0.5,
    reason: pendingAI ? '' : item.reason || '',
    clientReason: pendingAI ? undefined : item.clientReason,
    category: item.category || 'general',
    actionRequired: item.actionRequired ?? false,
    waitingOnOthers: item.waitingOnOthers ?? false,
    summary: pendingAI ? '' : item.summary || '',
    keyPoints: pendingAI ? [] : item.keyPoints || [],
    entities: pendingAI
      ? []
      : (item.entities || []).map((e) => ({
          ...e,
          startsAt: new Date(e.startsAt),
          ...(e.endsAt ? { endsAt: new Date(e.endsAt) } : {}),
        })),
    aiStatus: pendingAI ? 'pending' : 'done',
    aiModel: pendingAI ? undefined : 'seed',
  });

  for (const m of msgs) {
    await Message.create({
      threadId: thread._id,
      clientId: client._id,
      from: m.from,
      to: m.to || [{ name: client.name, email: client.email }],
      cc: m.cc || [],
      sentAt: m.sentAt ? new Date(m.sentAt) : hoursFromNow(m.hoursOffset ?? -1),
      bodyText: m.bodyText,
      direction: m.direction || 'inbound',
      simulated: true,
    });
  }

  return thread;
}

/**
 * Reset and re-seed only the demo personas and their data (preserves user IDs & non-demo users).
 * @param {{ classify?: boolean }} [opts]
 */
export async function seedDatabase(opts = {}) {
  const { classify = false } = opts;

  const passwordHash = await bcrypt.hash('demo1234', 10);

  const alex = await User.findOneAndUpdate(
    { email: 'alex@example.com' },
    {
      $set: {
        name: 'Alex Morgan',
        passwordHash,
        role: 'assistant',
        onboarding: { completed: true, tourSeen: false },
      },
    },
    { upsert: true, new: true }
  );

  const priyaClient = await Client.findOneAndUpdate(
    { assistantId: alex._id, email: 'priya@example.com' },
    {
      $set: {
        name: 'Priya Raman',
        firstName: 'Priya',
        title: 'Founder, Raman Studio',
        profile: {
          delegation:
            'Alex handles scheduling, vendors, travel, and routine follow-ups. Priya handles investors, hiring decisions, legal sign-off, and personal notes.',
          vipSenders: ['james@sequoiacap.example.com'],
        },
      },
    },
    { upsert: true, new: true }
  );

  const danielClient = await Client.findOneAndUpdate(
    { assistantId: alex._id, email: 'daniel@example.com' },
    {
      $set: {
        name: 'Daniel Okafor',
        firstName: 'Daniel',
        title: 'Partner, Okafor Ventures',
        profile: {
          delegation:
            'Alex handles travel, calendar, and receipts. Daniel handles LP updates and deal memos.',
          vipSenders: [],
        },
      },
    },
    { upsert: true, new: true }
  );

  const priyaUser = await User.findOneAndUpdate(
    { email: 'priya@example.com' },
    {
      $set: {
        name: 'Priya Raman',
        passwordHash,
        role: 'client',
        clientId: priyaClient._id,
        onboarding: { completed: true, tourSeen: true },
      },
    },
    { upsert: true, new: true }
  );

  const danielUser = await User.findOneAndUpdate(
    { email: 'daniel@example.com' },
    {
      $set: {
        name: 'Daniel Okafor',
        passwordHash,
        role: 'client',
        clientId: danielClient._id,
        onboarding: { completed: true, tourSeen: true },
      },
    },
    { upsert: true, new: true }
  );

  priyaClient.userId = priyaUser._id;
  danielClient.userId = danielUser._id;
  await Promise.all([priyaClient.save(), danielClient.save()]);

  const demoClientIds = [priyaClient._id, danielClient._id];
  await Promise.all([
    EmailAccount.deleteMany({ clientId: { $in: demoClientIds } }),
    Thread.deleteMany({ clientId: { $in: demoClientIds } }),
    Message.deleteMany({ clientId: { $in: demoClientIds } }),
    Draft.deleteMany({ clientId: { $in: demoClientIds } }),
    Rule.deleteMany({ clientId: { $in: demoClientIds } }),
    Activity.deleteMany({ clientId: { $in: demoClientIds } }),
  ]);

  const priyaAccount = await EmailAccount.create({
    clientId: priyaClient._id,
    assistantId: alex._id,
    provider: 'gmail',
    address: 'priya@ramanstudio.com',
    status: 'connected',
    lastSyncedAt: new Date(),
    simulated: true,
  });

  const danielAccount = await EmailAccount.create({
    clientId: danielClient._id,
    assistantId: alex._id,
    provider: 'outlook',
    address: 'daniel@okafor.vc',
    status: 'connected',
    lastSyncedAt: new Date(),
    simulated: true,
  });

  const clientMap = {
    priya: { client: priyaClient, account: priyaAccount },
    daniel: { client: danielClient, account: danielAccount },
  };

  const seedThreads = await loadSeedThreads(priyaClient.email, danielClient.email);
  const createdThreadIds = [];

  for (const item of seedThreads) {
    const target = clientMap[item.clientKey || 'priya'] || clientMap.priya;
    const thread = await createThreadWithMessages({
      client: target.client,
      account: target.account,
      item,
      pendingAI: classify,
    });
    createdThreadIds.push(thread._id);
  }

  if (classify) {
    for (const tid of createdThreadIds) {
      await classifyThread(tid, { fast: true, emit: false });
    }
  }

  return {
    users: 3,
    clients: 2,
    accounts: 2,
    threads: createdThreadIds.length,
  };
}

// Allow CLI execution: `node src/seed/seed.js [--classify]`
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const classify = process.argv.includes('--classify');
  connectDB()
    .then(() => seedDatabase({ classify }))
    .then((summary) => {
      logger.info('Seed completed', summary);
      return disconnectDB();
    })
    .catch((err) => {
      logger.error('Seed failed', { message: err?.message });
      process.exit(1);
    });
}

