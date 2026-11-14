import { GoogleGenAI } from '@google/genai';
import { env } from '../../config/env.js';
import { AIError, runJSONWithRetry, withTimeout } from '../utils.js';

let client = null;
function getClient() {
  if (!client) {
    client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return client;
}

export const geminiProvider = {
  name: 'gemini',

  async generateJSON({ system, prompt, schema, temperature = 0.2 }) {
    return runJSONWithRetry({
      system,
      prompt,
      schema,
      temperature,
      callRaw: async (sys, usr, temp) => {
        try {
          const res = await withTimeout(
            getClient().models.generateContent({
              model: env.GEMINI_MODEL,
              contents: usr,
              config: {
                systemInstruction: sys,
                temperature: temp,
                responseMimeType: 'application/json',
              },
            }),
            env.AI_TIMEOUT_MS,
            'Gemini'
          );
          return res.text || '';
        } catch (err) {
          throw err instanceof AIError
            ? err
            : new AIError(err?.message || 'Gemini request failed', {
                code: 'GEMINI_ERROR',
                cause: err,
              });
        }
      },
    });
  },

  async generateText({ system, prompt, temperature = 0.5 }) {
    try {
      const res = await withTimeout(
        getClient().models.generateContent({
          model: env.GEMINI_MODEL,
          contents: prompt,
          config: {
            systemInstruction: system,
            temperature,
          },
        }),
        env.AI_TIMEOUT_MS,
        'Gemini'
      );
      return (res.text || '').trim();
    } catch (err) {
      throw err instanceof AIError
        ? err
        : new AIError(err?.message || 'Gemini request failed', {
            code: 'GEMINI_ERROR',
            cause: err,
          });
    }
  },
};
