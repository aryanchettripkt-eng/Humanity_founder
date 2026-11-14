import { env } from '../../config/env.js';
import { EmailAccount } from '../../models/EmailAccount.js';
import { Message } from '../../models/Message.js';
import { Thread } from '../../models/Thread.js';
import {
  emitCountsChanged,
  emitSyncDone,
  emitSyncProgress,
} from '../../realtime/socket.js';
import { logger } from '../../utils/logger.js';
import { recordActivity } from '../activity.service.js';
import { classifyThread } from '../classification.service.js';
import { decryptToken } from './crypto.js';
import { mapGmailThread } from './mapper.js';
import {
  callGmailWithRetry,
  createAuthedGmailClient,
  sleep,
  tryLockAccount,
  unlockAccount,
} from './oauth.js';

/**
 * Idempotently upsert a mapped Gmail thread and its messages by `externalId`.
 * Returns `{ thread, hasNewInbound }`.
 */
export async function upsertMappedThread({ account, mapped }) {
  const { threadData, messagesData } = mapped;
  const existing = await Thread.findOne({
    accountId: account._id,
    externalId: threadData.externalId,
  });

  const thread = existing
    ? await Thread.findByIdAndUpdate(
        existing._id,
        {
          $set: {
            subject: threadData.subject,
            snippet: threadData.snippet,
            participants: threadData.participants,
            lastMessageAt: threadData.lastMessageAt,
            messageCount: threadData.messageCount,
            lastSender: threadData.lastSender,
            unread: threadData.unread,
            important: threadData.important,
          },
        },
        { new: true }
      )
    : await Thread.create({
        clientId: account.clientId,
        accountId: account._id,
        ...threadData,
        aiStatus: 'pending',
      });

  let hasNewInbound = false;
  for (const m of messagesData) {
    const res = await Message.updateOne(
      { threadId: thread._id, externalId: m.externalId },
      {
        $setOnInsert: {
          threadId: thread._id,
          clientId: account.clientId,
          ...m,
        },
      },
      { upsert: true }
    );
    if (res.upsertedCount > 0 && m.direction === 'inbound') {
      hasNewInbound = true;
    }
  }

  return { thread, hasNewInbound, isNew: !existing };
}

/** Run `fn` over `items` with bounded concurrency. */
async function runWithConcurrency(items, concurrency, fn) {
  for (let i = 0; i < items.length; i += concurrency) {
    await Promise.allSettled(items.slice(i, i + concurrency).map((item, offset) => fn(item, i + offset)));
  }
}

/**
 * Initial import (or limited re-import) for a real Gmail EmailAccount.
 */
export async function importGmailAccount(accountId, { maxResults = env.GMAIL_IMPORT_LIMIT } = {}) {
  if (!tryLockAccount(accountId)) {
    logger.info('Gmail import skipped; sync already running', { accountId: String(accountId) });
    return;
  }

  const account = await EmailAccount.findById(accountId);
  if (!account || account.simulated || !account.google?.refreshTokenEnc) {
    unlockAccount(accountId);
    return;
  }

  const clientId = account.clientId;
  const assistantId = account.assistantId;

  try {
    emitSyncProgress(
      clientId,
      { accountId: account.id, step: 'fetching', imported: 0, total: maxResults },
      assistantId
    );

    const refreshToken = decryptToken(account.google.refreshTokenEnc);
    const gmail = await createAuthedGmailClient(refreshToken);

    const profileRes = await callGmailWithRetry(() => gmail.users.getProfile({ userId: 'me' }));
    const historyId = profileRes.data?.historyId ? String(profileRes.data.historyId) : undefined;
    if (historyId) {
      account.google.historyId = historyId;
      await account.save();
    }

    const listRes = await callGmailWithRetry(() =>
      gmail.users.threads.list({
        userId: 'me',
        labelIds: ['INBOX'],
        maxResults,
      })
    );
    const threadRefs = listRes.data?.threads || [];
    const total = threadRefs.length || 1;

    const toClassify = [];
    for (let i = 0; i < threadRefs.length; i += 1) {
      const ref = threadRefs[i];
      if (!ref?.id) continue;
      if (i > 0) await sleep(100);
      const fullRes = await callGmailWithRetry(() =>
        gmail.users.threads.get({
          userId: 'me',
          id: ref.id,
          format: 'full',
        })
      );
      const mapped = mapGmailThread(fullRes.data, account.address);
      const { thread, hasNewInbound, isNew } = await upsertMappedThread({ account, mapped });
      if (isNew || hasNewInbound || thread.aiStatus === 'pending') {
        toClassify.push(thread);
      }

      if ((i + 1) % 5 === 0 || i + 1 === threadRefs.length) {
        emitSyncProgress(
          clientId,
          { accountId: account.id, step: 'fetching', imported: i + 1, total },
          assistantId
        );
      }
    }

    const classifyTotal = toClassify.length || 1;
    let classified = 0;
    emitSyncProgress(
      clientId,
      { accountId: account.id, step: 'classifying', imported: 0, total: classifyTotal },
      assistantId
    );

    await runWithConcurrency(toClassify, 2, async (thread) => {
      await classifyThread(thread._id, { fast: true, emit: false }).catch((err) => {
        logger.warn('Gmail thread classification failed', {
          threadId: String(thread._id),
          message: err?.message,
        });
      });
      classified += 1;
      emitSyncProgress(
        clientId,
        { accountId: account.id, step: 'classifying', imported: classified, total: classifyTotal },
        assistantId
      );
    });

    account.status = 'connected';
    account.error = undefined;
    account.lastSyncedAt = new Date();
    if (historyId) account.google.historyId = historyId;
    account.google.lastPolledAt = new Date();
    await account.save();

    await recordActivity({
      clientId,
      actor: { type: 'system', name: 'Gmail' },
      type: 'sync_completed',
      payload: { accountId: account.id, provider: 'gmail', address: account.address, real: true },
    });

    emitSyncProgress(
      clientId,
      { accountId: account.id, step: 'done', imported: threadRefs.length, total },
      assistantId
    );
    emitSyncDone(clientId, account.toJSON(), assistantId);
    emitCountsChanged(clientId);
  } catch (err) {
    const msg = err?.message || 'Gmail import failed';
    const isRevoked = msg.includes('invalid_grant');
    logger.error('Gmail import failed', { accountId: String(accountId), message: msg });
    await EmailAccount.findByIdAndUpdate(accountId, {
      status: 'error',
      error: isRevoked ? 'Reconnect Gmail' : msg,
    });
    emitSyncProgress(
      clientId,
      { accountId: String(accountId), step: 'error', imported: 0, total: 1, error: msg },
      assistantId
    );
  } finally {
    unlockAccount(accountId);
  }
}

