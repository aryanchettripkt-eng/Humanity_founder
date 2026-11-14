import { getProvider } from '../ai/index.js';
import { classificationSchema } from '../ai/schemas.js';
import { env } from '../config/env.js';
import { Client } from '../models/Client.js';
import { Message } from '../models/Message.js';
import { Rule } from '../models/Rule.js';
import { Thread } from '../models/Thread.js';
import { User } from '../models/User.js';
import { emitCountsChanged, emitThreadUpdated } from '../realtime/socket.js';
import { logger } from '../utils/logger.js';
import { recordActivity } from './activity.service.js';

export const PROMPT_VERSION = 'v1';

function buildClassificationSystemPrompt({ today, timezone }) {
  return [
    'You triage email for a personal assistant (PA) who manages the inbox of their client.',
    'Decide WHO must reply to the conversation:',
    '- "assistant": the PA can handle it on the client\'s behalf — scheduling/rescheduling, logistics, routine vendor or business inquiries, follow-ups on pending requests, admin, travel, invoices/payments processing.',
    '- "client": only the client can reply — personal decisions or approvals, sensitive business matters (investors, legal, hiring/firing, compensation, negotiations), messages explicitly asking for the client\'s own input/opinion, close personal relationships, anything requiring the client\'s signature.',
    '- "none": no reply needed — newsletters, notifications, receipts, automated messages, FYIs, cc-only updates, or threads already resolved (e.g. last message is a thank-you/confirmation).',
    'Rules:',
    '- Consider the WHOLE conversation; the latest message matters most. If the PA already replied and the other side has not answered, owner is "none" and waitingOnOthers = true.',
    '- Do not default to a reply. Most automated or informational mail is "none".',
    '- confidence reflects how clearly the evidence supports the owner (0.9+ explicit, 0.7–0.9 strong signals, <0.7 ambiguous).',
    '- reason: one sentence that cites the evidence.',
    `- Extract every concrete date/time/deadline as ISO-8601 in timezone ${timezone}. Today is ${today}.`,
    '- Output ONLY valid JSON matching the schema: { owner, confidence, reason, clientReason, category, isImportant, actionRequired, waitingOnOthers, summary, keyPoints, entities }.',
  ].join('\n');
}

function buildClassificationUserPrompt({ client, assistant, messages }) {
  const recent = messages.slice(-12);
  const older = messages.slice(0, Math.max(0, messages.length - 12));

  const lines = [
    `Client: ${client?.name || 'Client'}, ${client?.title || ''}`,
    `Assistant: ${assistant?.name || 'Assistant'}`,
    `Delegation notes: ${client?.profile?.delegation || 'Standard PA delegation.'}`,
    `VIP senders: ${(client?.profile?.vipSenders || []).join(', ') || 'None'}`,
    'Conversation (oldest -> newest):',
  ];

  for (const m of older) {
    lines.push(`- [earlier ${m.direction}] ${m.from?.email}: ${String(m.bodyText || '').slice(0, 120)}`);
  }

  for (const m of recent) {
    const toList = (m.to || []).map((r) => r.email).join(', ');
    const ccList = (m.cc || []).map((r) => r.email).join(', ');
    lines.push(
      `--- [${m.direction}] ${m.from?.name || ''} <${m.from?.email || ''}> · ${new Date(m.sentAt).toISOString()}`,
      `To: ${toList}  Cc: ${ccList}`,
      String(m.bodyText || '').slice(0, 2000)
    );
  }

  return lines.join('\n');
}

/**
 * Find a matching Rule for the latest inbound sender or domain.
 * @param {string | import('mongoose').Types.ObjectId} clientId
 * @param {Array<{ direction: string, from?: { email?: string } }>} messages
 */
async function findMatchingRule(clientId, messages) {
  const latestInbound = [...messages].reverse().find((m) => m.direction === 'inbound');
  const email = latestInbound?.from?.email?.toLowerCase();
  if (!email) return null;

  const domain = email.split('@')[1];
  const senderRule = await Rule.findOne({
    clientId,
    'match.type': 'sender',
    'match.value': email,
  });
  if (senderRule) return senderRule;

  if (domain) {
    return Rule.findOne({
      clientId,
      'match.type': 'domain',
      'match.value': domain,
    });
  }
  return null;
}

/**
 * Run the classification pipeline on a thread (BACKEND §5.3 & §5.4).
 * Never throws on AI failure — falls back to `owner: 'review'` with `aiStatus: 'failed'`.
 * @param {string | import('mongoose').Types.ObjectId} threadId
 * @param {{ fast?: boolean, emit?: boolean }} [opts]
 */
