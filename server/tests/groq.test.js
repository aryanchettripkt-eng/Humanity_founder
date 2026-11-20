import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const create = vi.fn();
vi.mock('groq-sdk', () => ({
  default: class {
    constructor() {
      this.chat = { completions: { create } };
    }
  },
}));
vi.mock('../src/config/env.js', () => ({
  env: {
    GROQ_API_KEY: 'test',
    GROQ_MODEL: 'openai/gpt-oss-120b',
    GROQ_FAST_MODEL: 'openai/gpt-oss-20b',
    GROQ_FALLBACK_MODELS: 'qwen/qwen3.8-27b',
    AI_TIMEOUT_MS: 5000,
  },
}));

const { groqProvider, groqModelChain, resetGroqState } = await import('../src/ai/providers/groq.js');

const schema = z.object({ ok: z.boolean() });
const reply = (content) => ({ choices: [{ message: { content } }] });
const rateLimited = (retryAfterMs = '50') => {
  const err = new Error('Rate limit reached');
  err.status = 429;
  err.headers = { 'retry-after-ms': retryAfterMs };
  return err;
};

describe('groq model fallback', () => {
  beforeEach(() => {
    create.mockReset();
    resetGroqState();
  });

  it('orders the chain by request type without duplicates', () => {
    expect(groqModelChain()).toEqual(['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']);
    expect(groqModelChain({ fast: true })).toEqual(['openai/gpt-oss-20b', 'openai/gpt-oss-120b', 'qwen/qwen3.8-27b']);
  });

  it('moves to the next model on 429 and parks the limited one', async () => {
    create.mockRejectedValueOnce(rateLimited('60000')).mockResolvedValue(reply('{"ok":true}'));
    await expect(groqProvider.generateJSON({ system: 's', prompt: 'p', schema })).resolves.toEqual({ ok: true });
    expect(create.mock.calls.map((c) => c[0].model)).toEqual(['openai/gpt-oss-120b', 'openai/gpt-oss-20b']);

    // 120b is still cooling down, so the next request goes straight to 20b.
    await groqProvider.generateJSON({ system: 's', prompt: 'p', schema });
    expect(create.mock.calls[2][0].model).toBe('openai/gpt-oss-20b');
  });

  it('sends model-specific params', async () => {
    create
      .mockRejectedValueOnce(rateLimited())
      .mockRejectedValueOnce(rateLimited())
      .mockResolvedValue(reply('{"ok":true}'));
    await groqProvider.generateJSON({ system: 's', prompt: 'p', schema });
    const [a, b, c] = create.mock.calls.map((call) => call[0]);
    expect(a.reasoning_effort).toBe('low');
    expect(b.reasoning_effort).toBe('low');
    expect(c.model).toBe('qwen/qwen3.8-27b');
    expect(c.reasoning_format).toBe('hidden');
    expect(c.reasoning_effort).toBeUndefined();
  });

  it('waits for the earliest model when every model is rate-limited', async () => {
    create
      .mockRejectedValueOnce(rateLimited('50'))
      .mockRejectedValueOnce(rateLimited('5000'))
      .mockRejectedValueOnce(rateLimited('5000'))
      .mockResolvedValue(reply('{"ok":true}'));
    await expect(groqProvider.generateJSON({ system: 's', prompt: 'p', schema })).resolves.toEqual({ ok: true });
    expect(create.mock.calls.at(-1)[0].model).toBe('openai/gpt-oss-120b');
  });

  it('skips a model that no longer exists', async () => {
    const gone = Object.assign(new Error('model not found'), { status: 404 });
    create.mockRejectedValueOnce(gone).mockResolvedValue(reply('hello'));
    await expect(groqProvider.generateText({ system: 's', prompt: 'p' })).resolves.toBe('hello');
    expect(create.mock.calls[1][0].model).toBe('openai/gpt-oss-20b');
  });

  it('does not fall through on auth errors', async () => {
    create.mockRejectedValue(Object.assign(new Error('invalid key'), { status: 401 }));
    await expect(groqProvider.generateText({ system: 's', prompt: 'p' })).rejects.toThrow('invalid key');
    expect(create).toHaveBeenCalledTimes(1);
  });
});
