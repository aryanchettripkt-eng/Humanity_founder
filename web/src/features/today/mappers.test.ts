import { describe, expect, it } from 'vitest';
import {
  buildFocusPanelModel,
  buildPersonCards,
  buildTaskCards,
  buildWorkspaceStats,
  collapseActivity,
} from '@/features/today/mappers';
import type { ActivityItem, DashboardSummary, ThreadListItem } from '@/types/api';

const makeThread = (overrides: Partial<ThreadListItem>): ThreadListItem => ({
  id: 't1',
  clientId: 'c1',
  accountId: 'a1',
  subject: 'Q3 Board Deck',
  snippet: 'Please review the deck.',
  participants: [{ name: 'James Chen', email: 'james@sequoia.com' }],
  owner: 'client',
  ownerSource: 'ai',
  confidence: 0.91,
  reason: 'Needs Priya sign-off.',
  category: 'action',
  actionRequired: true,
  waitingOnOthers: false,
  summary: 'Please review the Q3 board deck.',
  keyPoints: ['Final sign-off needed'],
  entities: [],
  aiStatus: 'done',
  history: [],
  handoff: { state: 'none' },
  status: 'open',
  important: true,
  unread: true,
  archived: false,
  lastSender: 'them',
  lastMessageAt: new Date().toISOString(),
  messageCount: 2,
  ...overrides,
});

const SAMPLE_DASHBOARD: DashboardSummary = {
  counts: { assistant: 1, client: 1, review: 1, none: 0 },
  brief: {
    text: 'Priya has one board deck sign-off. Alex has two drafts.',
    generatedAt: new Date().toISOString(),
    fallback: false,
  },
  review: [makeThread({ id: 'rev-1', owner: 'review', subject: 'Quick question', confidence: 0.52 })],
  recent: [
    makeThread({ id: 'rec-1', owner: 'client', subject: 'Board deck sign-off' }),
    makeThread({ id: 'rec-2', owner: 'assistant', subject: 'Reschedule Tuesday coffee' }),
  ],
  nudges: [makeThread({ id: 'nudge-1', owner: 'assistant', subject: 'Follow up with Acme' })],
  upcoming: [
    {
      threadId: 'rec-1',
      subject: 'Board deck sign-off',
      title: 'Board deck sign-off',
      type: 'meeting',
      startsAt: new Date(Date.now() + 3600_000).toISOString(),
    },
  ],
  activity: [],
};

describe('today mappers', () => {
  it('computes workspace stats with deltas from lastSeenCounts', () => {
    const stats = buildWorkspaceStats(
      { assistant: 5, client: 2, review: 1 },
      { assistant: 3, client: 4, review: 1 }
    );
    expect(stats[0]).toMatchObject({ id: 'assistant', value: 5, delta: '+2', deltaTone: 'up' });
    expect(stats[1]).toMatchObject({ id: 'client', value: 2, delta: '-2', deltaTone: 'down' });
    expect(stats[2]).toMatchObject({ id: 'review', value: 1, delta: undefined });
  });

  it('maps person cards and filters by owner', () => {
    const all = buildPersonCards(SAMPLE_DASHBOARD, 'all');
    expect(all).toHaveLength(3);
    expect(all[0].showQuickAssign).toBe(true);

    const clientOnly = buildPersonCards(SAMPLE_DASHBOARD, 'client');
    expect(clientOnly).toHaveLength(1);
    expect(clientOnly[0].id).toBe('rec-1');
  });

  it('builds task cards with highlighted next date and filters by chip', () => {
    const allTasks = buildTaskCards(SAMPLE_DASHBOARD, 'Asia/Kolkata', 'all');
    expect(allTasks[0].highlighted).toBe(true);
    expect(allTasks.some((t) => t.threadId === 'nudge-1')).toBe(true);

    const datesOnly = buildTaskCards(SAMPLE_DASHBOARD, 'Asia/Kolkata', 'dates');
    expect(datesOnly).toHaveLength(1);
    expect(datesOnly[0].iconKind).toBe('calendar');
  });

  it('builds focus panel model for selected thread', () => {
    const model = buildFocusPanelModel('rec-1', SAMPLE_DASHBOARD, 'Asia/Kolkata');
    expect(model?.id).toBe('rec-1');
    expect(model?.phonePreview.isClientQueue).toBe(true);
    expect(model?.dates).toHaveLength(1);
  });

  it('collapses repeated system activity entries', () => {
    const acts: ActivityItem[] = [
      {
        id: '1',
        clientId: 'c1',
        type: 'reclassified',
        actor: { type: 'system', name: 'Relay AI' },
        payload: { subject: 'Deck' },
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        clientId: 'c1',
        type: 'reclassified',
        actor: { type: 'system', name: 'Relay AI' },
        payload: { subject: 'Deck' },
        createdAt: new Date().toISOString(),
      },
    ];
    const collapsed = collapseActivity(acts);
    expect(collapsed).toHaveLength(1);
    expect(collapsed[0].count).toBe(2);
  });
});

