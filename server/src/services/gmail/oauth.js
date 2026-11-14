import { google } from 'googleapis';
import { env } from '../../config/env.js';

const activeSyncAccounts = new Set();

export function isAccountSyncing(accountId) {
  return activeSyncAccounts.has(String(accountId));
}

export function tryLockAccount(accountId) {
  const id = String(accountId);
  if (activeSyncAccounts.has(id)) return false;
  activeSyncAccounts.add(id);
  return true;
}

export function unlockAccount(accountId) {
  activeSyncAccounts.delete(String(accountId));
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isGmailRateLimitError(err) {
  const status = err?.code || err?.status || err?.response?.status;
  const msg = String(err?.message || '');
  const reason = err?.errors?.[0]?.reason || err?.response?.data?.error?.errors?.[0]?.reason || '';
  if (status === 429) return true;
  if (status === 403 && (reason.includes('rateLimitExceeded') || reason.includes('userRateLimitExceeded'))) {
    return true;
  }
  return msg.includes('Quota exceeded') || msg.includes('rateLimitExceeded');
}

/**
 * Call a Gmail API request with exponential backoff (1s, 2s, 4s; max 4 tries) on rate/quota errors.
 */
export async function callGmailWithRetry(fn, { baseDelayMs = 1000, maxAttempts = 4 } = {}) {
  let delay = baseDelayMs;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      if (attempt < maxAttempts - 1 && isGmailRateLimitError(err)) {
        await sleep(delay);
        delay *= 2;
        continue;
      }
      throw err;
    }
  }
}

export const LOGIN_SCOPES = ['openid', 'email', 'profile'];
export const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'openid',
  'email',
];

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI
  );
}

export function buildGoogleAuthUrl({ purpose, state }) {
  const client = createOAuth2Client();
  const scopes = purpose === 'gmail' ? GMAIL_SCOPES : LOGIN_SCOPES;
  return client.generateAuthUrl({
    access_type: purpose === 'gmail' ? 'offline' : 'online',
    prompt: purpose === 'gmail' ? 'consent' : 'select_account',
    include_granted_scopes: true,
    scope: scopes,
    state,
  });
}

export async function exchangeCodeForTokens(code) {
  const client = createOAuth2Client();
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const oauth2 = google.oauth2({ version: 'v2', auth: client });
  const { data: userInfo } = await oauth2.userinfo.get();
  return { tokens, userInfo };
}

export async function createAuthedGmailClient(refreshToken) {
  const client = createOAuth2Client();
  client.setCredentials({ refresh_token: refreshToken });
  return google.gmail({ version: 'v1', auth: client });
}

export async function revokeGoogleToken(refreshToken) {
  if (!refreshToken) return;
  const client = createOAuth2Client();
  await client.revokeToken(refreshToken);
}

