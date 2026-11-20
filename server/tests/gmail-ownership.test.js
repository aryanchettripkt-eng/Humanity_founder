import { afterEach, describe, expect, it, vi } from 'vitest';
import { Activity } from '../src/models/Activity.js';
import { Draft } from '../src/models/Draft.js';
import { EmailAccount } from '../src/models/EmailAccount.js';
import { Message } from '../src/models/Message.js';
import { Thread } from '../src/models/Thread.js';
import { clearDemoInbox } from '../src/services/demo.service.js';
import { buildGoogleAuthUrl } from '../src/services/gmail/oauth.js';
import { mailboxBelongsToUser } from '../src/services/gmail/ownership.js';

describe('Gmail connect only for the signed-in account', () => {
  it('Google sign-in users must come back with the same Google account', () => {
    const user = { email: 'a@gmail.com', googleId: 'sub-a' };
    expect(mailboxBelongsToUser(user, { id: 'sub-a', email: 'a@gmail.com', verified_email: true })).toBe(true);
    expect(mailboxBelongsToUser(user, { id: 'sub-b', email: 'b@gmail.com', verified_email: true })).toBe(false);
    expect(mailboxBelongsToUser(user, { id: 'sub-b', email: 'a@gmail.com', verified_email: true })).toBe(false);
  });

  it('email/password users must connect a verified Google account with their own email', () => {
    const user = { email: 'A@Example.com' };
    expect(mailboxBelongsToUser(user, { id: 'x', email: 'a@example.com', verified_email: true })).toBe(true);
    expect(mailboxBelongsToUser(user, { id: 'x', email: 'b@example.com', verified_email: true })).toBe(false);
    expect(mailboxBelongsToUser(user, { id: 'x', email: 'a@example.com', verified_email: false })).toBe(false);
    expect(mailboxBelongsToUser(user, null)).toBe(false);
  });

  it('pre-selects the signed-in account on the Gmail consent screen', () => {
    const url = new URL(
      buildGoogleAuthUrl({ purpose: 'gmail', state: 's', loginHint: 'a@gmail.com' })
    );
    expect(url.searchParams.get('login_hint')).toBe('a@gmail.com');
    const loginUrl = new URL(buildGoogleAuthUrl({ purpose: 'login', state: 's' }));
    expect(loginUrl.searchParams.get('login_hint')).toBeNull();
  });
});

describe('switching from the demo inbox', () => {
  afterEach(() => vi.restoreAllMocks());

  function chain(result) {
    return { select: vi.fn().mockResolvedValue(result) };
  }

  it('removes only the demo accounts and their sample mail', async () => {
    const findAccounts = vi.spyOn(EmailAccount, 'find').mockReturnValue(chain([{ _id: 'demo1' }]));
    const findThreads = vi
      .spyOn(Thread, 'find')
      .mockReturnValue(chain([{ _id: 't1' }, { _id: 't2' }]));
    const delMsg = vi.spyOn(Message, 'deleteMany').mockResolvedValue({});
    const delDraft = vi.spyOn(Draft, 'deleteMany').mockResolvedValue({});
    const delAct = vi.spyOn(Activity, 'deleteMany').mockResolvedValue({});
    const delThread = vi.spyOn(Thread, 'deleteMany').mockResolvedValue({});
    const delAcc = vi.spyOn(EmailAccount, 'deleteMany').mockResolvedValue({});

    const res = await clearDemoInbox({ assistantId: 'u1', clientId: 'c1' });

    expect(res).toEqual({ accounts: 1, threads: 2 });
    expect(findAccounts).toHaveBeenCalledWith({ assistantId: 'u1', clientId: 'c1', simulated: true });
    expect(findThreads).toHaveBeenCalledWith({ clientId: 'c1', accountId: { $in: ['demo1'] } });
    expect(delMsg).toHaveBeenCalledWith({ threadId: { $in: ['t1', 't2'] } });
    expect(delDraft).toHaveBeenCalledWith({ threadId: { $in: ['t1', 't2'] } });
    expect(delThread).toHaveBeenCalledWith({ _id: { $in: ['t1', 't2'] } });
    expect(delAct).toHaveBeenCalledTimes(2);
    expect(delAcc).toHaveBeenCalledWith({ _id: { $in: ['demo1'] } });
  });

  it('does nothing when there is no demo inbox', async () => {
    vi.spyOn(EmailAccount, 'find').mockReturnValue(chain([]));
    const delThread = vi.spyOn(Thread, 'deleteMany');
    const res = await clearDemoInbox({ assistantId: 'u1', clientId: 'c1' });
    expect(res).toEqual({ accounts: 0, threads: 0 });
    expect(delThread).not.toHaveBeenCalled();
  });
});
