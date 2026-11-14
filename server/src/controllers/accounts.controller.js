import { z } from 'zod';
import { Client } from '../models/Client.js';
import { EmailAccount } from '../models/EmailAccount.js';
import { Message } from '../models/Message.js';
import { Thread } from '../models/Thread.js';
import { joinAssistantClientRoom } from '../realtime/socket.js';
import { decryptToken } from '../services/gmail/crypto.js';
import { revokeGoogleToken } from '../services/gmail/oauth.js';
import { pollGmailAccount } from '../services/gmail/poller.js';
import { runSimulatedSync } from '../services/sync.service.js';
import { notFound } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const connectAccountSchema = {
  body: z.object({
    provider: z.enum(['gmail', 'outlook']),
    clientId: z.string().optional(),
  }),
};

export const authorizeAccountSchema = {
  body: z.object({
    approved: z.boolean(),
    address: z.string().trim().email('Valid email address required').toLowerCase(),
  }),
};

async function findOwnedAccount(accountId, assistantId) {
  const account = await EmailAccount.findOne({ _id: accountId, assistantId });
  if (!account) throw notFound('Email account not found');
  return account;
}

export async function listAccounts(req, res, next) {
  try {
    const query = { assistantId: req.user._id };
    if (req.query.clientId) {
      query.clientId = req.query.clientId;
    }
    const accounts = await EmailAccount.find(query).sort({ createdAt: 1 });
    res.json({ data: accounts.map((a) => a.toJSON()) });
  } catch (err) {
    next(err);
  }
}

export async function connectAccount(req, res, next) {
  try {
    const { provider, clientId } = req.body;

    let targetClient = null;
    if (clientId) {
      targetClient = await Client.findOne({ _id: clientId, assistantId: req.user._id });
      if (!targetClient) throw notFound('Client not found');
    } else {
      targetClient = await Client.findOne({ assistantId: req.user._id }).sort({ createdAt: 1 });
      if (!targetClient) {
        // Create a default client profile for newly signed up assistants
        targetClient = await Client.create({
          name: `${req.user.name}'s Client`,
          firstName: 'Client',
          email: req.user.email,
          title: 'Executive',
          assistantId: req.user._id,
          profile: {
            delegation: 'Assistant handles scheduling, vendors, and travel.',
            vipSenders: [],
          },
        });
        joinAssistantClientRoom(req.user._id, targetClient._id);
      }
    }

    const account = await EmailAccount.create({
      clientId: targetClient._id,
      assistantId: req.user._id,
      provider,
      address: `pending@${provider}.com`,
      status: 'connecting',
      simulated: true,
    });

    res.status(201).json({
      data: {
        accountId: account.id,
        consentUrl: null,
        simulated: true,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function authorizeAccount(req, res, next) {
  try {
    const account = await findOwnedAccount(req.params.id, req.user._id);
    const { approved, address } = req.body;

    account.address = address;
    if (!approved) {
      account.status = 'disconnected';
      await account.save();
      return res.json({ data: account.toJSON() });
    }

    account.status = 'syncing';
    await account.save();

    // Kick off async simulated sync
    void runSimulatedSync(account._id);

    res.json({ data: account.toJSON() });
  } catch (err) {
    next(err);
  }
}

export async function syncAccount(req, res, next) {
  try {
    const account = await findOwnedAccount(req.params.id, req.user._id);
    account.status = 'syncing';
    await account.save();

    if (account.simulated) {
      void runSimulatedSync(account._id);
    } else {
      void pollGmailAccount(account._id);
    }
    res.json({ data: { started: true } });
  } catch (err) {
    next(err);
  }
}

export async function disconnectAccount(req, res, next) {
  try {
    const account = await findOwnedAccount(req.params.id, req.user._id);

    if (!account.simulated && account.google?.refreshTokenEnc) {
      try {
        const refreshToken = decryptToken(account.google.refreshTokenEnc);
        await revokeGoogleToken(refreshToken);
      } catch (err) {
        logger.warn('Failed to revoke Google token on disconnect', { message: err?.message });
      }
      account.google = undefined;
    }

    account.status = 'disconnected';
    await account.save();

    if (req.query.removeMail === 'true') {
      const threads = await Thread.find({ accountId: account._id }).select('_id');
      const threadIds = threads.map((t) => t._id);
      if (threadIds.length > 0) {
        await Message.deleteMany({ threadId: { $in: threadIds } });
        await Thread.deleteMany({ _id: { $in: threadIds } });
      }
    }

    res.json({ data: { ok: true } });
  } catch (err) {
    next(err);
  }
}

