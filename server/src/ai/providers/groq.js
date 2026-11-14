import Groq from 'groq-sdk';
import { env } from '../../config/env.js';
import { AIError, runJSONWithRetry, sleep, withTimeout } from '../utils.js';

let client = null;
function getClient() {
  if (!client) {
    client = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return client;
}

async function callWithBackoff(fn) {
  let delay = 500;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await withTimeout(fn(), env.AI_TIMEOUT_MS, 'Groq');
    } catch (err) {
      const status = err?.status ?? err?.statusCode;
      if (status === 429 && attempt < 2) {
        await sleep(delay);
        delay *= 2;
        continue;
      }
      throw err instanceof AIError
        ? err
        : new AIError(err?.message || 'Groq request failed', { code: 'GROQ_ERROR', cause: err });
    }
  }
}

export const groqProvider = {
  name: 'groq',

  async generateJSON({ system, prompt, schema, temperature = 0.2, fast = false }) {
    const model = fast && env.GROQ_FAST_MODEL ? env.GROQ_FAST_MODEL : env.GROQ_MODEL;
    return runJSONWithRetry({
      system,
      prompt,
      schema,
      temperature,
      callRaw: async (sys, usr, temp) => {
        const res = await callWithBackoff(() =>
          getClient().chat.completions.create({
            model,
            temperature: temp,
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: sys },
              { role: 'user', content: usr },
            ],
          })
        );
        return res.choices?.[0]?.message?.content || '';
      },
    });
  },

  async generateText({ system, prompt, temperature = 0.5 }) {
    const res = await callWithBackoff(() =>
      getClient().chat.completions.create({
        model: env.GROQ_MODEL,
        temperature,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: prompt },
        ],
      })
    );
    return (res.choices?.[0]?.message?.content || '').trim();
  },
};
