# Progress Log

> Newest entry at the top. Every agent adds an entry at the end of every work session (format in AGENTS.md §6). Don't edit other agents' entries; reply by adding your own.

## Questions for Aryan
- [ ] Product name — "Relay" is a placeholder. Keep or rename?
- [x] AI provider for the deployed demo → **Groq** (D9). Gemini/Anthropic/mock still supported.
- [ ] Should agents commit directly to `main` for ROADMAP/PROGRESS updates, or always via branches?
- [ ] Real Gmail (Phase 6): which Google account owns the Cloud project, and which Gmail goes in the demo video? (G6.1)

## Open issues
- [ ] Sync events reach an assistant twice (in both `assistants:` and `user:` rooms). Harmless if FE handlers are idempotent (FRONTEND §6). Optional server fix: emit with `io.to(a).to(b)` so Socket.io dedupes. — owner: @gemini
- [ ] Client socket isn't told when AI moves a thread *away* from `client` without a handoff. FE mitigation: `/c` refetches on focus + every 60s (FRONTEND §6). — owner: @gemini
- [ ] Backend not yet run against a real MongoDB by Claude (sandbox can't download mongod); first full run is Aryan's local start. — owner: Aryan

## Handoffs needed
_None yet._

---

### 2026-11-15 02:00 · gemini · Fix all Phase 6 review findings (`c56b099` review)
- Done:
  - Must-fix #1: replaced `sparse: true` with `partialFilterExpression: { externalId: { $exists: true } }` on `Thread` (`{accountId, externalId}`) and `Message` (`{threadId, externalId}`) so seeded/simulated threads & messages don't collide on `null`.
  - Should-fix #2–#5: `pollGmailAccount` now resets `status: 'connected'` + emits `sync:done` on generic errors; Google login requires `verified_email === true` before matching by email; `login` returns `401 INVALID_CREDENTIALS` when `passwordHash` is missing; `OnboardingPage` polls `GET /accounts` while on `step === 'sync'`.
  - Minor: improved default client naming, added `nextPageToken` loop in `history.list`, added `trimQuotedReplies` for AI prompts, added `returnTo: 'settings'` so connecting from Settings returns to `/app/settings/accounts` without re-triggering the tour, and added dedupe + quote-trimming unit tests in `server/tests/gmail.test.js`.
- Changed contracts: none.
- Next: merge `gemini/G6-real-gmail` -> `main` (and drop any old `accountId_1_externalId_1` / `threadId_1_externalId_1` indexes if built on Atlas).

### 2026-11-15 01:48 · gemini · Phase 6 (G6.2–G6.7): Real Gmail + Sign in with Google
- Done:
  - Backend (`server/`): added `googleapis`, Google/Gmail env flags (`REAL_GMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `WEB_URL`, `TOKEN_ENC_KEY`, `GMAIL_IMPORT_LIMIT`, `GMAIL_POLL_SECONDS`) and `/health` flags (`gmail`, `googleLogin`).
  - Models: `User.googleId` (optional `passwordHash`), `EmailAccount.google` (`refreshTokenEnc` stripped in `toJSON`), `Thread.source` + `externalId`, `Message.externalId` with sparse unique dedupe indexes.
  - Services (`server/src/services/gmail/`): AES-256-GCM token encryption & 10m signed JWT OAuth state (`crypto.js`), Google OAuth2 client (`oauth.js`), MIME/HTML/address mapper (`mapper.js`), idempotent initial importer with concurrency-2 classification & `sync:progress` (`import.js`), `history.list` poller + 404/invalid_grant handling (`poller.js`).
  - Routes (`google.controller.js`, `accounts.controller.js`): `GET /api/auth/google/start`, `POST /api/accounts/gmail/start`, `GET /api/oauth/google/callback`, real Gmail `sync` & `disconnect` (revokes token + optional `?removeMail=true`).
  - Frontend (`web/`): `GoogleButton`, `SourceBadge`, `/auth/callback` (`AuthCallbackPage`), dual actions + `not_test_user` error state on `ConnectProviderCard`/`OnboardingPage`/`SettingsAccountsPage`, and `"Changes here stay in Relay"` + `"Open in Gmail"` footer in `InboxPage`.
  - Tests: `server/tests/gmail.test.js` (mapper multipart/html/outbound + AES-256-GCM + OAuth state verification).
- Changed contracts: none beyond BACKEND §3/§4/§11.
- Next: Aryan (`G6.1` Google Cloud OAuth credentials) + `@claude` (`G6.8` review).

### 2026-11-15 01:32 · gemini · QA & live-site fixes (Groq models, mobile UX, shortcuts, code splitting)
- Done:
  - Fixed Groq model defaults in `server/src/config/env.js` and `.env.example` (`openai/gpt-oss-120b` / `openai/gpt-oss-20b` — `llama-3.3-70b-versatile` returned `model_not_found` on this Groq account).
  - Fixed singular/plural in `brief.service.js` (`1 thread needs you`), sanitized `reason`/`history` in `client.controller.js` REST responses, and deduped `sync:progress`/`sync:done` via `io.to(...).to(...)` in `socket.js`.
  - Frontend: added collapsible `MobileAISummary` above thread messages (`< xl`), fixed mobile client card button wrapping + 60s queue refetch, fixed `"Draft with AI"` button wrapping, updated Onboarding Outlook copy + `"Simulated"` badge, hid `"seed"` model pill, added `o` owner-cycle shortcut, added post-onboarding `GuidedTour` (`?tour=1`), and added route-level `React.lazy` code splitting in `router.tsx`.
- Changed contracts: none.
- Next: merge `gemini/q5-qa-fixes` -> `main`, remove/update `GROQ_MODEL` & `GROQ_FAST_MODEL` on Render, then `@claude` `B1.3` full seed data + `B4.5` few-shot + `Q5.1`/`Q5.3`.

### 2026-11-15 00:40 · claude · Docs: real Gmail plan, real-vs-simulated, review follow-ups
- Done: BACKEND §3 (Google routes, `nudges` on `/dashboard`), §4 (Google/account/source fields), §6, §7 (new socket rooms), §9, new §11 (real Gmail + Google sign-in). PRD §6.1, S10 → P1, F1b, new §11 real-vs-simulated table. FRONTEND routes/conventions, DESIGN_SYSTEM components + copy, ROADMAP Phase 6, DECISIONS D10–D12, README "What's real vs simulated", new `docs/GOOGLE_SETUP.md`.
- Re-reviewed Gemini's fix commit `e6fae15`: all 8 findings fixed; lint clean; 18/18 tests pass. Two minor leftovers logged under Open issues.
- Changed contracts: additive only (new routes/fields behind `REAL_GMAIL`; documented existing `nudges` and socket rooms).
- Next: Phase 6 waits until the core frontend (Phase 2–3) is solid. Claude: B1.3 seed data, B4.5 few-shot.

### 2026-11-15 00:38 · gemini · Complete Frontend (`web/`) + P0.1/P0.3–P0.5, F2.1–F4.3
- Done:
  - Root `package.json` updated with `web` workspace and `concurrently` `dev` script; `README.md` Run locally guide.
  - `web/`: Vite + React 18 + TypeScript (strict), Tailwind + design tokens (`globals.css`, `tailwind.config.ts`), `OWNER_META`, `SEGMENTS`, `api.ts`, `socket.ts`, `queryKeys.ts`, Zustand UI/command stores.
  - Auth (`/login`, `/signup`, demo buttons, `RequireAuth`), Onboarding (`/onboarding` + `SimulatedOAuthModal` + `SyncProgress`), Settings → Accounts (`/app/settings/accounts`).
  - Assistant workspace (`AssistantLayout`, `TodayPage`, `InboxPage` 3-pane with `ThreadList`, `ThreadRow`, `ThreadHeader`, `MessageItem`, `AIPanel`, `DraftComposer`, `j/k/s/u/e/d/r` shortcuts, `CommandPalette` + `AskPanel`, Simulate email, Dark mode).
  - Client view (`/c`, `/c/thread/:id` with Framer Motion cards, handling/handled/handoff/note actions, live socket sync).
- Changed contracts: none.
- Next: `@claude` QA/UX review (`Q5.1`, `Q5.3`), full seed data (`B1.3`), and production deploy (`Q5.4`).
- Notes/risks: `npm run lint`, `npm run typecheck`, `npm test` (18 server + 2 web), and `vite build` all pass.

### 2026-11-14 23:55 · gemini · Fix all issues from Claude's backend review
- Done:
  - Onboarding sync (`sync.service.js`): loads seed threads and runs `classifyThread` when a new client has 0 threads.
  - Socket rooms (`realtime/socket.js` + `accounts.controller.js`): separated `assistants:{clientId}` from `client:{clientId}` (client receives sanitized payloads only); `sync:progress` & `sync:done` also emit to `user:{assistantId}`; newly created `Client` joins active assistant sockets to `assistants:{clientId}`.
  - `/demo/reset` (`seed.js`): upserts demo users/clients by email (preserving IDs and active JWTs) and never deletes non-demo users.
  - Classification (`classification.service.js`): `aiStatus === 'pending'` is treated as initial classification (no false `reclassifiedAt`/history); invalid `endsAt` dates are omitted instead of throwing `CastError`; removed dead `isImportant` assignment.
  - Search (`threads.controller.js`): `q` now also searches `Message.bodyText`.
  - Client note → draft (`client.controller.js`): wrapped draft generation in `try/catch` so handoff still succeeds if drafting fails.
  - Updated default `ANTHROPIC_MODEL` to `claude-sonnet-4-20250514`.
- Changed contracts: none.
- Next: pushed to `origin/gemini/backend`; ready for `@claude` (`B1.3`, `B1.7` review + `B4.5`) or frontend (`P0.3`+).

### 2026-11-14 23:49 · gemini · B4.1, B4.2, B4.4, B4.6 Phase 4 backend endpoints
- Done:
  - `B4.1`: `server/src/services/ask.service.js` + `ai.controller.js` + `ai.routes.js` (`POST /api/ai/ask` with intent routing, thread citation filtering, and 30/min rate limit).
  - `B4.2`: `server/src/services/brief.service.js` + `POST /api/ai/brief/refresh` + wired into `GET /api/dashboard`.
  - `B4.4`: `server/src/controllers/demo.controller.js` + `demo.routes.js` (`POST /api/demo/simulate-email` with fallback scenarios & reclassification, `POST /api/demo/reset`).
  - `B4.6`: Follow-up nudges (`lastSender: 'us'`, `> 3 days`) included in `GET /api/dashboard` (`nudges`).
- Changed contracts: `GET /api/dashboard` now also includes `nudges: ThreadListItem[]` (additive).
- Next: `@claude` can pick up `B1.3` (seed data), `B1.7` (prompt/pipeline polish), `B4.5` (few-shot overrides). Frontend (`P0.3`+) awaits user go-ahead.

### 2026-11-14 23:48 · gemini · B3.1 Drafts API + B3.2 Client/Dashboard/Activity API (+ B4.3)
- Done:
  - `B3.1`: `server/src/services/draft.service.js`, `drafts.controller.js`, `drafts.routes.js` (`POST /threads/:id/drafts`, `PATCH /drafts/:id`, `POST /drafts/:id/send` simulated send, `DELETE /drafts/:id`).
  - `B3.2` + `B4.3`: `client.controller.js`, `client.routes.js` (`/client/queue`, `/client/threads/:id`, `/client/threads/:id/action` including `note` -> AI draft + `draft:created` socket), `dashboard.controller.js`, `dashboard.routes.js`, `activity.routes.js`.
- Changed contracts: none.
- Next: Phase 4 backend (`B4.1` Ask AI, `B4.2` Morning brief service, `B4.4` Simulate new email + `/demo/reset`, `B4.6` Follow-up nudges).

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
