import { sleep } from '../ai/utils.js';
import { Client } from '../models/Client.js';
import { EmailAccount } from '../models/EmailAccount.js';
import { Thread } from '../models/Thread.js';
import { User } from '../models/User.js';
import { emitCountsChanged, emitSyncDone, emitSyncProgress } from '../realtime/socket.js';
import { createThreadWithMessages, loadSeedThreads } from '../seed/seed.js';
import { logger } from '../utils/logger.js';
import { recordActivity } from './activity.service.js';
import { classifyThread } from './classification.service.js';

/**
 * Run a simulated mailbox sync for an EmailAccount.
 * If the client has 0 threads, loads seed threads and runs classification on them.
 * Emits `sync:progress` and `sync:done` to both the client room and the assistant's user room.
 * @param {string | import('mongoose').Types.ObjectId} accountId
 * @param {{ delayMs?: number }} [opts]
 */
export async function runSimulatedSync(accountId, opts = {}) {
  const delayMs = opts.delayMs ?? (process.env.NODE_ENV === 'test' ? 0 : 120);
  const account = await EmailAccount.findById(accountId);
  if (!account) return null;

  try {
    const existingCount = await Thread.countDocuments({ clientId: account.clientId });

    if (existingCount === 0) {
      const client = await Client.findById(account.clientId);
      const allSeed = await loadSeedThreads(client?.email, client?.email);
      const items = allSeed.filter((t) => !t.clientKey || t.clientKey === 'priya');
      const total = Math.max(items.length, 1);

      emitSyncProgress(
        account.clientId,
        { accountId: account.id, step: 'fetching', done: 0, total },
        account.assistantId
      );
      if (delayMs) await sleep(delayMs * 2);

      const createdIds = [];
      for (const item of items) {
        const thread = await createThreadWithMessages({
          client,
          account,
          item,
          pendingAI: true,
        });
        createdIds.push(thread._id);
      }

      for (let i = 0; i < createdIds.length; i += 1) {
        await classifyThread(createdIds[i], { fast: true, emit: false });
        emitSyncProgress(
          account.clientId,
          {
            accountId: account.id,
            step: i < createdIds.length * 0.7 ? 'classifying' : 'extracting',
            done: i + 1,
            total,
          },
          account.assistantId
        );
        if (delayMs) await sleep(delayMs);
      }
    } else {
      const total = existingCount;
      emitSyncProgress(
        account.clientId,
        { accountId: account.id, step: 'fetching', done: 0, total },
        account.assistantId
      );
      if (delayMs) await sleep(delayMs * 2);

      const stepSize = Math.max(1, Math.ceil(total / 4));
      for (let done = stepSize; done < total; done += stepSize) {
        emitSyncProgress(
          account.clientId,
          {
            accountId: account.id,
            step: done < total * 0.7 ? 'classifying' : 'extracting',
            done: Math.min(done, total),
            total,
          },
          account.assistantId
        );
        if (delayMs) await sleep(delayMs * 2);
      }
    }

    account.status = 'connected';
    account.lastSyncedAt = new Date();
    account.error = undefined;
    await account.save();

    await User.updateOne(
      { _id: account.assistantId },
      { $set: { 'onboarding.completed': true } }
    );

    const finalCount = await Thread.countDocuments({ clientId: account.clientId });
    const json = account.toJSON();
    emitSyncProgress(
      account.clientId,
      { accountId: account.id, step: 'done', done: finalCount, total: finalCount },
      account.assistantId
    );
    emitSyncDone(account.clientId, json, account.assistantId);
    emitCountsChanged(account.clientId);

    await recordActivity({
      clientId: account.clientId,
      actor: { type: 'system', name: 'Relay Sync' },
      type: 'sync_completed',
      payload: { accountId: account.id, provider: account.provider, total: finalCount },
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
