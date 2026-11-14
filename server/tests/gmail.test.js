import crypto from 'node:crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Message } from '../src/models/Message.js';
import { Thread } from '../src/models/Thread.js';
import {
  decryptToken,
  encryptToken,
  signOAuthState,
  verifyOAuthState,
} from '../src/services/gmail/crypto.js';
import { upsertMappedThread } from '../src/services/gmail/import.js';
import { mapGmailThread, trimQuotedReplies } from '../src/services/gmail/mapper.js';
import { callGmailWithRetry } from '../src/services/gmail/oauth.js';

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

describe('quoted reply trimming & idempotent upsert dedupe (G6.7)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('trims On ... wrote: quoted chains for AI prompts', () => {
    const body = 'Sounds good, let us do 3pm.\n\nOn Mon, Nov 10, 2026 Bob wrote:\n> Earlier text';
    expect(trimQuotedReplies(body)).toBe('Sounds good, let us do 3pm.');
  });

  it('upserts Thread and Message by externalId without duplicating on re-import', async () => {
    const fakeAccount = { _id: 'acc1', clientId: 'client1', address: 'priya@acme.com' };
    const fakeThread = { _id: 'thr1', aiStatus: 'done' };

    const findOneSpy = vi
      .spyOn(Thread, 'findOne')
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(fakeThread);
    const createSpy = vi.spyOn(Thread, 'create').mockResolvedValue(fakeThread);
    const updateThreadSpy = vi.spyOn(Thread, 'findByIdAndUpdate').mockResolvedValue(fakeThread);
    const updateMsgSpy = vi
      .spyOn(Message, 'updateOne')
      .mockResolvedValueOnce({ upsertedCount: 1 })
      .mockResolvedValueOnce({ upsertedCount: 0 });

    const mapped = {
      threadData: {
        source: 'gmail',
        externalId: 'g_t_1',
        subject: 'Hello',
        snippet: 'Hi',
        participants: [{ name: 'Bob', email: 'bob@vc.com' }],
        lastMessageAt: new Date(),
        messageCount: 1,
        lastSender: 'them',
        unread: true,
        important: false,
        archived: false,
        status: 'open',
      },
      messagesData: [
        {
          externalId: 'g_m_1',
          from: { name: 'Bob', email: 'bob@vc.com' },
          to: [{ name: 'Priya', email: 'priya@acme.com' }],
          cc: [],
          sentAt: new Date(),
          bodyText: 'Hi',
          direction: 'inbound',
          simulated: false,
        },
      ],
    };

    const first = await upsertMappedThread({ account: fakeAccount, mapped });
    const second = await upsertMappedThread({ account: fakeAccount, mapped });

    expect(first.isNew).toBe(true);
    expect(first.hasNewInbound).toBe(true);
    expect(second.isNew).toBe(false);
    expect(second.hasNewInbound).toBe(false);
    expect(findOneSpy).toHaveBeenCalledTimes(2);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(updateThreadSpy).toHaveBeenCalledTimes(1);
    expect(updateMsgSpy).toHaveBeenCalledTimes(2);
    expect(updateMsgSpy).toHaveBeenCalledWith(
      { threadId: 'thr1', externalId: 'g_m_1' },
      expect.objectContaining({ $setOnInsert: expect.any(Object) }),
      { upsert: true }
    );
  });

  it('retries Gmail API calls on Quota exceeded / 429 and succeeds', async () => {
    let attempts = 0;
    const res = await callGmailWithRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          const err = new Error('Quota exceeded for quota metric "Queries" and limit "Units per minute per user"');
          err.code = 429;
          throw err;
        }
        return 'ok';
      },
      { baseDelayMs: 5, maxAttempts: 4 }
    );
    expect(attempts).toBe(3);
    expect(res).toBe('ok');
  });
});

