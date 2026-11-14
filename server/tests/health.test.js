import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app } from '../src/app.js';
import { loadEnv } from '../src/config/env.js';

describe('Health endpoint', () => {
  it('GET /api/health returns ok and active ai provider', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: {
        ok: true,
        ai: expect.stringMatching(/^(groq|gemini|anthropic|mock)$/),
        gmail: expect.any(Boolean),
        googleLogin: expect.any(Boolean),
      },
    });
  });

  it('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.data.ok).toBe(true);
  });

  it('returns 404 JSON envelope for unknown route', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('refuses to boot in production with default JWT_SECRET', () => {
    expect(() =>
      loadEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'dev-secret-change-me-in-production-32chars',
      })
    ).toThrow(/JWT_SECRET/);
  });
});

