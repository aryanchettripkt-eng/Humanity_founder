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

## Run locally
_To be written in P0.5._

## What's simulated
_To be completed in Q5.5_ — Gmail/Outlook OAuth and sync, sending email, calendar add. AI runs live when a key is set, otherwise a deterministic mock.
