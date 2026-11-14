import { describe, expect, it } from 'vitest';
import { getProvider } from '../src/ai/index.js';
import { askSchema, classificationSchema } from '../src/ai/schemas.js';
import { parseJSONResponse, runJSONWithRetry } from '../src/ai/utils.js';

describe('AI provider & JSON retry', () => {
  it('mock provider classifies newsletter/receipt as none', async () => {
    const provider = getProvider('mock');
    const res = await provider.generateJSON({
      system: 'sys',
      prompt: 'Monthly Stripe receipt. Click unsubscribe to opt out.',
      schema: classificationSchema,
    });
    expect(res.owner).toBe('none');
    expect(res.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('mock provider classifies investor/approval as client', async () => {
    const provider = getProvider('mock');
    const res = await provider.generateJSON({
      system: 'sys',
      prompt: 'Please approve the term sheet for our investor round.',
      schema: classificationSchema,
    });
    expect(res.owner).toBe('client');
    expect(res.clientReason).toBeTruthy();
  });

  it('mock provider classifies scheduling as assistant', async () => {
    const provider = getProvider('mock');
    const res = await provider.generateJSON({
      system: 'sys',
      prompt: 'Can we reschedule Tuesday meeting on the calendar?',
      schema: classificationSchema,
    });
    expect(res.owner).toBe('assistant');
  });

  it('mock provider returns low confidence for ambiguous text', async () => {
    const provider = getProvider('mock');
    const res = await provider.generateJSON({
      system: 'sys',
      prompt: 'Quick question — are you around next week?',
      schema: classificationSchema,
    });
    expect(res.confidence).toBeLessThan(0.7);
  });

  it('mock provider extracts threadIds for askSchema', async () => {
    const provider = getProvider('mock');
    const id = '507f1f77bcf86cd799439011';
    const res = await provider.generateJSON({
      system: 'sys',
      prompt: `Question: what is waiting?\nThreads:\nid=${id} subject="Test"`,
      schema: askSchema,
    });
    expect(res.threadIds).toEqual([id]);
  });

  it('parseJSONResponse strips markdown code fences', () => {
    const parsed = parseJSONResponse('```json\n{"ok":true}\n```');
    expect(parsed).toEqual({ ok: true });
  });

  it('runJSONWithRetry retries once when first output is invalid JSON', async () => {
    let calls = 0;
    const result = await runJSONWithRetry({
      system: 'sys',
      prompt: 'give json',
      schema: askSchema,
      callRaw: async () => {
        calls += 1;
        if (calls === 1) return 'not json at all';
        return JSON.stringify({ answer: 'Fixed', threadIds: [] });
      },
    });
    expect(calls).toBe(2);
    expect(result).toEqual({ answer: 'Fixed', threadIds: [] });
  });
});
