# Relay — AI inbox copilot for personal assistants

Prototype for the *AI Full‑Stack Engineer Intern* assignment. Personal assistants connect their clients' inboxes; AI decides **who needs to reply** (assistant, client, nobody, or needs review), summarises threads, extracts dates and drafts replies. Clients get a minimal view of only what needs them, synced live with the assistant.

> Status: planning. No app code yet. See `docs/ROADMAP.md`.

## Docs
| File | What |
|---|---|
| [AGENTS.md](./AGENTS.md) | Rules for AI coding agents (Gemini, Claude): ownership, git, progress logging |
| [docs/PRD.md](./docs/PRD.md) | Product requirements, features, flows, acceptance criteria |
| [docs/DESIGN_SYSTEM.md](./docs/DESIGN_SYSTEM.md) | Tokens, components, states, responsive rules |
| [docs/FRONTEND.md](./docs/FRONTEND.md) | Web app structure, routes, state, conventions |
| [docs/BACKEND.md](./docs/BACKEND.md) | API contract, data model, AI pipeline, mock integrations |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | Phased task board |
| [docs/PROGRESS.md](./docs/PROGRESS.md) | Session log, open questions, handoffs |
| [docs/DECISIONS.md](./docs/DECISIONS.md) | Decision log |
| [docs/GOOGLE_SETUP.md](./docs/GOOGLE_SETUP.md) | Google Cloud setup for real Gmail + Sign in with Google |

## Run locally
_To be written in P0.5._

## What's real vs simulated
**Real:** accounts and login (passwords hashed, JWT), MongoDB storage, the AI (who replies + confidence + reason, summaries, dates, drafts, ask-your-inbox, morning brief) via Groq, owner overrides and sender rules, re-classification on new messages, live assistant ↔ client sync, search and filters. Planned (Phase 6): Sign in with Google and **real read-only Gmail** for approved test accounts.

**Simulated:** the Gmail/Outlook connection screen in the default demo path, the sample mailbox, new mail arriving (the "Simulate new email" button), sending replies (saved, never sent, also for real Gmail), add-to-calendar, and Outlook. Without an AI key, a keyword-based stand-in replaces the LLM so the demo keeps working.

Full table: [PRD §11](./docs/PRD.md#11-whats-real-vs-simulated-keep-in-sync-with-readme).
