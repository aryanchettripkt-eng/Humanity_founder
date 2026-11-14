# Progress Log

> Newest entry at the top. Every agent adds an entry at the end of every work session (format in AGENTS.md §6). Don't edit other agents' entries; reply by adding your own.

## Questions for Aryan
- [ ] Product name — "Relay" is a placeholder. Keep or rename?
- [x] AI provider for the deployed demo → **Groq** (D9). Gemini/Anthropic/mock still supported.
- [ ] Should agents commit directly to `main` for ROADMAP/PROGRESS updates, or always via branches?

## Open issues
_None yet._

## Handoffs needed
_None yet._

---

### 2026-11-14 23:46 · gemini · B1.4 Seed script + B1.11 Backend tests
- Done:
  - `server/src/seed/seed.js`: seeds demo users (`alex`, `priya`, `daniel`), clients, email accounts, and loads `seed/data/threads.json` if present (falls back to 5 starter threads across all 4 owners until `@claude` completes `B1.3`). Supports `--classify` flag and exports `seedDatabase()` for `/demo/reset`.
  - `server/tests/`: `segments.test.js`, `ai.test.js`, `classification.test.js`, `health.test.js` — 4 files, 17 tests passing.
- Changed contracts: none.
- Next: Phase 3 & 4 backend tasks (`B3.1` Drafts API, `B3.2` Client API + Dashboard, `B4.1` Ask AI, `B4.2` Morning brief, `B4.3` Client note -> draft, `B4.4` Simulate email).

### 2026-11-14 23:45 · gemini · B1.10 Accounts API + simulated sync
- Done: `server/src/services/sync.service.js`, `server/src/controllers/accounts.controller.js`, `server/src/routes/accounts.routes.js` (`/accounts`, `/accounts/connect`, `/accounts/:id/authorize`, `/accounts/:id/sync`, `DELETE /accounts/:id`).
- Changed contracts: none.
- Next: `B1.4` seed script (`npm run seed`, `--classify` flag) and `B1.11` tests.

### 2026-11-14 23:45 · gemini · B1.8 Threads API
- Done:
  - `server/src/services/segments.js` (`segmentFilter` + `computeSegmentCounts` for all 12 segments).
  - `server/src/services/classification.service.js` (`classifyThread` pipeline with Rule matching, threshold → `review`, sticky manual/client owners, history, activity & socket emits, safe fallback).
  - `server/src/controllers/threads.controller.js` + `threads.routes.js`: list, counts, detail, patch, owner + Rule upsert, reclassify, suggestion apply/dismiss.
- Changed contracts: none.
- Next: `B1.10` Accounts API + simulated sync (`sync:progress`), then `B1.4` seed script and `B1.11` tests.
- Notes/risks: `@claude` can refine `classification.service.js` prompt/few-shot in `B1.7` / `B4.5`.

### 2026-11-14 23:44 · gemini · B1.9 Socket.io server + Activity service
- Done: `server/src/realtime/socket.js` (JWT handshake auth, `user:{id}` & `client:{id}` rooms, emit helpers for thread/counts/activity/sync/draft), `server/src/services/activity.service.js`, wired `initSocket` in `server/src/index.js`.
- Changed contracts: none.
- Next: `B1.8` Threads API (plus `segments.js` and classification hook) and `B1.10` Accounts & simulated sync.

### 2026-11-14 23:43 · gemini · B1.5 & B1.6 AI providers
- Done:
  - `server/src/ai/schemas.js` (`classificationSchema`, `askSchema`), `server/src/ai/utils.js` (`AIError`, `withTimeout`, `runJSONWithRetry` with 1 JSON/schema retry).
  - `mock`, `groq` (with 429 exponential backoff + `GROQ_FAST_MODEL` support), `gemini`, and `anthropic` providers + `getProvider()`.
- Changed contracts: none.
- Next: `B1.9` Socket.io server, `B1.8` Threads API (plus classification service stub/hook so reclassify works cleanly while `B1.7` is `@claude`), `B1.10` Accounts & sync, `B1.4` Seed script, `B1.11` Tests.
- Notes/risks: `B1.7` (classification prompt v1 + pipeline) is assigned to `@claude`; will build a clean `classifyThread()` service interface that `B1.8`/`B1.10` can call and `@claude` can refine or own in `B1.7`.

### 2026-11-14 23:42 · gemini · B1.1 Mongoose models + B1.2 Auth
- Done:
  - B1.1: All 8 Mongoose models (`User`, `Client`, `EmailAccount`, `Thread`, `Message`, `Draft`, `Rule`, `Activity`) with `applyBaseTransform` (`id` string, strips `_id`/`__v`/`passwordHash`) and indexes per BACKEND §4.
  - B1.2: `/api/auth/signup`, `/api/auth/login`, `/api/auth/demo`, `/api/auth/me`, JWT helpers, `requireAuth`, `requireRole`, `requireClientScope` middleware.
- Changed contracts: none.
- Next: `B1.5` & `B1.6` AI provider abstraction + `mock`, `groq`, `gemini`, `anthropic` providers.
- Notes/risks: `npm run lint` and `npm test` (health) pass; full DB-backed auth integration tests will be added in `B1.11`.

### 2026-11-14 23:40 · gemini · P0.2 server scaffold (+ P0.1 root/server workspace)
- Done: root `.gitignore`, `.editorconfig`, root `package.json` (with `server` workspace), `server/` Express app (`helmet`, `cors`, `morgan`, zod env validation, `/health` & `/api/health`, centralized error/validation middleware, Mongo connect/disconnect, ESLint + Vitest + Supertest).
- Changed contracts: none.
- Next: Phase 1 backend (`B1.1` Mongoose models, `B1.2` Auth, `B1.5/B1.6` AI providers, `B1.8`–`B1.11`).
- Notes/risks: `web` workspace omitted from root `package.json` for now because user requested backend-only work; will add `"web"` in `P0.3`.

### 2026-11-14 18:05 · claude · AI provider → Groq
- Done: BACKEND §1/§2/§5.1 now default to Groq (`groq-sdk`, JSON mode, 429 backoff), DECISIONS D9.
- Changed contracts: env vars `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_FAST_MODEL`; `/health` may return `groq`.
- Next: unchanged.

### 2026-11-14 · claude · Project docs
- Done: created AGENTS.md, GEMINI.md, CLAUDE.md, README.md and docs/ (PRD, DESIGN_SYSTEM, FRONTEND, BACKEND, ROADMAP, PROGRESS, DECISIONS). No app code yet.
- Changed contracts: initial versions of all specs.
- Next: Gemini starts Phase 0 (P0.1–P0.5). Claude can start B1.3 (seed content) in parallel once P0.2 exists.
- Notes: folder was empty before this; not yet a git repo (P0.1 runs `git init`).
