import { sleep } from '../ai/utils.js';
import { EmailAccount } from '../models/EmailAccount.js';
import { Thread } from '../models/Thread.js';
import { User } from '../models/User.js';
import { emitCountsChanged, emitSyncDone, emitSyncProgress } from '../realtime/socket.js';
import { logger } from '../utils/logger.js';
import { recordActivity } from './activity.service.js';

/**
 * Run a simulated mailbox sync for an EmailAccount, emitting `sync:progress` and `sync:done`.
 * @param {string | import('mongoose').Types.ObjectId} accountId
 * @param {{ delayMs?: number }} [opts]
 */
export async function runSimulatedSync(accountId, opts = {}) {
  const delayMs = opts.delayMs ?? (process.env.NODE_ENV === 'test' ? 0 : 120);
  const account = await EmailAccount.findById(accountId);
  if (!account) return null;

  try {
    const existingCount = await Thread.countDocuments({ clientId: account.clientId });
    const total = Math.max(existingCount, 12);

    emitSyncProgress(account.clientId, {
      accountId: account.id,
      step: 'fetching',
      done: 0,
      total,
    });
    if (delayMs) await sleep(delayMs * 3);

    const stepSize = Math.max(1, Math.ceil(total / 4));
    for (let done = stepSize; done < total; done += stepSize) {
      emitSyncProgress(account.clientId, {
        accountId: account.id,
        step: done < total * 0.7 ? 'classifying' : 'extracting',
        done: Math.min(done, total),
        total,
      });
      if (delayMs) await sleep(delayMs * 2);
    }

    account.status = 'connected';
    account.lastSyncedAt = new Date();
    account.error = undefined;
    await account.save();

    await User.updateOne(
      { _id: account.assistantId },
      { $set: { 'onboarding.completed': true } }
    );

    const json = account.toJSON();
    emitSyncProgress(account.clientId, {
      accountId: account.id,
      step: 'done',
      done: total,
      total,
    });
    emitSyncDone(account.clientId, json);
    emitCountsChanged(account.clientId);

    await recordActivity({
      clientId: account.clientId,
      actor: { type: 'system', name: 'Relay Sync' },
      type: 'sync_completed',
      payload: { accountId: account.id, provider: account.provider, total },
    });

    return json;
  } catch (err) {
    logger.error('Simulated sync failed', { accountId: account.id, message: err?.message });
    account.status = 'error';
    account.error = err?.message || 'Sync failed';
    await account.save();
    return account.toJSON();
  }
}
