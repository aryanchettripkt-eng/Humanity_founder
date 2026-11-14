import { logger } from '../utils/logger.js';

export class AIError extends Error {
  /**
   * @param {string} message
   * @param {{ code?: string, cause?: unknown }} [opts]
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = 'AIError';
    this.code = opts.code || 'AI_ERROR';
    this.cause = opts.cause;
  }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Race a promise (or abortable factory) against a timeout.
 * @template T
 * @param {Promise<T> | ((signal: AbortSignal) => Promise<T>)} promiseOrFn
 * @param {number} ms
 * @param {string} [label]
 * @returns {Promise<T>}
 */
export async function withTimeout(promiseOrFn, ms, label = 'AI request') {
  let timer;
  const controller = typeof promiseOrFn === 'function' ? new AbortController() : null;
  const target = controller ? promiseOrFn(controller.signal) : promiseOrFn;
  try {
    return await Promise.race([
      target,
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller?.abort();
          reject(new AIError(`${label} timed out after ${ms}ms`, { code: 'AI_TIMEOUT' }));
        }, ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Extract JSON from a model response (handles optional markdown code fences).
 * @param {string} raw
 */
export function parseJSONResponse(raw) {
  const trimmed = String(raw || '').trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  return JSON.parse(candidate);
}

/**
 * Call a raw JSON-producing function and validate with Zod, retrying once on invalid JSON/schema.
 * @param {{
 *   callRaw: (system: string, prompt: string, temperature: number) => Promise<string>,
 *   system: string,
 *   prompt: string,
 *   schema: import('zod').ZodTypeAny,
 *   temperature?: number,
 * }} opts
 */
export async function runJSONWithRetry({ callRaw, system, prompt, schema, temperature = 0.2 }) {
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const currentPrompt =
      attempt === 0 ? prompt : `${prompt}\n\nReturn only valid JSON matching the schema.`;
    try {
      const raw = await callRaw(system, currentPrompt, temperature);
      const parsed = parseJSONResponse(raw);
      const validated = schema.safeParse(parsed);
      if (validated.success) {
        return validated.data;
      }
      logger.warn('AI JSON schema validation failed', {
        attempt: attempt + 1,
        issues: validated.error.issues.map((i) => ({
          path: i.path.join('.'),
          code: i.code,
        })),
      });
      lastErr = new AIError('AI JSON failed schema validation', {
        code: 'AI_SCHEMA_ERROR',
        cause: validated.error.issues,
      });
    } catch (err) {
      lastErr =
        err instanceof AIError
          ? err
          : new AIError(err?.message || 'Invalid JSON from AI provider', {
              code: 'AI_PARSE_ERROR',
              cause: err,
            });
    }
  }
  throw lastErr;
}

