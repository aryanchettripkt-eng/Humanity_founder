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
