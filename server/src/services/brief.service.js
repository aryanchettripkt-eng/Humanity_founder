import { getProvider } from '../ai/index.js';
import { Client } from '../models/Client.js';
import { Thread } from '../models/Thread.js';
import { logger } from '../utils/logger.js';

/**
 * Generate a 2-3 sentence morning brief for a client's inbox, with deterministic template fallback.
 * @param {{
 *   clientId: string,
 *   counts: Record<string, number>,
 *   upcoming?: Array<{ title: string, startsAt: Date | string }>,
 *   useAI?: boolean,
 * }} opts
 */
export async function generateMorningBrief({ clientId, counts, upcoming = [], useAI = true }) {
  const client = await Client.findById(clientId);
  const clientName = client?.firstName || 'your client';
  const nextUp = upcoming[0]?.title ? ` Next up: ${upcoming[0].title}.` : '';
  const fallbackText = `${counts.assistant ?? 0} threads need you, ${counts.client ?? 0} need ${clientName}, ${counts.review ?? 0} to review.${nextUp}`;

  if (!useAI) {
    return {
      text: fallbackText,
      generatedAt: new Date().toISOString(),
      fallback: true,
    };
  }

  try {
    const topThreads = await Thread.find({
      clientId,
      status: 'open',
      archived: false,
      owner: { $in: ['assistant', 'client', 'review'] },
    })
      .sort({ important: -1, lastMessageAt: -1 })
      .limit(5)
      .select('subject owner summary');

    const provider = getProvider();
    const prompt = [
      `Morning brief for ${client?.name || clientName}.`,
      `Counts: assistant=${counts.assistant ?? 0}, client=${counts.client ?? 0}, review=${counts.review ?? 0}, waiting=${counts.waiting ?? 0}.`,
      `Top threads:\n${topThreads.map((t) => `- [${t.owner}] ${t.subject}: ${t.summary}`).join('\n')}`,
      `Upcoming:\n${upcoming.slice(0, 3).map((u) => `- ${u.title} at ${u.startsAt}`).join('\n') || 'None'}`,
    ].join('\n\n');

    const text = await provider.generateText({
      system:
        'Write a calm, concise 2-3 sentence morning brief for a personal assistant. No greeting fluff.',
      prompt,
      temperature: 0.4,
    });

    return {
      text: text || fallbackText,
      generatedAt: new Date().toISOString(),
      fallback: provider.name === 'mock',
    };
  } catch (err) {
    logger.warn('Morning brief AI failed; using template fallback', { message: err?.message });
    return {
      text: fallbackText,
      generatedAt: new Date().toISOString(),
      fallback: true,
    };
  }
}

