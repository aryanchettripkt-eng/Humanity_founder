import { getProvider } from '../ai/index.js';
import { askSchema } from '../ai/schemas.js';
import { Thread } from '../models/Thread.js';
import { logger } from '../utils/logger.js';
import { segmentFilter } from './segments.js';

/**
 * Answer an assistant's natural-language question about a client's inbox (BACKEND §5.6).
 * @param {{ clientId: string, question: string, threadId?: string }} params
 */
export async function askInbox({ clientId, question, threadId }) {
  const lower = question.toLowerCase();

  if (threadId && /\bwhy\b/.test(lower)) {
    const thread = await Thread.findOne({ _id: threadId, clientId });
    if (thread) {
      return {
        answer: thread.reason || `This thread is currently assigned to ${thread.owner}.`,
        threadIds: [thread.id],
        threads: [{ id: thread.id, subject: thread.subject }],
      };
    }
  }

  if (threadId && /\bdraft\b|\breply\b/.test(lower)) {
    const thread = await Thread.findOne({ _id: threadId, clientId }).select('subject');
    return {
      answer: 'I can open the draft composer for this conversation.',
      threadIds: [threadId],
      threads: thread ? [{ id: threadId, subject: thread.subject }] : [],
      action: { type: 'draft', threadId },
    };
  }

  let filter = { clientId, status: 'open', archived: false };
  if (/waiting|awaiting|pending response/.test(lower)) {
    filter = { clientId, ...segmentFilter('waiting') };
  } else if (/client|priya|daniel/.test(lower)) {
    filter = { clientId, ...segmentFilter('client') };
  } else if (/attention|need me|assistant|my plate/.test(lower)) {
    filter = { clientId, owner: { $in: ['assistant', 'review'] }, status: 'open', archived: false };
  } else if (/review|unsure|ambiguous/.test(lower)) {
    filter = { clientId, ...segmentFilter('review') };
  }

  const candidates = await Thread.find(filter)
    .sort({ important: -1, lastMessageAt: -1 })
    .limit(25)
    .select('subject owner summary snippet lastMessageAt');

  if (candidates.length === 0) {
    return {
      answer: 'No matching open conversations were found for that question.',
      threadIds: [],
      threads: [],
    };
  }

  const candidateById = new Map(candidates.map((t) => [t.id, t]));
  const contextLines = candidates.map(
    (t) =>
      `id=${t.id} owner=${t.owner} subject="${t.subject}" summary="${t.summary || t.snippet}"`
  );

  try {
    const provider = getProvider();
    const res = await provider.generateJSON({
      system: [
        'You answer questions about an executive inbox for a personal assistant.',
        'Cite ONLY thread ids provided in the prompt.',
        'Return JSON: { "answer": "concise 1-3 sentence answer", "threadIds": ["id1", ...] }.',
      ].join('\n'),
      prompt: `Question: ${question}\n\nThreads:\n${contextLines.join('\n')}`,
      schema: askSchema,
      temperature: 0.2,
    });

    const citedIds = res.threadIds.filter((id) => candidateById.has(id));
    return {
      answer: res.answer,
      threadIds: citedIds,
      threads: citedIds.map((id) => ({ id, subject: candidateById.get(id).subject })),
    };
  } catch (err) {
    logger.warn('Ask AI failed; returning matched threads', { message: err?.message });
    const top = candidates.slice(0, 5);
    return {
      answer: `Found ${candidates.length} relevant conversation(s) in your inbox.`,
      threadIds: top.map((t) => t.id),
      threads: top.map((t) => ({ id: t.id, subject: t.subject })),
    };
  }
}

