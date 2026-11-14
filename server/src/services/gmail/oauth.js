import { google } from 'googleapis';
import { env } from '../../config/env.js';

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

