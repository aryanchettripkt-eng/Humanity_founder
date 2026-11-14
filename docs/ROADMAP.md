# Roadmap & Task Board

> This is the **task board** both agents work from. Claim a task before you start it (AGENTS.md §3).
>
> Status markers: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked (say why in PROGRESS.md)
> Format: `- [~] **ID** Task — @owner (branch)` e.g. `- [~] **F3.2** OwnerPill — @gemini (gemini/F3.2-owner-pill)`
> Default owner is **@gemini** for code unless Aryan assigns otherwise. **@claude** picks up only tasks marked for it or explicitly handed over.
> Tasks are ordered; finish a phase's P0 items before starting the next phase's (except where noted as parallel‑safe).

---

## Phase 0 — Repo & foundations
- [~] **P0.1** `git init`, root `.gitignore`, `.editorconfig`, root `package.json` with npm workspaces (`web`, `server`) and scripts `dev` (concurrently), `lint`, `test` — @gemini (gemini/P0.2-server-scaffold; server workspace done, `web` deferred per user)
- [x] **P0.2** Scaffold `server/` (Express, env validation, health route, error middleware, Mongo connect) — @gemini (gemini/P0.2-server-scaffold)
- [ ] **P0.3** Scaffold `web/` (Vite React TS, Tailwind, shadcn init, Inter, router with placeholder pages, providers) — @gemini
- [ ] **P0.4** Design tokens in `globals.css` + `tailwind.config` exactly per DESIGN_SYSTEM §2–4; `lib/owners.ts`, `lib/segments.ts` — @gemini
- [ ] **P0.5** `.env.example` for both apps; README "Run locally" — @gemini

## Phase 1 — Data & AI core (backend)
- [ ] **B1.1** Mongoose models per BACKEND §4 with indexes + toJSON transform — @gemini
- [ ] **B1.2** Auth: signup/login/demo/me, JWT middleware, role guards — @gemini
- [ ] **B1.3** Seed data: `threads.json` (Priya ~32, Daniel ~10) + `scenarios.json` per BACKEND §8 — @claude *(content writing; parallel‑safe, only touches `server/src/seed/data/`)*
- [ ] **B1.4** Seed script (`npm run seed`, `--classify` flag) — @gemini
- [ ] **B1.5** AI provider abstraction + `mock` provider — @gemini
- [ ] **B1.6** `gemini` and `anthropic` providers with JSON validation + retry + timeout — @gemini
- [ ] **B1.7** Classification prompt v1 + zod schema + pipeline (rules, threshold, sticky owners, history) — @claude *(review by @gemini)*
- [ ] **B1.8** Threads API: list (segments, search, filters, pagination), counts, detail, patch, owner, reclassify, suggestion — @gemini
- [ ] **B1.9** Socket.io server with JWT auth, rooms, emit helpers — @gemini
- [ ] **B1.10** Accounts API + simulated sync with `sync:progress` — @gemini
- [ ] **B1.11** Tests: segment filters, owner change + rule creation, classification mapping (mock) — @gemini

## Phase 2 — Assistant experience (frontend core)
- [ ] **F2.1** `lib/api.ts`, `queryKeys.ts`, `socket.ts`, `types/api.ts` (mirror BACKEND) — @gemini
- [ ] **F2.2** Auth pages + demo buttons + route guards — @gemini
- [ ] **F2.3** `AssistantLayout`: sidebar (segments with counts, client switcher, account status), top bar (search, ⌘K trigger), responsive (bottom tabs on mobile) — @gemini
- [ ] **F2.4** Common components: `OwnerPill`, `OwnerPopover`, `ConfidenceMeter`, `EmptyState`, `ErrorState`, skeletons — @gemini
- [ ] **F2.5** Inbox: `ThreadList` + `ThreadRow` + search/filter bar + URL state + keyboard nav — @gemini
- [ ] **F2.6** Thread view: header, messages (collapse), actions toolbar, optimistic mutations + undo toasts — @gemini
- [ ] **F2.7** `AIPanel`: summary, key points, entities, why/confidence/source, history, suggestion banner — @gemini
- [ ] **F2.8** Today page: stat tiles, secondary counts, review strip, upcoming rail, activity feed, recent — @gemini
- [ ] **F2.9** Realtime wiring: socket events → query invalidation/patching, offline banner — @gemini

## Phase 3 — Drafts, client view, onboarding
- [ ] **B3.1** Drafts API + draft prompt + simulated send — @gemini
- [ ] **F3.1** `DraftComposer` (tones, instruction, regenerate, confirm send) — @gemini
- [ ] **B3.2** Client API (`/client/*`) + Activity service + socket emits — @gemini
- [ ] **F3.2** Client view: `ClientLayout`, greeting, `ClientCard` actions + animations, read view, all‑caught‑up — @gemini
- [ ] **F3.3** Onboarding: welcome, connect cards, `SimulatedOAuthModal`, `SyncProgress`, redirect + tour — @gemini
- [ ] **F3.4** Settings → Accounts page — @gemini

## Phase 4 — Standout features (P1)
- [ ] **B4.1** Ask AI endpoint (intent routing + LLM) — @gemini
- [ ] **F4.1** `CommandPalette` + `AskPanel` with thread chips — @gemini
- [ ] **B4.2** Morning brief service + fallback — @gemini
- [ ] **B4.3** Client "reply with a note" → draft (`draft:created`) — @gemini
- [ ] **B4.4** Simulate new email endpoint + scenarios — @gemini
- [ ] **F4.2** Simulate button (demo mode) + new‑row highlight + Reclassified chip — @gemini
- [ ] **B4.5** Few‑shot corrections in prompt (learns from overrides) — @claude
- [ ] **B4.6** Follow‑up nudges (lastSender us, > 3 days) + nudge draft — @gemini
- [ ] **F4.3** Dark mode pass — @gemini

## Phase 5 — Polish, QA, ship
- [ ] **Q5.1** UX review pass against DESIGN_SYSTEM §10 at 375/768/1440, file issues in PROGRESS.md — @claude
- [ ] **Q5.2** Fix list from Q5.1 — @gemini
- [ ] **Q5.3** Acceptance criteria run (PRD §8), all boxes ticked — @claude
- [ ] **Q5.4** Deploy: Atlas, Render, Vercel; seed prod; verify sockets over HTTPS — @gemini (Aryan provides accounts/keys)
- [ ] **Q5.5** README: overview, demo logins, what's simulated, architecture diagram, AI provider notes — @claude
- [ ] **Q5.6** Demo video script (PRD §9) — @claude; recording — Aryan

## Backlog (P2, do not start without Aryan's OK)
- [ ] Keyboard help overlay (`?`)
- [ ] Mobile swipe actions
- [ ] Real Gmail OAuth (read‑only) behind `REAL_GMAIL=true`
- [ ] .ics download for "Add to calendar"
