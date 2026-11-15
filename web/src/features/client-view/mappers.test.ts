import { describe, expect, it } from 'vitest';
import {
  clientStatusLabel,
  clientSummaryLine,
  filterClientQueue,
} from '@/features/client-view/mappers';
import type { ThreadListItem } from '@/types/api';

const t = (id: string, handling = false) =>
  ({
    id,
    participants: [{ name: id, email: `${id}@x.com` }],
    handoff: { state: handling ? 'client_handling' : 'none' },
  }) as unknown as ThreadListItem;

describe('client view mappers', () => {
  it('filters the queue by tab', () => {
    const q = [t('a'), t('b', true), t('c')];
    expect(filterClientQueue(q, 'all').map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(filterClientQueue(q, 'needs').map((x) => x.id)).toEqual(['a', 'c']);
    expect(filterClientQueue(q, 'handling').map((x) => x.id)).toEqual(['b']);
  });

  it('builds a true summary sentence', () => {
    expect(clientSummaryLine([])).toBe("You're all caught up. Your assistant has everything else.");
    expect(clientSummaryLine([t('a')])).toBe('1 email needs you.');
    expect(clientSummaryLine([t('a'), t('b'), t('c', true)])).toBe(
      "2 emails need you. You're handling 1."
    );
    expect(clientSummaryLine([t('c', true)])).toBe("You're handling 1.");
  });

  it('labels status', () => {
    expect(clientStatusLabel(t('a'))).toBe('Needs you');
    expect(clientStatusLabel(t('a', true))).toBe("You're on it");
  });
});
