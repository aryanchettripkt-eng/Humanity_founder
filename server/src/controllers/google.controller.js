import { z } from 'zod';
import { env } from '../config/env.js';
import { signToken } from '../middleware/auth.js';
import { Client } from '../models/Client.js';
import { EmailAccount } from '../models/EmailAccount.js';
import { User } from '../models/User.js';
import { joinAssistantClientRoom } from '../realtime/socket.js';
import { encryptToken, signOAuthState, verifyOAuthState } from '../services/gmail/crypto.js';
import { importGmailAccount } from '../services/gmail/import.js';
import { buildGoogleAuthUrl, exchangeCodeForTokens } from '../services/gmail/oauth.js';
import { AppError, notFound } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const startGmailSchema = {
  body: z.object({
    clientId: z.string().optional(),
  }),
};

function webBaseUrl() {
  return String(env.WEB_URL || 'http://localhost:5173').replace(/\/+$/, '');
}

async function resolveOrCreateClient(assistantId, assistantName, assistantEmail, clientId) {
  if (clientId) {
    const found = await Client.findOne({ _id: clientId, assistantId });
    if (!found) throw notFound('Client not found');
    return found;
  }
  const existing = await Client.findOne({ assistantId }).sort({ createdAt: 1 });
  if (existing) return existing;

  const created = await Client.create({
    name: `${assistantName}'s Client`,
    firstName: 'Client',
    email: assistantEmail,
    title: 'Executive',
    assistantId,
    profile: {
      delegation: 'Assistant handles scheduling, vendors, and travel.',
      vipSenders: [],
    },
  });
  joinAssistantClientRoom(assistantId, created._id);
  return created;
}

export function startGoogleLogin(_req, res, next) {
  if (!env.googleLoginEnabled) {
    return next(new AppError(409, 'GOOGLE_LOGIN_DISABLED', 'Google sign-in is not configured'));
  }
  const state = signOAuthState({ purpose: 'login' });
  const url = buildGoogleAuthUrl({ purpose: 'login', state });
  return res.redirect(302, url);
}

export async function startGmailConnect(req, res, next) {
  try {
    if (!env.realGmailEnabled) {
      throw new AppError(409, 'GMAIL_DISABLED', 'Real Gmail integration is not enabled');
    }
    const targetClient = await resolveOrCreateClient(
      req.user._id,
      req.user.name,
      req.user.email,
      req.body?.clientId
    );
    const state = signOAuthState({
      purpose: 'gmail',
      userId: req.user.id,
      clientId: targetClient.id,
    });
    const authUrl = buildGoogleAuthUrl({ purpose: 'gmail', state });
    res.json({ data: { authUrl } });
  } catch (err) {
    next(err);
  }
}

export async function handleGoogleCallback(req, res) {
  const base = webBaseUrl();
  const rawState = String(req.query.state || '');
  const oauthError = req.query.error ? String(req.query.error) : null;
  const code = req.query.code ? String(req.query.code) : null;

  let parsedState;
  try {
    parsedState = verifyOAuthState(rawState);
  } catch {
    return res.redirect(302, `${base}/login?error=state_invalid`);
  }

  const errorTarget =
    parsedState.purpose === 'gmail' ? `${base}/onboarding?step=connect` : `${base}/auth/callback`;

  if (oauthError) {
    const mappedCode =
      oauthError === 'access_denied' && parsedState.purpose === 'gmail'
        ? 'not_test_user'
        : oauthError === 'access_denied'
          ? 'access_denied'
          : 'exchange_failed';
    const sep = errorTarget.includes('?') ? '&' : '?';
    return res.redirect(302, `${errorTarget}${sep}error=${encodeURIComponent(mappedCode)}`);
  }

  if (!code) {
    const sep = errorTarget.includes('?') ? '&' : '?';
    return res.redirect(302, `${errorTarget}${sep}error=exchange_failed`);
  }

  try {
    const { tokens, userInfo } = await exchangeCodeForTokens(code);
    const email = String(userInfo?.email || '').toLowerCase().trim();
    if (!email) {
      throw new Error('Google userinfo missing email');
    }

    if (parsedState.purpose === 'login') {
      let user = await User.findOne({ googleId: userInfo.id });
      if (!user) {
        user = await User.findOne({ email });
        if (user) {
          user.googleId = userInfo.id;
          await user.save();
        } else {
          user = await User.create({
            name: userInfo.name || email.split('@')[0],
            email,
            googleId: userInfo.id,
            role: 'assistant',
            onboarding: { completed: false, tourSeen: false },
          });
        }
      }
      const token = signToken(user);
      return res.redirect(302, `${base}/auth/callback#token=${encodeURIComponent(token)}`);
    }

    // purpose === 'gmail'
    if (!env.realGmailEnabled) {
      return res.redirect(302, `${base}/onboarding?step=connect&error=exchange_failed`);
    }

    const user = await User.findById(parsedState.userId);
    if (!user) {
      return res.redirect(302, `${base}/login?error=state_invalid`);
    }

    const client = await resolveOrCreateClient(
      user._id,
      user.name,
      user.email,
      parsedState.clientId
    );

    const refreshToken = tokens.refresh_token;
    let account = await EmailAccount.findOne({
      clientId: client._id,
      assistantId: user._id,
      provider: 'gmail',
      address: email,
      simulated: false,
    });

    if (!refreshToken && !account?.google?.refreshTokenEnc) {
      return res.redirect(302, `${base}/onboarding?step=connect&error=exchange_failed`);
    }

    const refreshTokenEnc = refreshToken
      ? encryptToken(refreshToken)
      : account.google.refreshTokenEnc;

    if (account) {
      account.status = 'syncing';
      account.error = undefined;
      account.google = {
        ...account.google,
        sub: String(userInfo.id || ''),
        refreshTokenEnc,
        scope: tokens.scope || account.google?.scope || '',
      };
      await account.save();
    } else {
      account = await EmailAccount.create({
        clientId: client._id,
        assistantId: user._id,
        provider: 'gmail',
        address: email,
        status: 'syncing',
        simulated: false,
        google: {
          sub: String(userInfo.id || ''),
          refreshTokenEnc,
          scope: tokens.scope || '',
        },
      });
    }

    void importGmailAccount(account._id);
    return res.redirect(
      302,
      `${base}/onboarding?step=sync&accountId=${encodeURIComponent(account.id)}`
    );
  } catch (err) {
    logger.warn('Google OAuth callback exchange failed', { message: err?.message });
    const sep = errorTarget.includes('?') ? '&' : '?';
    return res.redirect(302, `${errorTarget}${sep}error=exchange_failed`);
  }
}

