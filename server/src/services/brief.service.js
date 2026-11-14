import { getProvider } from '../ai/index.js';
import { Client } from '../models/Client.js';
import { Thread } from '../models/Thread.js';
import { logger } from '../utils/logger.js';

const BRIEF_TTL_MS = 2 * 60 * 60 * 1000;
const inflightBriefs = new Set();

function buildFallbackBrief({ clientName, counts, upcoming = [] }) {
  const nextUp = upcoming[0]?.title ? ` Next up: ${upcoming[0].title}.` : '';
  const assistantCount = counts.assistant ?? 0;
  const clientCount = counts.client ?? 0;
  const reviewCount = counts.review ?? 0;
  const assistantPhrase = `${assistantCount} ${assistantCount === 1 ? 'thread needs' : 'threads need'} you`;
  const clientPhrase = `${clientCount} ${clientCount === 1 ? 'needs' : 'need'} ${clientName}`;
  return {
    text: `${assistantPhrase}, ${clientPhrase}, ${reviewCount} to review.${nextUp}`,
    generatedAt: new Date().toISOString(),
    fallback: true,
  };
}

function isBriefFresh(brief) {
  if (!brief?.text || brief.fallback || !brief.generatedAt) return false;
  const age = Date.now() - new Date(brief.generatedAt).getTime();
  return age >= 0 && age < BRIEF_TTL_MS;
}

/**
 * Generate a 2-3 sentence morning brief for a client's inbox, with deterministic template fallback.
 * @param {{
 *   clientId: string,
 *   counts: Record<string, number>,
 *   upcoming?: Array<{ title: string, startsAt: Date | string }>,
 *   useAI?: boolean,
 *   force?: boolean,
 * }} opts
 */
export async function generateMorningBrief({
  clientId,
  counts,
  upcoming = [],
  useAI = true,
  force = false,
}) {
  const client = await Client.findById(clientId);
  const clientName = client?.firstName || 'your client';
  const fallbackBrief = buildFallbackBrief({ clientName, counts, upcoming });

  if (!useAI) {
    return fallbackBrief;
  }

  if (!force && isBriefFresh(client?.brief)) {
    return {
      text: client.brief.text,
      generatedAt: new Date(client.brief.generatedAt).toISOString(),
      fallback: false,
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

    const isFallback = provider.name === 'mock' || !text;
    const finalText = text || fallbackBrief.text;
    const generatedAt = new Date();

    if (client) {
      await Client.updateOne(
        { _id: client._id },
        {
          $set: {
            brief: {
              text: finalText,
              generatedAt,
              fallback: isFallback,
            },
          },
        }
      );
    }

    return {
      text: finalText,
      generatedAt: generatedAt.toISOString(),
      fallback: isFallback,
    };
  } catch (err) {
    logger.warn('Morning brief AI failed; using template fallback', { message: err?.message });
    return fallbackBrief;
  }
}

/**
 * Return cached AI brief if < 2 hours old; otherwise return template fallback and
 * kick off at most one background AI generation.
 */
export async function getDashboardBrief({ clientId, counts, upcoming = [] }) {
  const client = await Client.findById(clientId);
  if (isBriefFresh(client?.brief)) {
    return {
      text: client.brief.text,
      generatedAt: new Date(client.brief.generatedAt).toISOString(),
      fallback: false,
    };
  }

  const key = String(clientId);
  if (!inflightBriefs.has(key)) {
    inflightBriefs.add(key);
    generateMorningBrief({ clientId, counts, upcoming, useAI: true, force: true })
      .catch((err) => {
        logger.warn('Background morning brief generation failed', {
          clientId: key,
          message: err?.message,
        });
      })
      .finally(() => {
        inflightBriefs.delete(key);
      });
  }

  return buildFallbackBrief({
    clientName: client?.firstName || 'your client',
    counts,
    upcoming,
  });
}

