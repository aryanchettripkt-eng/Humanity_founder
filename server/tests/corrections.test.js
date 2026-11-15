import { describe, expect, it } from 'vitest';
import { formatCorrections } from '../src/services/classification.service.js';

describe('formatCorrections (B4.5 few-shot)', () => {
  it('uses the latest manual or client correction that matches the current owner', () => {
    const lines = formatCorrections([
      {
        subject: 'Dinner with the Kapoors',
        owner: 'client',
        participants: [{ email: 'rohan@kapoorfamily.example.com' }],
        history: [
          { from: 'review', to: 'assistant', source: 'ai', reason: 'Scheduling' },
          { from: 'assistant', to: 'client', source: 'manual', reason: 'Changed manually by Alex' },
        ],
      },
      {
        subject: 'Podcast invite',
        owner: 'assistant',
        participants: [{ email: 'ben@studiohour.example.com' }],
        history: [{ from: 'client', to: 'assistant', source: 'client', reason: 'Client note: after Dec 1' }],
      },
    ]);
    expect(lines).toEqual([
      '- "Dinner with the Kapoors" from rohan@kapoorfamily.example.com -> client (the assistant corrected it: Changed manually by Alex)',
      '- "Podcast invite" from ben@studiohour.example.com -> assistant (the client handed it over: Client note: after Dec 1)',
    ]);
  });

  it('skips threads with no human correction, review owners, and caps at 5', () => {
    const corrected = (i) => ({
      subject: `S${i}`,
      owner: 'none',
      participants: [{ email: `a${i}@x.com` }],
      history: [{ from: 'assistant', to: 'none', source: 'manual' }],
    });
    const lines = formatCorrections([
      { subject: 'AI only', owner: 'client', history: [{ to: 'client', source: 'ai' }] },
      { subject: 'Review', owner: 'review', history: [{ to: 'review', source: 'manual' }] },
      ...Array.from({ length: 7 }, (_, i) => corrected(i)),
    ]);
    expect(lines).toHaveLength(5);
    expect(lines[0]).toBe('- "S0" from a0@x.com -> none (the assistant corrected it)');
  });
});

describe('formatLocalStamp', () => {
  it('shows the message time in the client timezone with its weekday', async () => {
    const { formatLocalStamp } = await import('../src/services/classification.service.js');
    // Sat 22:03 UTC is already Sunday morning in India.
    expect(formatLocalStamp('2026-11-14T22:03:00Z', 'Asia/Kolkata')).toBe('Sun 2026-11-15 03:33');
    expect(formatLocalStamp('not a date', 'Asia/Kolkata')).toBe('unknown time');
  });
});
