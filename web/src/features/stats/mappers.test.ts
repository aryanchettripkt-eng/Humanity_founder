import { describe, expect, it } from 'vitest';
import {
  activityLine,
  confidenceBuckets,
  handoffStats,
  inRange,
  normaliseConfidence,
  pct,
  sortingStats,
  volumeByDay,
} from '@/features/stats/mappers';
import type { ActivityItem, ThreadListItem } from '@/types/api';

const NOW = new Date('2026-11-15T12:00:00');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString();

const t = (over: Partial<ThreadListItem> & { id: string }) =>
  ({
    owner: 'assistant',
    ownerSource: 'ai',
    confidence: 0.95,
    history: [],
    handoff: { state: 'none' },
    lastMessageAt: daysAgo(0),
    ...over,
  }) as unknown as ThreadListItem;

describe('stats mappers', () => {
  it('keeps only threads inside the range', () => {
    const list = [t({ id: 'a' }), t({ id: 'b', lastMessageAt: daysAgo(6) }), t({ id: 'c', lastMessageAt: daysAgo(9) })];
    expect(inRange(list, 7, NOW).map((x) => x.id)).toEqual(['a', 'b']);
    expect(inRange(list, 30, NOW)).toHaveLength(3);
  });

  it('buckets volume per day by owner, oldest first', () => {
    const days = volumeByDay(
      [t({ id: 'a' }), t({ id: 'b', owner: 'client' }), t({ id: 'c', lastMessageAt: daysAgo(6), owner: 'none' })],
      7,
      NOW
    );
    expect(days).toHaveLength(7);
    expect(days[6]).toMatchObject({ assistant: 1, client: 1, none: 0 });
    expect(days[0]).toMatchObject({ none: 1 });
  });

  it('splits sorting into kept, corrected and rules', () => {
    const s = sortingStats([
      t({ id: 'a' }),
      t({ id: 'b', ownerSource: 'manual' }),
      t({ id: 'c', ownerSource: 'rule' }),
      t({ id: 'd', history: [{ from: 'review', to: 'client', source: 'manual' }] as ThreadListItem['history'] }),
      t({ id: 'e', owner: 'review' }),
    ]);
    expect(s).toEqual({ total: 5, keptAsSorted: 2, correctedByYou: 2, byYourRules: 1, neededYourCall: 2 });
  });

  it('buckets AI confidence on either scale', () => {
    expect(normaliseConfidence(82)).toBeCloseTo(0.82);
    const b = confidenceBuckets([
      t({ id: 'a', confidence: 0.4 }),
      t({ id: 'b', confidence: 75 }),
      t({ id: 'c', confidence: 1 }),
      t({ id: 'd', confidence: 0.2, ownerSource: 'manual' }),
    ]);
    expect(b.map((x) => x.value)).toEqual([1, 0, 1, 1]);
  });

  it('counts client handoffs and formats percentages', () => {
    expect(
      handoffStats([
        t({ id: 'a', handoff: { state: 'client_handling' } as ThreadListItem['handoff'] }),
        t({ id: 'b', handoff: { state: 'handled' } as ThreadListItem['handoff'] }),
      ])
    ).toEqual({ handling: 1, handedBack: 0, handled: 1 });
    expect(pct(1, 3)).toBe('33%');
    expect(pct(0, 0)).toBe('0%');
  });

  it('describes activity truthfully', () => {
    const a = (type: ActivityItem['type'], payload = {}) =>
      ({ id: '1', clientId: 'c', actor: { type: 'client', name: 'Priya' }, type, payload, createdAt: '' }) as ActivityItem;
    expect(activityLine(a('client_note', { note: 'Say yes' }))).toEqual({ text: 'Priya added a note', detail: '“Say yes”' });
    expect(activityLine(a('draft_sent', { subject: 'Hi' })).text).toBe('Priya saved a reply');
  });
});
