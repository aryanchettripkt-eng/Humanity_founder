import { z } from 'zod';
import { askInbox } from '../services/ask.service.js';
import { generateMorningBrief } from '../services/brief.service.js';
import { computeSegmentCounts } from '../services/segments.js';

export const askSchema = {
  body: z.object({
    clientId: z.string().optional(),
    question: z.string().trim().min(1, 'Question is required').max(500),
    threadId: z.string().optional(),
  }),
};

export const briefRefreshSchema = {
  body: z.object({
    clientId: z.string().optional(),
  }),
};

export async function postAsk(req, res, next) {
  try {
    if (!req.clientId) {
      return res.json({ data: { answer: 'No client inbox connected yet.', threadIds: [] } });
    }
    const result = await askInbox({
      clientId: req.clientId,
      question: req.body.question,
      threadId: req.body.threadId,
    });
    res.json({ data: result });
  } catch (err) {
    next(err);
  }
}

export async function postBriefRefresh(req, res, next) {
  try {
    if (!req.clientId) {
      return res.json({
        data: {
          text: 'Connect an email account to generate a morning brief.',
          generatedAt: new Date().toISOString(),
          fallback: true,
        },
      });
    }
    const counts = await computeSegmentCounts(req.clientId);
    const brief = await generateMorningBrief({
      clientId: req.clientId,
      counts,
      useAI: true,
    });
    res.json({ data: brief });
  } catch (err) {
    next(err);
  }
}

