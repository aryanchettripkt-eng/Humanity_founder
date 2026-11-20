import Groq from 'groq-sdk';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { AIError, runJSONWithRetry, sleep, withTimeout } from '../utils.js';

let client = null;
function getClient() {
  if (!client) {
    client = new Groq({
      apiKey: env.GROQ_API_KEY,
      maxRetries: 0,
      timeout: env.AI_TIMEOUT_MS,
    });
  }
  return client;
}

function getRetryAfterMs(err, fallbackMs) {
  const headers = err?.headers;
  const rawMs = headers?.get ? headers.get('retry-after-ms') : headers?.['retry-after-ms'];
  if (rawMs && !Number.isNaN(Number(rawMs))) {
    return Math.min(30000, Math.max(100, Number(rawMs)));
  }
  const rawSec = headers?.get ? headers.get('retry-after') : headers?.['retry-after'];
  if (rawSec && !Number.isNaN(Number(rawSec))) {
    return Math.min(30000, Math.max(100, Number(rawSec) * 1000));
  }
  return fallbackMs;
}

/**
 * Groq free-tier limits are per model, so a rate-limited model is parked until its
 * retry-after passes and the next model in the chain takes the request.
 * @type {Map<string, number>} model -> epoch ms when it may be tried again
 */
const cooldownUntil = new Map();
const UNAVAILABLE_COOLDOWN_MS = 10 * 60 * 1000;

/** Test hook: forget all cooldowns (and the cached client). */
export function resetGroqState() {
  cooldownUntil.clear();
  client = null;
}

/**
 * Ordered, de-duplicated model chain for a request.
 * @param {{ fast?: boolean, text?: boolean }} opts
 */
export function groqModelChain({ fast = false, text = false } = {}) {
  const fallbacks = String(env.GROQ_FALLBACK_MODELS || '')
    .split(',')
    .map((m) => m.trim());
  const head = text
    ? [env.GROQ_MODEL, env.GROQ_FAST_MODEL]
    : fast
      ? [env.GROQ_FAST_MODEL, env.GROQ_MODEL]
      : [env.GROQ_MODEL, env.GROQ_FAST_MODEL];
  return [...new Set([...head, ...fallbacks].filter(Boolean))];
}

/** Model-specific request options. */
function modelParams(model) {
  if (model.startsWith('openai/gpt-oss-')) return { reasoning_effort: 'low' };
  if (model.startsWith('qwen/')) return { reasoning_format: 'hidden' };
  return {};
}

/**
 * Try each model in the chain; on 429 park that model and move on. If every model
 * is parked, wait for the earliest one to free up (up to 3 rounds).
 * @template T
 * @param {string[]} models
 * @param {(model: string, signal: AbortSignal) => Promise<T>} fn
 * @returns {Promise<T>}
 */
async function callWithFallback(models, fn) {
  let lastErr;
  for (let round = 0; round < 3; round += 1) {
    const now = Date.now();
    const ready = models.filter((m) => (cooldownUntil.get(m) || 0) <= now);
    if (ready.length === 0) {
      const wake = Math.min(...models.map((m) => cooldownUntil.get(m) || now));
      await sleep(Math.min(30000, Math.max(100, wake - now)));
      continue;
    }
    for (const model of ready) {
      try {
        return await withTimeout((signal) => fn(model, signal), env.AI_TIMEOUT_MS, 'Groq');
      } catch (err) {
        const status = err?.status ?? err?.statusCode;
        lastErr = err;
        if (status === 429) {
          cooldownUntil.set(model, Date.now() + getRetryAfterMs(err, 2000));
          logger.warn('Groq model rate-limited; trying next model', { model });
          continue;
        }
        if (status === 404 || status === 400 || (status >= 500 && status < 600)) {
          if (status === 404) cooldownUntil.set(model, Date.now() + UNAVAILABLE_COOLDOWN_MS);
          logger.warn('Groq model failed; trying next model', { model, status });
          continue;
        }
        throw toAIError(err);
      }
    }
    if (lastErr && (lastErr?.status ?? lastErr?.statusCode) !== 429) break;
  }
  throw toAIError(lastErr);
}

function toAIError(err) {
  return err instanceof AIError
    ? err
    : new AIError(err?.message || 'Groq request failed', { code: 'GROQ_ERROR', cause: err });
}

export const groqProvider = {
  name: 'groq',

  async generateJSON({ system, prompt, schema, temperature = 0.2, fast = false }) {
    const models = groqModelChain({ fast });
    return runJSONWithRetry({
      system,
      prompt,
      schema,
      temperature,
      callRaw: async (sys, usr, temp) => {
        const res = await callWithFallback(models, (model, signal) =>
          getClient().chat.completions.create(
            {
              model,
              temperature: temp,
              response_format: { type: 'json_object' },
              ...modelParams(model),
              messages: [
                { role: 'system', content: sys },
                { role: 'user', content: usr },
              ],
            },
            { signal }
          )
        );
        return res.choices?.[0]?.message?.content || '';
      },
    });
  },

  async generateText({ system, prompt, temperature = 0.5 }) {
    const models = groqModelChain({ text: true });
    const res = await callWithFallback(models, (model, signal) =>
      getClient().chat.completions.create(
        {
          model,
          temperature,
          ...modelParams(model),
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: prompt },
          ],
        },
        { signal }
      )
    );
    return (res.choices?.[0]?.message?.content || '').trim();
  },
};
