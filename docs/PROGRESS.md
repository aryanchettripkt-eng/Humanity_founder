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

### 2026-11-14 18:05 · claude · AI provider → Groq
- Done: BACKEND §1/§2/§5.1 now default to Groq (`groq-sdk`, JSON mode, 429 backoff), DECISIONS D9.
- Changed contracts: env vars `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_FAST_MODEL`; `/health` may return `groq`.
- Next: unchanged.

### 2026-11-14 · claude · Project docs
- Done: created AGENTS.md, GEMINI.md, CLAUDE.md, README.md and docs/ (PRD, DESIGN_SYSTEM, FRONTEND, BACKEND, ROADMAP, PROGRESS, DECISIONS). No app code yet.
- Changed contracts: initial versions of all specs.
- Next: Gemini starts Phase 0 (P0.1–P0.5). Claude can start B1.3 (seed content) in parallel once P0.2 exists.
- Notes: folder was empty before this; not yet a git repo (P0.1 runs `git init`).
