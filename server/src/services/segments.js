import mongoose from 'mongoose';
import { Thread } from '../models/Thread.js';

export const SEGMENT_IDS = [
  'inbox',
  'assistant',
  'client',
  'review',
  'none',
  'action',
  'waiting',
  'meetings',
  'important',
  'general',
  'done',
  'archived',
];

/**
 * Build the Mongo filter for a given segment.
 * @param {string} [segment='inbox']
 * @returns {Record<string, unknown>}
 */
export function segmentFilter(segment = 'inbox') {
  switch (segment) {
    case 'assistant':
    case 'client':
    case 'review':
    case 'none':
      return { owner: segment, status: 'open', archived: false };
    case 'action':
      return { actionRequired: true, status: 'open', archived: false };
    case 'waiting':
      return { waitingOnOthers: true, status: 'open', archived: false };
    case 'meetings':
      return {
        $or: [{ category: 'meeting' }, { 'entities.type': 'meeting' }],
        archived: false,
      };
    case 'important':
      return { important: true, archived: false };
    case 'general':
      return { category: { $in: ['general', 'update', 'newsletter'] }, archived: false };
    case 'done':
      return { status: 'done', archived: false };
    case 'archived':
      return { archived: true };
    case 'inbox':
    default:
      return { status: 'open', archived: false };
  }
}

/**
 * Compute counts for every segment scoped to a client.
 * @param {string | import('mongoose').Types.ObjectId} clientId
 */
export async function computeSegmentCounts(clientId) {
  const cid = new mongoose.Types.ObjectId(String(clientId));
  const facets = {};
  for (const seg of SEGMENT_IDS) {
    facets[seg] = [{ $match: segmentFilter(seg) }, { $count: 'count' }];
  }

  const [res] = await Thread.aggregate([{ $match: { clientId: cid } }, { $facet: facets }]);
  const counts = {};
  for (const seg of SEGMENT_IDS) {
    counts[seg] = res?.[seg]?.[0]?.count ?? 0;
  }
  return counts;
}
