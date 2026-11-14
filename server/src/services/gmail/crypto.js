import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const ALG = 'aes-256-gcm';

function getKey(rawKey = env.TOKEN_ENC_KEY) {
  if (!rawKey) {
    throw new Error('TOKEN_ENC_KEY is not configured');
  }
  const buf = Buffer.from(rawKey, 'base64');
  if (buf.length !== 32) {
    throw new Error('TOKEN_ENC_KEY must decode to 32 bytes (base64)');
  }
  return buf;
}

/** Encrypt a refresh token with AES-256-GCM. Returns `iv.tag.ciphertext` (base64url). */
export function encryptToken(plaintext, rawKey = env.TOKEN_ENC_KEY) {
  const key = getKey(rawKey);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALG, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString('base64url')).join('.');
}

/** Decrypt an AES-256-GCM encrypted token produced by `encryptToken`. */
export function decryptToken(payload, rawKey = env.TOKEN_ENC_KEY) {
  const key = getKey(rawKey);
  const parts = String(payload || '').split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted token format');
  }
  const [ivB64, tagB64, dataB64] = parts;
  const decipher = crypto.createDecipheriv(ALG, key, Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64url')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

/** Sign a short-lived (10 min) OAuth state JWT. */
export function signOAuthState({ purpose, userId, clientId, returnTo }, secret = env.JWT_SECRET) {
  const nonce = crypto.randomBytes(12).toString('hex');
  return jwt.sign({ purpose, userId, clientId, returnTo, nonce }, secret, { expiresIn: '10m' });
}

/** Verify and decode an OAuth state JWT. */
export function verifyOAuthState(stateToken, secret = env.JWT_SECRET) {
  const payload = jwt.verify(stateToken, secret);
  if (!payload || typeof payload !== 'object' || !['login', 'gmail'].includes(payload.purpose)) {
    throw new Error('Invalid OAuth state');
  }
  return payload;
}

