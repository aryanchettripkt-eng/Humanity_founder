import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  decryptToken,
  encryptToken,
  signOAuthState,
  verifyOAuthState,
} from '../src/services/gmail/crypto.js';
import { mapGmailThread } from '../src/services/gmail/mapper.js';

function b64url(str) {
  return Buffer.from(str, 'utf8').toString('base64url');
}

describe('gmail mapper (G6.7)', () => {
  it('maps multipart message, prefers text/plain, detects inbound/outbound & labels', () => {
    const gmailThread = {
      id: 'g_thread_1',
      snippet: 'Fallback snippet',
      messages: [
        {
          id: 'g_msg_1',
          internalDate: String(Date.parse('2026-11-10T10:00:00Z')),
          labelIds: ['INBOX', 'IMPORTANT'],
          payload: {
            mimeType: 'multipart/alternative',
            headers: [
              { name: 'From', value: 'Investor Bob <bob@vc.com>' },
              { name: 'To', value: 'Priya Nair <priya@acme.com>' },
              { name: 'Subject', value: 'Q4 Board Deck' },
            ],
            parts: [
              { mimeType: 'text/plain', body: { data: b64url('Can we review the deck on Thursday?') } },
              { mimeType: 'text/html', body: { data: b64url('<p>Can we review the deck on Thursday?</p>') } },
            ],
          },
        },
        {
          id: 'g_msg_2',
          internalDate: String(Date.parse('2026-11-10T12:00:00Z')),
          labelIds: ['SENT'],
          payload: {
            mimeType: 'text/plain',
            headers: [
              { name: 'From', value: 'Priya Nair <priya@acme.com>' },
              { name: 'To', value: 'Investor Bob <bob@vc.com>' },
              { name: 'Subject', value: 'Re: Q4 Board Deck' },
            ],
            body: { data: b64url('Yes, Thursday 2pm works.') },
          },
        },
      ],
    };

    const { threadData, messagesData } = mapGmailThread(gmailThread, 'priya@acme.com');

    expect(threadData.source).toBe('gmail');
    expect(threadData.externalId).toBe('g_thread_1');
    expect(threadData.subject).toBe('Q4 Board Deck');
    expect(threadData.important).toBe(true);
    expect(threadData.unread).toBe(false);
    expect(threadData.lastSender).toBe('us');
    expect(threadData.messageCount).toBe(2);
    expect(threadData.participants).toEqual([{ name: 'Investor Bob', email: 'bob@vc.com' }]);

    expect(messagesData[0].direction).toBe('inbound');
    expect(messagesData[0].bodyText).toBe('Can we review the deck on Thursday?');
    expect(messagesData[1].direction).toBe('outbound');
    expect(messagesData[1].simulated).toBe(false);
  });

  it('falls back to html-only stripped text and UNREAD label', () => {
    const gmailThread = {
      id: 'g_thread_2',
      messages: [
        {
          id: 'g_msg_html',
          internalDate: String(Date.parse('2026-11-11T09:00:00Z')),
          labelIds: ['INBOX', 'UNREAD'],
          payload: {
            mimeType: 'text/html',
            headers: [
              { name: 'From', value: 'billing@vendor.io' },
              { name: 'To', value: 'priya@acme.com' },
              { name: 'Subject', value: 'Invoice #441' },
            ],
            body: {
              data: b64url('<div><p>Hello,</p><p>Invoice <b>#441</b> is due Friday.</p></div>'),
            },
          },
        },
      ],
    };

    const { threadData, messagesData } = mapGmailThread(gmailThread, 'priya@acme.com');
    expect(threadData.unread).toBe(true);
    expect(threadData.lastSender).toBe('them');
    expect(messagesData[0].bodyText).toContain('Hello,');
    expect(messagesData[0].bodyText).toContain('Invoice #441 is due Friday.');
    expect(messagesData[0].bodyHtml).toContain('<b>#441</b>');
  });
});

describe('gmail crypto & OAuth state (G6.7)', () => {
  it('encrypts and decrypts refresh tokens with AES-256-GCM', () => {
    const key = crypto.randomBytes(32).toString('base64');
    const secret = '1//0gFakeRefreshTokenForUnitTest';
    const enc = encryptToken(secret, key);

    expect(enc).not.toContain(secret);
    expect(enc.split('.')).toHaveLength(3);
    expect(decryptToken(enc, key)).toBe(secret);
  });

  it('signs and verifies short-lived OAuth state JWTs', () => {
    const jwtSecret = 'unit-test-secret-32-chars-minimum!';
    const state = signOAuthState(
      { purpose: 'gmail', userId: 'u1', clientId: 'c1' },
      jwtSecret
    );
    const decoded = verifyOAuthState(state, jwtSecret);

    expect(decoded.purpose).toBe('gmail');
    expect(decoded.userId).toBe('u1');
    expect(decoded.clientId).toBe('c1');
    expect(typeof decoded.nonce).toBe('string');
    expect(() => verifyOAuthState(`${state}tamper`, jwtSecret)).toThrow();
  });
});

