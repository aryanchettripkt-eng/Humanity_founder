import { Activity } from '../models/Activity.js';
import { Draft } from '../models/Draft.js';
import { EmailAccount } from '../models/EmailAccount.js';
import { Message } from '../models/Message.js';
import { Thread } from '../models/Thread.js';

/**
 * Remove the demo inbox from one client: every simulated EmailAccount the assistant
 * connected for that client, plus the sample threads, messages, drafts and activity
 * that came with it. Real Gmail accounts and their mail are left alone.
 * Used when the user switches from the demo inbox to their real Gmail.
 * @param {{ assistantId: any, clientId: any }} params
 * @returns {Promise<{ accounts: number, threads: number }>}
 */
export async function clearDemoInbox({ assistantId, clientId }) {
  const demoAccounts = await EmailAccount.find({ assistantId, clientId, simulated: true }).select(
    '_id'
  );
  const accountIds = demoAccounts.map((a) => a._id);
  if (accountIds.length === 0) return { accounts: 0, threads: 0 };

  const threads = await Thread.find({ clientId, accountId: { $in: accountIds } }).select('_id');
  const threadIds = threads.map((t) => t._id);

  if (threadIds.length > 0) {
    await Message.deleteMany({ threadId: { $in: threadIds } });
    await Draft.deleteMany({ threadId: { $in: threadIds } });
    await Activity.deleteMany({ clientId, threadId: { $in: threadIds } });
    await Thread.deleteMany({ _id: { $in: threadIds } });
  }
  await Activity.deleteMany({
    clientId,
    'payload.accountId': { $in: accountIds.map((id) => String(id)) },
  });
  await EmailAccount.deleteMany({ _id: { $in: accountIds } });

  return { accounts: accountIds.length, threads: threadIds.length };
}