export async function classifyThread(threadId, opts = {}) {
  const { fast = false, emit = true } = opts;
  const thread = await Thread.findById(threadId);
  if (!thread) return null;

  const [messages, client] = await Promise.all([
    Message.find({ threadId: thread._id }).sort({ sentAt: 1 }),
    Client.findById(thread.clientId),
  ]);
  const assistant = client?.assistantId ? await User.findById(client.assistantId) : null;

  const prevOwner = thread.owner;
  const isSticky = thread.ownerSource === 'manual' || thread.ownerSource === 'client';
  const matchedRule = await findMatchingRule(thread.clientId, messages);

  const provider = getProvider();
  let aiResult = null;
  let aiFailed = false;

  try {
    aiResult = await provider.generateJSON({
      system: buildClassificationSystemPrompt({
        today: new Date().toISOString().slice(0, 10),
        timezone: 'UTC',
      }),
      prompt: buildClassificationUserPrompt({ client, assistant, messages }),
      schema: classificationSchema,
      fast,
    });
  } catch (err) {
    aiFailed = true;
    logger.warn('AI classification failed; using safe fallback', {
      threadId: thread.id,
      message: err?.message,
    });
  }

  if (aiFailed || !aiResult) {
    thread.aiStatus = 'failed';
    thread.summary = thread.summary || thread.snippet || thread.subject;
    if (!matchedRule && !isSticky) {
      thread.owner = 'review';
      thread.ownerSource = 'ai';
      thread.confidence = 0;
      thread.reason = 'AI unavailable — please review';
    }
  } else {
    thread.aiStatus = 'done';
    thread.aiModel = provider.name;
    thread.category = aiResult.category;
    thread.isImportant = undefined;
    thread.important = aiResult.isImportant;
    thread.actionRequired = aiResult.actionRequired;
    thread.waitingOnOthers = aiResult.waitingOnOthers;
    thread.summary = aiResult.summary;
    thread.keyPoints = aiResult.keyPoints;
    thread.entities = (aiResult.entities || [])
      .map((e) => ({
        type: e.type,
        title: e.title,
        startsAt: new Date(e.startsAt),
        ...(e.endsAt ? { endsAt: new Date(e.endsAt) } : {}),
        ...(e.location ? { location: e.location } : {}),
      }))
      .filter((e) => !Number.isNaN(e.startsAt.getTime()));

    if (matchedRule) {
      matchedRule.hits += 1;
      await matchedRule.save();
      if (!isSticky) {
        thread.owner = matchedRule.owner;
        thread.ownerSource = 'rule';
        thread.confidence = 1;
        thread.reason = `Rule: emails from ${matchedRule.match.value} go to ${matchedRule.owner}`;
        thread.suggestedOwner = undefined;
      }
    } else if (isSticky) {
      // Sticky owner: never overwrite silently; suggest if AI disagrees with >= 0.85 confidence
      if (aiResult.owner !== thread.owner && aiResult.confidence >= 0.85) {
        thread.suggestedOwner = aiResult.owner;
      } else {
        thread.suggestedOwner = undefined;
      }
    } else {
      const belowThreshold = aiResult.confidence < env.AI_CONFIDENCE_THRESHOLD;
      thread.owner = belowThreshold ? 'review' : aiResult.owner;
      thread.ownerSource = 'ai';
      thread.suggestedOwner = belowThreshold ? aiResult.owner : undefined;
      thread.confidence = aiResult.confidence;
      thread.reason = aiResult.reason;
      thread.clientReason = aiResult.clientReason || undefined;
    }
  }

  if (matchedRule && aiFailed && !isSticky) {
    thread.owner = matchedRule.owner;
    thread.ownerSource = 'rule';
    thread.confidence = 1;
    thread.reason = `Rule: emails from ${matchedRule.match.value} go to ${matchedRule.owner}`;
  }

  if (thread.owner !== prevOwner) {
    thread.history.push({
      at: new Date(),
      from: prevOwner,
      to: thread.owner,
      source: thread.ownerSource,
      reason: thread.reason,
    });
    thread.reclassifiedAt = new Date();
  }

  await thread.save();
  const json = thread.toJSON();

  if (thread.owner !== prevOwner && emit) {
    await recordActivity({
      clientId: thread.clientId,
      actor: { type: 'ai', name: 'Relay AI' },
      type: 'reclassified',
      threadId: thread._id,
      payload: { from: prevOwner, to: thread.owner, reason: thread.reason, subject: thread.subject },
    });
  }

  if (emit) {
    emitThreadUpdated(thread.clientId, json);
    emitCountsChanged(thread.clientId);
  }

  return json;
}
