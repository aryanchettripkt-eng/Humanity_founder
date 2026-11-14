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
import { trimQuotedReplies } from './gmail/mapper.js';

export const PROMPT_VERSION = 'v2';

const MAX_CORRECTIONS = 5;

function buildDateContext(timezone) {
  let tz = timezone || 'Asia/Kolkata';
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
  } catch {
    tz = 'UTC';
  }
  const now = new Date();
  const dateFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const longDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'long' });
  const shortDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' });

  const todayLabel = `${longDayFmt.format(now)} ${dateFmt.format(now)}`;
  const nextDays = [];
  for (let i = 1; i <= 7; i += 1) {
    const d = new Date(now.getTime() + i * 24 * 3600 * 1000);
    nextDays.push(`${shortDayFmt.format(d)} ${dateFmt.format(d)}`);
  }
  return { tz, todayLabel, nextDaysLabel: nextDays.join(', ') };
}

function buildClassificationSystemPrompt({ todayLabel, nextDaysLabel, timezone }) {
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
    `- Extract every concrete date/time/deadline as ISO-8601 with timezone offset (e.g. +05:30) in timezone ${timezone}. Today is ${todayLabel}. Next 7 days: ${nextDaysLabel}.`,
    '- Output ONLY valid JSON matching this exact shape: {"owner":"assistant|client|none","confidence":0.0-1.0,"reason":"...","clientReason":"... or null","category":"meeting|action|update|newsletter|finance|legal|personal|general","isImportant":bool,"actionRequired":bool,"waitingOnOthers":bool,"summary":"...","keyPoints":["max 6"],"entities":[{"type":"meeting|deadline|date","title":"...","startsAt":"ISO-8601","endsAt":"ISO-8601 or null","location":"... or null"}]}.',
  ].join('\n');
}

/**
 * Format recent manual/client corrections as few-shot lines for the prompt (B4.5).
 * Pure function so it can be unit-tested.
 * @param {Array<{ subject?: string, owner: string, participants?: Array<{ email?: string }>, history?: Array<{ to: string, source: string, reason?: string }> }>} threads
 * @returns {string[]}
 */
export function formatCorrections(threads = []) {
  const lines = [];
  for (const t of threads) {
    if (!['assistant', 'client', 'none'].includes(t.owner)) continue;
    const correction = [...(t.history || [])]
      .reverse()
      .find((h) => (h.source === 'manual' || h.source === 'client') && h.to === t.owner);
    if (!correction) continue;
    const sender = t.participants?.[0]?.email || 'unknown sender';
    const subject = String(t.subject || '(no subject)').replace(/\s+/g, ' ').slice(0, 80);
    const by = correction.source === 'client' ? 'the client handed it over' : 'the assistant corrected it';
    const why = String(correction.reason || '').replace(/\s+/g, ' ').slice(0, 120);
    lines.push(`- "${subject}" from ${sender} -> ${t.owner} (${by}${why ? `: ${why}` : ''})`);
    if (lines.length >= MAX_CORRECTIONS) break;
  }
  return lines;
}

/**
 * Load up to 5 recent threads whose owner was set by the assistant or the client,
 * to use as few-shot examples. Never throws: corrections are a hint, not a requirement.
 */
async function loadRecentCorrections(clientId, excludeThreadId) {
  try {
    const threads = await Thread.find({
      clientId,
      _id: { $ne: excludeThreadId },
      ownerSource: { $in: ['manual', 'client'] },
      'history.source': { $in: ['manual', 'client'] },
    })
      .sort({ updatedAt: -1 })
      .limit(MAX_CORRECTIONS * 2)
      .select('subject owner participants history');
    return formatCorrections(threads);
  } catch (err) {
    logger.warn('Could not load correction examples', { message: err?.message });
    return [];
  }
}

function buildClassificationUserPrompt({ client, assistant, messages, corrections = [] }) {
  const recent = messages.slice(-12);
  const older = messages.slice(0, Math.max(0, messages.length - 12));

  const lines = [
    `Client: ${client?.name || 'Client'}, ${client?.title || ''}`,
    `Assistant: ${assistant?.name || 'Assistant'}`,
    `Delegation notes: ${client?.profile?.delegation || 'Standard PA delegation.'}`,
    `VIP senders: ${(client?.profile?.vipSenders || []).join(', ') || 'None'}`,
  ];

  if (corrections.length > 0) {
    lines.push(
      'Recent corrections by the assistant or client (follow these patterns for similar senders and requests):',
      ...corrections
    );
  }

  lines.push('Conversation (oldest -> newest):');

  for (const m of older) {
    lines.push(`- [earlier ${m.direction}] ${m.from?.email}: ${String(m.bodyText || '').slice(0, 120)}`);
  }

  for (const m of recent) {
    const toList = (m.to || []).map((r) => r.email).join(', ');
    const ccList = (m.cc || []).map((r) => r.email).join(', ');
    lines.push(
      `--- [${m.direction}] ${m.from?.name || ''} <${m.from?.email || ''}> · ${new Date(m.sentAt).toISOString()}`,
      `To: ${toList}  Cc: ${ccList}`,
      trimQuotedReplies(String(m.bodyText || '')).slice(0, 2000)
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
  const isFirstClassification = thread.aiStatus === 'pending';
  const isSticky = thread.ownerSource === 'manual' || thread.ownerSource === 'client';
  const matchedRule = await findMatchingRule(thread.clientId, messages);
  const corrections = await loadRecentCorrections(thread.clientId, thread._id);

  const provider = getProvider();
  let aiResult = null;
  let aiFailed = false;
  thread.aiAttempts = (thread.aiAttempts || 0) + 1;

  const { tz, todayLabel, nextDaysLabel } = buildDateContext(client?.timezone);

  try {
    aiResult = await provider.generateJSON({
      system: buildClassificationSystemPrompt({
        todayLabel,
        nextDaysLabel,
        timezone: tz,
      }),
      prompt: buildClassificationUserPrompt({ client, assistant, messages, corrections }),
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
    if (!matchedRule && !isSticky && isFirstClassification) {
      thread.owner = 'review';
      thread.ownerSource = 'ai';
      thread.confidence = 0;
      thread.reason = 'AI unavailable — please review';
    }
  } else {
    thread.aiStatus = 'done';
    thread.aiModel = provider.name;
    thread.category = aiResult.category;
    thread.important = aiResult.isImportant;
    thread.actionRequired = aiResult.actionRequired;
    thread.waitingOnOthers = aiResult.waitingOnOthers;
    thread.summary = aiResult.summary || thread.snippet || thread.subject;
    thread.keyPoints = aiResult.keyPoints;
    thread.entities = (aiResult.entities || [])
      .map((e) => {
        const startsAt = new Date(e.startsAt);
        if (Number.isNaN(startsAt.getTime())) return null;
        const endsAt = e.endsAt ? new Date(e.endsAt) : null;
        return {
          type: e.type,
          title: e.title,
          startsAt,
          ...(endsAt && !Number.isNaN(endsAt.getTime()) ? { endsAt } : {}),
          ...(e.location ? { location: e.location } : {}),
        };
      })
      .filter(Boolean);

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

  const ownerChanged = !isFirstClassification && thread.owner !== prevOwner;

  if (ownerChanged) {
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

  if (ownerChanged && emit) {
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

