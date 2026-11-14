import { env } from '../../config/env.js';
import { EmailAccount } from '../../models/EmailAccount.js';
import { emitCountsChanged, emitSyncDone } from '../../realtime/socket.js';
import { logger } from '../../utils/logger.js';
import { classifyThread } from '../classification.service.js';
import { decryptToken } from './crypto.js';
import { importGmailAccount, upsertMappedThread } from './import.js';
import { mapGmailThread } from './mapper.js';
import {
  callGmailWithRetry,
  createAuthedGmailClient,
  sleep,
  tryLockAccount,
  unlockAccount,
} from './oauth.js';

let pollTimer = null;

/**
 * Poll a single real Gmail account for new messages via `users.history.list`.
 */
export async function pollGmailAccount(accountId) {
  const account = await EmailAccount.findById(accountId);
  if (!account || account.simulated || account.status === 'disconnected' || !account.google?.refreshTokenEnc) {
    return;
  }

  if (!account.google.historyId) {
    await importGmailAccount(account._id, { maxResults: 20 });
    return;
  }

  if (!tryLockAccount(accountId)) {
    logger.info('Gmail poll skipped; sync already running', { accountId: String(accountId) });
    return;
  }

  let shouldReimport = false;
  try {
    const refreshToken = decryptToken(account.google.refreshTokenEnc);
    const gmail = await createAuthedGmailClient(refreshToken);

    const changedThreadIds = new Set();
    let pageToken;
    let latestHistoryId;
    do {
      const historyRes = await callGmailWithRetry(() =>
        gmail.users.history.list({
          userId: 'me',
          startHistoryId: account.google.historyId,
          historyTypes: ['messageAdded'],
          ...(pageToken ? { pageToken } : {}),
        })
      );

      const historyItems = historyRes.data?.history || [];
      for (const h of historyItems) {
        for (const added of h.messagesAdded || []) {
          if (added.message?.threadId) changedThreadIds.add(added.message.threadId);
        }
      }
      if (historyRes.data?.historyId) {
        latestHistoryId = String(historyRes.data.historyId);
      }
      pageToken = historyRes.data?.nextPageToken || undefined;
    } while (pageToken);

    let classifiedAny = false;
    let threadIdx = 0;
    for (const gmailThreadId of changedThreadIds) {
      if (threadIdx > 0) await sleep(100);
      threadIdx += 1;
      const fullRes = await callGmailWithRetry(() =>
        gmail.users.threads.get({
          userId: 'me',
          id: gmailThreadId,
          format: 'full',
        })
      );
      const mapped = mapGmailThread(fullRes.data, account.address);
      const { thread, hasNewInbound, isNew } = await upsertMappedThread({ account, mapped });
      if (isNew || hasNewInbound) {
        await classifyThread(thread._id, { emit: true }).catch((err) => {
          logger.warn('Gmail poll classification failed', { message: err?.message });
        });
        classifiedAny = true;
      }
    }

    if (latestHistoryId) {
      account.google.historyId = latestHistoryId;
    }
    account.google.lastPolledAt = new Date();
    account.lastSyncedAt = new Date();
    account.status = 'connected';
    account.error = undefined;
    await account.save();

    if (classifiedAny) {
      emitCountsChanged(account.clientId);
    }
    emitSyncDone(account.clientId, account.toJSON(), account.assistantId);
  } catch (err) {
    const status = err?.code || err?.status || err?.response?.status;
    const msg = String(err?.message || '');

    if (status === 404) {
      logger.info('Gmail historyId expired; re-importing last 20 threads', {
        accountId: account.id,
      });
      shouldReimport = true;
    } else if (msg.includes('invalid_grant')) {
      account.status = 'error';
      account.error = 'Reconnect Gmail';
      await account.save();
      emitSyncDone(account.clientId, account.toJSON(), account.assistantId);
    } else {
      logger.warn('Gmail poll error', { accountId: account.id, message: msg });
      account.status = 'connected';
      account.error = msg;
      await account.save();
      emitSyncDone(account.clientId, account.toJSON(), account.assistantId);
    }
  } finally {
    unlockAccount(accountId);
  }

  if (shouldReimport) {
    await importGmailAccount(account._id, { maxResults: 20 });
  }
}

export async function pollAllGmailAccounts() {
  const accounts = await EmailAccount.find({
    simulated: false,
    status: 'connected',
  }).select('_id');

  for (const acc of accounts) {
    await pollGmailAccount(acc._id);
  }
}

export function startGmailPoller() {
  if (pollTimer || !env.realGmailEnabled || env.NODE_ENV === 'test') return;
  const intervalMs = Math.max(15, env.GMAIL_POLL_SECONDS) * 1000;
  pollTimer = setInterval(() => {
    void pollAllGmailAccounts();
  }, intervalMs);
  pollTimer.unref?.();
  logger.info(`Gmail poller started (every ${env.GMAIL_POLL_SECONDS}s)`);
}

