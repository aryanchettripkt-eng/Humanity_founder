import { describe, expect, it } from 'vitest';
import { SEGMENT_IDS, segmentFilter } from '../src/services/segments.js';

describe('segmentFilter', () => {
  it('supports every segment defined in BACKEND §4', () => {
    for (const seg of SEGMENT_IDS) {
      const filter = segmentFilter(seg);
      expect(filter).toBeTypeOf('object');
      if (seg === 'archived') {
        expect(filter.archived).toBe(true);
      } else {
        expect(filter.archived).toBe(false);
      }
    }
  });

  it('maps owner segments to open non-archived threads', () => {
    for (const owner of ['assistant', 'client', 'review', 'none']) {
      expect(segmentFilter(owner)).toEqual({
        owner,
        status: 'open',
        archived: false,
      });
    }
  });

  it('maps action, waiting, meetings, important, general, done', () => {
    expect(segmentFilter('action')).toEqual({
      actionRequired: true,
      status: 'open',
      archived: false,
    });
    expect(segmentFilter('waiting')).toEqual({
      waitingOnOthers: true,
      status: 'open',
      archived: false,
    });
    expect(segmentFilter('meetings').$or).toEqual([
      { category: 'meeting' },
      { 'entities.type': 'meeting' },
    ]);
    expect(segmentFilter('important')).toEqual({ important: true, archived: false });
    expect(segmentFilter('general')).toEqual({
      category: { $in: ['general', 'update', 'newsletter'] },
      archived: false,
    });
    expect(segmentFilter('done')).toEqual({ status: 'done', archived: false });
  });
});
