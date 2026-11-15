import { describe, expect, it } from 'vitest';
import {
  buildGroveRecentRows,
  buildGroveStats,
  buildGroveThreadCards,
  buildNeedsYourCallList,
  buildTodaySummary,
  buildWeeklyBars,
  collapseActivity,
  confirmPillLabel,
  ctaLabelForThread,
  filterThreadsForTodayTab,
  statusChipLabel,
} from '@/features/today/mappers';
import type { ActivityItem, ThreadListItem, UpcomingItem } from '@/types/api';

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

describe('today grove mappers', () => {
  it('computes 7-day weekly stacked bars from threads', () => {
    const nowIso = new Date().toISOString();
    const bars = buildWeeklyBars([
      makeThread({ id: '1', owner: 'assistant', lastMessageAt: nowIso }),
      makeThread({ id: '2', owner: 'client', lastMessageAt: nowIso }),
      makeThread({ id: '3', owner: 'none', lastMessageAt: nowIso }),
    ]);
    expect(bars).toHaveLength(7);
    const todayBar = bars[6];
    expect(todayBar.assistant).toBe(1);
    expect(todayBar.client).toBe(1);
    expect(todayBar.none).toBe(1);
  });

  it('builds For you and For client glass stats with deltas', () => {
    const stats = buildGroveStats(
      { assistant: 5, client: 2 },
      { assistant: 3, client: 2, review: 0 },
      'Priya',
      [makeThread({ id: '1', owner: 'client' })]
    );
    expect(stats[0]).toMatchObject({ label: 'For you', value: 5, delta: '+2 since your last visit' });
    expect(stats[1]).toMatchObject({ label: 'For Priya', value: 2, delta: '1 waiting on Priya' });
  });

  it('builds Needs your call list or falls back to Next up', () => {
    const reviewList = buildNeedsYourCallList(
      [makeThread({ id: 'r1', owner: 'review', confidence: 0.55 })],
      [],
      'Asia/Kolkata'
    );
    expect(reviewList.title).toBe('Needs your call');
    expect(reviewList.rows).toHaveLength(1);
    expect(reviewList.rows[0].rightText).toBe('55%');

    const upcoming: UpcomingItem[] = [
      {
        threadId: 'u1',
        subject: 'Board deck',
        title: 'Board sign-off',
        type: 'meeting',
        startsAt: new Date(Date.now() + 3600_000).toISOString(),
      },
    ];
    const nextUp = buildNeedsYourCallList([], upcoming, 'Asia/Kolkata');
    expect(nextUp.title).toBe('Next up');
    expect(nextUp.rows).toHaveLength(1);
  });

  it('filters grove thread cards by owner and builds recent rows', () => {
    const threads = [
      makeThread({ id: 'a1', owner: 'assistant', participants: [{ name: 'Alex', email: 'a@acme.com' }] }),
      makeThread({ id: 'c1', owner: 'client', participants: [{ name: 'Maya', email: 'm@northstar.io' }] }),
    ];
    const filtered = buildGroveThreadCards(
      threads,
      { owner: 'client', category: 'all', date: 'all', confidence: 'all', source: 'all' },
      'Priya'
    );
    expect(filtered).toHaveLength(1);
    expect(filtered[0].domain).toBe('northstar.io');
    expect(filtered[0].ctaLabel).toBe("Open in Priya's view");

    const recent = buildGroveRecentRows(threads);
    expect(recent).toHaveLength(2);
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

  it('computes all CTA labels from owner, importance, and handoff state', () => {
    expect(ctaLabelForThread(makeThread({ owner: 'assistant' }), 'Priya')).toBe('Draft reply');
    expect(
      ctaLabelForThread(
        makeThread({ owner: 'client', important: false, handoff: { state: 'none' } }),
        'Priya'
      )
    ).toBe('Move up for Priya');
    expect(
      ctaLabelForThread(
        makeThread({ owner: 'client', important: true, handoff: { state: 'none' } }),
        'Priya'
      )
    ).toBe("Open in Priya's view");
    expect(
      ctaLabelForThread(
        makeThread({
          owner: 'client',
          important: false,
          handoff: { state: 'client_handling' },
        }),
        'Priya'
      )
    ).toBe("Open in Priya's view");
    expect(ctaLabelForThread(makeThread({ owner: 'review' }), 'Priya')).toBe('Confirm');
  });

  it('omits fabricated sparklines and formats singular message count', () => {
    const cards = buildGroveThreadCards(
      [makeThread({ id: 's1', owner: 'assistant', messageCount: 1 })],
      { owner: 'all', category: 'all', date: 'week', confidence: 'all', source: 'all' },
      'Priya',
      'Asia/Kolkata'
    );
    expect(cards).toHaveLength(1);
    expect(cards[0].series).toEqual([]);
    expect(cards[0].deltaText).toBe('1 msg');
  });

  it('buckets weekly bars using the client timezone', () => {
    const nowIso = new Date().toISOString();
    const bars = buildWeeklyBars(
      [makeThread({ id: 'tz1', owner: 'assistant', lastMessageAt: nowIso })],
      'Asia/Kolkata'
    );
    expect(bars).toHaveLength(7);
    expect(bars[6].assistant).toBe(1);
  });

  it('builds counts-based summary sentence with singular, plural, zero clauses, and all caught up', () => {
    expect(buildTodaySummary(2, 10, 'Priya')).toBe(
      '2 emails need your call. Priya has 10 waiting.'
    );
    expect(buildTodaySummary(1, 3, 'Priya')).toBe(
      '1 email needs your call. Priya has 3 waiting.'
    );
    expect(buildTodaySummary(0, 4, 'Priya')).toBe('Priya has 4 waiting.');
    expect(buildTodaySummary(2, 0, 'Priya')).toBe('2 emails need your call.');
    expect(buildTodaySummary(0, 0, 'Priya')).toBe("You're all caught up.");
  });

  it('builds confirm pill and status chip labels truthfully', () => {
    expect(confirmPillLabel('assistant', 'Priya')).toBe('✓ You');
    expect(confirmPillLabel('client', 'Priya')).toBe('✓ Priya');
    expect(confirmPillLabel('none', 'Priya')).toBe('Choose');
    expect(confirmPillLabel(undefined, 'Priya')).toBe('Choose');

    expect(statusChipLabel('review', 'Priya')).toBe('Needs your call');
    expect(statusChipLabel('assistant', 'Priya')).toBe('You reply');
    expect(statusChipLabel('client', 'Priya')).toBe('Waiting on Priya');
    expect(statusChipLabel('none', 'Priya')).toBe('No reply');
  });

  it('filters threads by Today tab with review first in needs_action', () => {
    const threads = [
      makeThread({ id: 'a1', owner: 'assistant' }),
      makeThread({ id: 'c1', owner: 'client' }),
      makeThread({ id: 'r1', owner: 'review' }),
      makeThread({ id: 'n1', owner: 'none' }),
    ];
    expect(filterThreadsForTodayTab(threads, 'needs_action').map((t) => t.id)).toEqual(['r1', 'a1']);
    expect(filterThreadsForTodayTab(threads, 'assistant').map((t) => t.id)).toEqual(['a1']);
    expect(filterThreadsForTodayTab(threads, 'client').map((t) => t.id)).toEqual(['c1']);
    expect(filterThreadsForTodayTab(threads, 'all').map((t) => t.id)).toEqual([
      'a1',
      'c1',
      'r1',
      'n1',
    ]);
  });
});
