import { getProvider } from '../ai/index.js';
import { Client } from '../models/Client.js';
import { Draft } from '../models/Draft.js';
import { Message } from '../models/Message.js';
import { Thread } from '../models/Thread.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

/**
 * Generate an AI reply draft for a thread (BACKEND §5.6).
 * @param {{
 *   thread: import('mongoose').Document,
 *   tone?: 'formal'|'friendly'|'brief',
 *   instruction?: string,
 *   sourceNote?: string,
 *   assistantName?: string,
 * }} opts
 */
export async function generateThreadDraft({
  thread,
  tone = 'friendly',
  instruction,
  sourceNote,
  assistantName = 'Assistant',
}) {
  const [messages, client] = await Promise.all([
    Message.find({ threadId: thread._id }).sort({ sentAt: 1 }),
    Client.findById(thread.clientId),
  ]);

  const assistant = client?.assistantId ? await User.findById(client.assistantId) : null;
  const resolvedAssistantName = assistant?.name || assistantName;

  const latestInbound = [...messages].reverse().find((m) => m.direction === 'inbound');
  const to = latestInbound?.from?.email
    ? [{ name: latestInbound.from.name || '', email: latestInbound.from.email }]
    : thread.participants?.slice(0, 1) || [];

  const subject = thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`;

  const signature =
    thread.owner === 'assistant'
      ? `${resolvedAssistantName}, on behalf of ${client?.name || 'Client'}`
      : client?.name || resolvedAssistantName;

  const system = [
    'You draft email replies for an executive and their personal assistant.',
    `Tone: ${tone}.`,
    tone === 'brief' ? 'Keep it <= 100 words.' : 'Keep it concise and clear.',
    'Output plain text email body only (no Subject line).',
    'Never invent facts, times, or dates not present in the conversation or instruction; use [placeholder] if missing.',
    `Sign off as: ${signature}`,
  ].join('\n');

  const convo = messages
    .slice(-8)
    .map((m) => `[${m.direction}] ${m.from?.name || m.from?.email}: ${m.bodyText}`)
    .join('\n---\n');

  const promptParts = [`Subject: ${thread.subject}`, `Conversation:\n${convo}`];
  if (sourceNote) promptParts.push(`Client note to turn into reply: "${sourceNote}"`);
  if (instruction) promptParts.push(`Assistant instruction: "${instruction}"`);

  let body;
  try {
    const provider = getProvider();
    body = await provider.generateText({ system, prompt: promptParts.join('\n\n') });
  } catch (err) {
    logger.warn('AI draft generation failed; using template fallback', { message: err?.message });
    body = `Hi,\n\nThank you for your email regarding "${thread.subject}".${
      sourceNote ? ` ${sourceNote}` : ''
    }\n\nBest,\n${signature}`;
  }

  // Replace or create active draft
  const existing = await Draft.findOne({ threadId: thread._id, status: 'draft' }).sort({
    updatedAt: -1,
  });
  if (existing) {
    existing.tone = tone;
    existing.instruction = instruction;
    existing.sourceNote = sourceNote;
    existing.to = to;
    existing.subject = subject;
    existing.body = body;
    existing.createdBy = 'ai';
    await existing.save();
    return existing;
  }

  return Draft.create({
    threadId: thread._id,
    clientId: thread.clientId,
    createdBy: 'ai',
    tone,
    instruction,
    sourceNote,
    to,
    subject,
    body,
    status: 'draft',
  });
}

/**
 * Mark a draft as sent (simulated) and append outbound Message + update Thread.
 * @param {string} draftId
 * @param {string} assistantId
 * @param {string} actorName
 */
export async function sendSimulatedDraft(draftId, assistantId, actorName) {
  const draft = await Draft.findById(draftId);
  if (!draft) return null;

  const client = await Client.findOne({ _id: draft.clientId, assistantId });
  if (!client) return null;

  const thread = await Thread.findById(draft.threadId);
  if (!thread) return null;

  draft.status = 'sent';
  await draft.save();

  const now = new Date();
  await Message.create({
    threadId: thread._id,
    clientId: thread.clientId,
    from: { name: client.name, email: client.email },
    to: draft.to,
    cc: [],
    sentAt: now,
    bodyText: draft.body,
    direction: 'outbound',
    simulated: true,
  });

  const prevOwner = thread.owner;
  thread.lastMessageAt = now;
  thread.messageCount += 1;
  thread.lastSender = 'us';
  thread.snippet = draft.body.slice(0, 140);
  thread.waitingOnOthers = true;
  thread.actionRequired = false;
  thread.owner = 'none';
  thread.ownerSource = 'ai';
  if (prevOwner !== 'none') {
    thread.history.push({
      at: now,
      from: prevOwner,
      to: 'none',
      source: 'ai',
      reason: `Reply sent by ${actorName}; waiting on recipient`,
    });
  }
  await thread.save();

  return { draft, thread, client };
}

