import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env.js';
import { AIError, runJSONWithRetry, withTimeout } from '../utils.js';

let client = null;
function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return client;
}

export const anthropicProvider = {
  name: 'anthropic',

  async generateJSON({ system, prompt, schema, temperature = 0.2 }) {
    return runJSONWithRetry({
      system,
      prompt,
      schema,
      temperature,
      callRaw: async (sys, usr, temp) => {
        try {
          const res = await withTimeout(
            getClient().messages.create({
              model: env.ANTHROPIC_MODEL,
              max_tokens: 1024,
              temperature: temp,
              system: sys,
              messages: [{ role: 'user', content: usr }],
            }),
            env.AI_TIMEOUT_MS,
            'Anthropic'
          );
          const block = res.content?.find((b) => b.type === 'text');
          return block?.text || '';
        } catch (err) {
          throw err instanceof AIError
            ? err
            : new AIError(err?.message || 'Anthropic request failed', {
                code: 'ANTHROPIC_ERROR',
                cause: err,
              });
        }
      },
    });
  },

  async generateText({ system, prompt, temperature = 0.5 }) {
    try {
      const res = await withTimeout(
        getClient().messages.create({
          model: env.ANTHROPIC_MODEL,
          max_tokens: 1024,
          temperature,
          system,
          messages: [{ role: 'user', content: prompt }],
        }),
        env.AI_TIMEOUT_MS,
        'Anthropic'
      );
      const block = res.content?.find((b) => b.type === 'text');
      return (block?.text || '').trim();
    } catch (err) {
      throw err instanceof AIError
        ? err
        : new AIError(err?.message || 'Anthropic request failed', {
            code: 'ANTHROPIC_ERROR',
            cause: err,
          });
    }
  },
};
