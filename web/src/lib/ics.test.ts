import { describe, expect, it } from 'vitest';
import { buildIcsContent } from '@/lib/ics';

describe('buildIcsContent', () => {
  it('generates valid VCALENDAR/VEVENT content with title, start, end, and location', () => {
    const ics = buildIcsContent({
      title: 'Series B Call',
      startsAt: '2026-11-20T15:00:00.000Z',
      endsAt: '2026-11-20T16:00:00.000Z',
      location: 'Zoom',
    });
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('SUMMARY:Series B Call');
    expect(ics).toContain('DTSTART:20261120T150000Z');
    expect(ics).toContain('DTEND:20261120T160000Z');
    expect(ics).toContain('LOCATION:Zoom');
    expect(ics).toContain('END:VCALENDAR');
  });
});

