import { describe, expect, it } from 'vitest';
import {
  DESK_FILTERS,
  deskChipLabel,
  handledWithin,
  handoffCardTitle,
  handoffChipLabel,
  isDeskFilterActive,
  latestClientNote,
} from '@/features/client-desk/mappers';
import type { ActivityItem, ThreadListItem } from '@/types/api';

const NOW = new Date('2026-11-15T12:00:00Z').getTime();
const ago = (d: number) => new Date(NOW - d * 86_400_000).toISOString();

describe('client desk mappers', () => {
  it('labels chips truthfully (D20)', () => {
    expect(DESK_FILTERS.map((f) => deskChipLabel(f.id, 'Priya'))).toEqual([
      'Waiting on Priya',
      "Priya's on it",
      'Handed back to you',
      'Handled by Priya · 7d',
    ]);
    expect(handoffChipLabel('none', 'Priya')).toBeNull();
    expect(handoffChipLabel('handed_to_assistant', 'Priya')).toBe('Handed back');
    expect(handoffCardTitle('client_handling', 'Priya')).toBe('Priya is handling this');
  });

  it('knows which chip is active from segment and handoff', () => {
    const [waiting, onIt] = DESK_FILTERS;
    expect(isDeskFilterActive(waiting, 'client', null)).toBe(true);
    expect(isDeskFilterActive(waiting, 'client', 'client_handling')).toBe(false);
    expect(isDeskFilterActive(onIt, 'client', 'client_handling')).toBe(true);
    expect(isDeskFilterActive(onIt, 'inbox', 'client_handling')).toBe(false);
  });

  it('counts only threads handled in the window', () => {
    const t = (at: string) => ({ handoff: { state: 'handled', at } }) as unknown as ThreadListItem;
    expect(handledWithin([t(ago(1)), t(ago(6)), t(ago(9))], 7, NOW)).toBe(2);
  });

  it('finds the newest note from a note or a hand-back', () => {
    const a = (type: ActivityItem['type'], note: string | undefined, at: string, threadId = 't') =>
      ({ id: at, clientId: 'c', actor: { type: 'client', name: 'P' }, type, threadId, payload: note ? { note } : {}, createdAt: at }) as ActivityItem;
    expect(latestClientNote([])).toBeNull();
    expect(
      latestClientNote([
        a('client_note', 'old', ago(3), 't1'),
        a('client_handling', undefined, ago(0)),
        a('client_handoff', 'newest', ago(1), 't2'),
      ])
    ).toEqual({ note: 'newest', threadId: 't2', at: ago(1) });
  });
});
