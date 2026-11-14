import { env } from '../config/env.js';
import { anthropicProvider } from './providers/anthropic.js';
import { geminiProvider } from './providers/gemini.js';
import { groqProvider } from './providers/groq.js';
import { mockProvider } from './providers/mock.js';

export { AIError } from './utils.js';

const PROVIDERS = {
  groq: groqProvider,
  gemini: geminiProvider,
  anthropic: anthropicProvider,
  mock: mockProvider,
};

/**
 * Return the active AI provider (falls back to `mock` if key is missing).
 * @param {'groq'|'gemini'|'anthropic'|'mock'} [override]
 */
export function getProvider(override) {
  const key = override || env.effectiveAiProvider;
  return PROVIDERS[key] || mockProvider;
}

