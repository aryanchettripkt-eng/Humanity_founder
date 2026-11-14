import { Activity } from '../models/Activity.js';
import { emitActivityNew } from '../realtime/socket.js';

/**
 * Persist an Activity record and broadcast it to the client's room.
 * @param {{
 *   clientId: string | import('mongoose').Types.ObjectId,
 *   actor: { type: 'client'|'assistant'|'ai'|'system', name: string },
 *   type: string,
 *   threadId?: string | import('mongoose').Types.ObjectId,
 *   payload?: Record<string, unknown>,
 * }} params
 */
export async function recordActivity({ clientId, actor, type, threadId, payload = {} }) {
  const doc = await Activity.create({
    clientId,
    actor,
    type,
    ...(threadId ? { threadId } : {}),
    payload,
  });
  const json = doc.toJSON();
  emitActivityNew(clientId, json);
  return json;
}

