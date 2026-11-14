import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/relay'),
  JWT_SECRET: z.string().min(8).default('dev-secret-change-me-in-production-32chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  DEMO_MODE: z
    .string()
    .optional()
    .transform((v) => v !== 'false')
    .default('true'),
  AI_PROVIDER: z.enum(['groq', 'gemini', 'anthropic', 'mock']).default('groq'),
  AI_CONFIDENCE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(15000),
  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),
  GROQ_FAST_MODEL: z.string().default('openai/gpt-oss-20b'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-2.5-flash'),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  ANTHROPIC_MODEL: z.string().default('claude-sonnet-4-20250514'),
});

/**
 * Parse and validate environment variables.
 * Falls back to `mock` AI provider if the configured live provider lacks an API key.
 */
export function loadEnv(raw = process.env) {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  const data = parsed.data;
  const effectiveAiProvider = resolveEffectiveProvider(data);
  return { ...data, effectiveAiProvider };
}

function resolveEffectiveProvider(data) {
  if (data.AI_PROVIDER === 'groq' && !data.GROQ_API_KEY) return 'mock';
  if (data.AI_PROVIDER === 'gemini' && !data.GEMINI_API_KEY) return 'mock';
  if (data.AI_PROVIDER === 'anthropic' && !data.ANTHROPIC_API_KEY) return 'mock';
  return data.AI_PROVIDER;
}

export const env = loadEnv();

