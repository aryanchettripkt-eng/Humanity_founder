import { Activity } from '../models/Activity.js';
import { Client } from '../models/Client.js';
import { Thread } from '../models/Thread.js';
import { computeSegmentCounts, SEGMENT_IDS } from '../services/segments.js';

export async function getDashboard(req, res, next) {
  try {
    if (!req.clientId) {
      const emptyCounts = Object.fromEntries(SEGMENT_IDS.map((s) => [s, 0]));
      return res.json({
        data: {
          counts: emptyCounts,
          brief: {
            text: 'Connect an email account to see your daily brief.',
            generatedAt: new Date().toISOString(),
            fallback: true,
          },
          upcoming: [],
          review: [],
          recent: [],
          activity: [],
        },
      });
    }

    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 3600 * 1000);

    const [counts, client, reviewThreads, recentThreads, datedThreads, activities] =
      await Promise.all([
        computeSegmentCounts(req.clientId),
        Client.findById(req.clientId),
        Thread.find({
          clientId: req.clientId,
          owner: 'review',
          status: 'open',
          archived: false,
        })
          .sort({ lastMessageAt: -1 })
          .limit(8),
        Thread.find({ clientId: req.clientId, archived: false })
          .sort({ lastMessageAt: -1 })
          .limit(5),
        Thread.find({
          clientId: req.clientId,
          archived: false,
          'entities.startsAt': { $gte: now, $lte: sevenDaysLater },
        }).select('subject entities'),
        Activity.find({ clientId: req.clientId }).sort({ createdAt: -1 }).limit(15),
      ]);

    const upcoming = [];
    for (const t of datedThreads) {
      for (const e of t.entities || []) {
        if (e.startsAt >= now && e.startsAt <= sevenDaysLater) {
          upcoming.push({
            threadId: String(t._id),
            subject: t.subject,
            type: e.type,
            title: e.title,
            startsAt: e.startsAt,
            endsAt: e.endsAt,
            location: e.location,
          });
        }
      }
    }
    upcoming.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    const clientName = client?.firstName || 'your client';
    const nextUp = upcoming[0]?.title ? ` Next up: ${upcoming[0].title}.` : '';
    const briefText = `${counts.assistant} threads need you, ${counts.client} need ${clientName}, ${counts.review} to review.${nextUp}`;

    res.json({
      data: {
        counts,
        brief: {
          text: briefText,
          generatedAt: now.toISOString(),
          fallback: true,
        },
        upcoming: upcoming.slice(0, 10),
        review: reviewThreads.map((t) => t.toJSON()),
        recent: recentThreads.map((t) => t.toJSON()),
        activity: activities.map((a) => a.toJSON()),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function listActivity(req, res, next) {
  try {
    if (!req.clientId) return res.json({ data: [] });
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 20));
    const items = await Activity.find({ clientId: req.clientId })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ data: items.map((a) => a.toJSON()) });
  } catch (err) {
    next(err);
  }
}
