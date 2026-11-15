# Roadmap & Task Board

> This is the **task board** both agents work from. Claim a task before you start it (AGENTS.md §3).
>
> Status markers: `[ ]` todo · `[~]` in progress · `[x]` done · `[!]` blocked (say why in PROGRESS.md)
> Format: `- [~] **ID** Task — @owner (branch)` e.g. `- [~] **F3.2** OwnerPill — @gemini (gemini/F3.2-owner-pill)`
> Default owner is **@gemini** for code unless Aryan assigns otherwise. **@claude** picks up only tasks marked for it or explicitly handed over.
> Tasks are ordered; finish a phase's P0 items before starting the next phase's (except where noted as parallel‑safe).

---

## Phase 0 — Repo & foundations
- [x] **P0.1** `git init`, root `.gitignore`, `.editorconfig`, root `package.json` with npm workspaces (`web`, `server`) and scripts `dev` (concurrently), `lint`, `test` — @gemini (gemini/frontend)
- [x] **P0.2** Scaffold `server/` (Express, env validation, health route, error middleware, Mongo connect) — @gemini (gemini/P0.2-server-scaffold)
- [x] **P0.3** Scaffold `web/` (Vite React TS, Tailwind, shadcn init, Inter, router with placeholder pages, providers) — @gemini (gemini/frontend)
- [x] **P0.4** Design tokens in `globals.css` + `tailwind.config` exactly per DESIGN_SYSTEM §2–4; `lib/owners.ts`, `lib/segments.ts` — @gemini (gemini/frontend)
- [x] **P0.5** `.env.example` for both apps; README "Run locally" — @gemini (gemini/frontend)

## Phase 1 — Data & AI core (backend)
- [x] **B1.1** Mongoose models per BACKEND §4 with indexes + toJSON transform — @gemini (gemini/B1.1-models-auth)
- [x] **B1.2** Auth: signup/login/demo/me, JWT middleware, role guards — @gemini (gemini/B1.1-models-auth)
- [x] **B1.3** Seed data: `threads.json` (Priya ~32, Daniel ~10) + `scenarios.json` per BACKEND §8 — @claude *(content writing; parallel‑safe, only touches `server/src/seed/data/`)*
- [x] **B1.4** Seed script (`npm run seed`, `--classify` flag) — @gemini (gemini/B1.4-B1.11-seed-tests)
- [x] **B1.5** AI provider abstraction + `mock` provider — @gemini (gemini/B1.5-ai-providers)
- [x] **B1.6** `gemini` and `anthropic` providers with JSON validation + retry + timeout — @gemini (gemini/B1.5-ai-providers; includes `groq` per D9)
- [x] **B1.7** Classification prompt v1 + zod schema + pipeline (rules, threshold, sticky owners, history) — @claude *(review by @gemini)*
- [x] **B1.8** Threads API: list (segments, search, filters, pagination), counts, detail, patch, owner, reclassify, suggestion — @gemini (gemini/B1.8-threads-api)
- [x] **B1.9** Socket.io server with JWT auth, rooms, emit helpers — @gemini (gemini/B1.9-socket-activity)
- [x] **B1.10** Accounts API + simulated sync with `sync:progress` — @gemini (gemini/B1.10-accounts-sync)
- [x] **B1.11** Tests: segment filters, owner change + rule creation, classification mapping (mock) — @gemini (gemini/B1.4-B1.11-seed-tests)

## Phase 2 — Assistant experience (frontend core)
- [x] **F2.1** `lib/api.ts`, `queryKeys.ts`, `socket.ts`, `types/api.ts` (mirror BACKEND) — @gemini (gemini/frontend)
- [x] **F2.2** Auth pages + demo buttons + route guards — @gemini (gemini/frontend)
- [x] **F2.3** `AssistantLayout`: sidebar (segments with counts, client switcher, account status), top bar (search, ⌘K trigger), responsive (bottom tabs on mobile) — @gemini (gemini/frontend)
- [x] **F2.4** Common components: `OwnerPill`, `OwnerPopover`, `ConfidenceMeter`, `EmptyState`, `ErrorState`, skeletons — @gemini (gemini/frontend)
- [x] **F2.5** Inbox: `ThreadList` + `ThreadRow` + search/filter bar + URL state + keyboard nav — @gemini (gemini/frontend)
- [x] **F2.6** Thread view: header, messages (collapse), actions toolbar, optimistic mutations + undo toasts — @gemini (gemini/frontend)
- [x] **F2.7** `AIPanel`: summary, key points, entities, why/confidence/source, history, suggestion banner — @gemini (gemini/frontend)
- [x] **F2.8** Today page: stat tiles, secondary counts, review strip, upcoming rail, activity feed, recent — @gemini (gemini/frontend)
- [x] **F2.9** Realtime wiring: socket events → query invalidation/patching, offline banner — @gemini (gemini/frontend)

## Phase 3 — Drafts, client view, onboarding
- [x] **B3.1** Drafts API + draft prompt + simulated send — @gemini (gemini/B3.1-B3.2-drafts-client-api)
- [x] **F3.1** `DraftComposer` (tones, instruction, regenerate, confirm send) — @gemini (gemini/frontend)
- [x] **B3.2** Client API (`/client/*`) + Activity service + socket emits — @gemini (gemini/B3.1-B3.2-drafts-client-api)
- [x] **F3.2** Client view: `ClientLayout`, greeting, `ClientCard` actions + animations, read view, all‑caught‑up — @gemini (gemini/frontend)
- [x] **F3.3** Onboarding: welcome, connect cards, `SimulatedOAuthModal`, `SyncProgress`, redirect + tour — @gemini (gemini/frontend)
- [x] **F3.4** Settings → Accounts page — @gemini (gemini/frontend)

## Phase 4 — Standout features (P1)
- [x] **B4.1** Ask AI endpoint (intent routing + LLM) — @gemini (gemini/B4-ai-demo-endpoints)
- [x] **F4.1** `CommandPalette` + `AskPanel` with thread chips — @gemini (gemini/frontend)
- [x] **B4.2** Morning brief service + fallback — @gemini (gemini/B4-ai-demo-endpoints)
- [x] **B4.3** Client "reply with a note" → draft (`draft:created`) — @gemini (gemini/B3.1-B3.2-drafts-client-api)
- [x] **B4.4** Simulate new email endpoint + scenarios — @gemini (gemini/B4-ai-demo-endpoints)
- [x] **F4.2** Simulate button (demo mode) + new‑row highlight + Reclassified chip — @gemini (gemini/frontend)
- [x] **B4.5** Few‑shot corrections in prompt (learns from overrides) — @claude
- [x] **B4.6** Follow‑up nudges (lastSender us, > 3 days) + nudge draft — @gemini (gemini/B4-ai-demo-endpoints)
- [x] **F4.3** Dark mode pass — @gemini (gemini/frontend)

## Phase 5 — Polish, QA, ship
- [x] **Q5.1** UX review pass against DESIGN_SYSTEM §10 at 375/768/1440, file issues in PROGRESS.md — @claude
- [ ] **Q5.2** Fix list from Q5.1 — @gemini
- [~] **Q5.3** Acceptance criteria run (PRD §8), all boxes ticked — @claude
- [x] **Q5.4** Deploy: Atlas, Render, Vercel; seed prod; verify sockets over HTTPS — @gemini (Aryan provides accounts/keys)
- [x] **Q5.5** README: overview, demo logins, what's simulated, architecture diagram, AI provider notes — @claude
- [ ] **Q5.6** Demo video script (PRD §9) — @claude; recording — Aryan

## Phase 6 — Real Gmail + Sign in with Google (P1, start only after Phase 2–3 frontend is solid)
> Spec: BACKEND §11, PRD §6.1 / F1b, DESIGN_SYSTEM §7 copy. Demo inbox must keep working with `REAL_GMAIL=false`.
- [ ] **G6.1** Google Cloud project, Gmail API, consent screen, test users, OAuth client, `.env` values — **Aryan** (follow `docs/GOOGLE_SETUP.md`)
- [x] **G6.2** OAuth plumbing: `/accounts/gmail/start`, `/auth/google/start`, `/oauth/google/callback`, signed `state`, token encryption (`TOKEN_ENC_KEY`), `/health` flags, env validation — @gemini (gemini/G6-real-gmail)
- [x] **G6.3** Gmail import: mapper (MIME → Thread/Message), upsert by `externalId`, classify with concurrency 2, `sync:progress` — @gemini (gemini/G6-real-gmail)
- [x] **G6.4** Poller: `history.list` every `GMAIL_POLL_SECONDS`, Sync now, `invalid_grant` → reconnect state, disconnect revokes token — @gemini (gemini/G6-real-gmail)
- [x] **G6.5** Sign in with Google: find/create user, `/auth/callback` token hand-off — @gemini (gemini/G6-real-gmail)
- [x] **G6.6** Frontend: `GoogleButton`, Gmail card dual actions, OAuth error states, `SourceBadge`, Settings → Accounts, "Open in Gmail" link — @gemini (gemini/G6-real-gmail)
- [x] **G6.7** Tests: mapper fixtures, state verification, dedupe (mock Google client) — @gemini (gemini/G6-real-gmail)
- [ ] **G6.8** Review G6.2–G6.7 against spec + update README "What's real" + video script segment — @claude

## Phase 7 — Landing page
- [x] **L7.1** Public landing page — @gemini (gemini/L7.1-landing-page)

## Backlog (P2, do not start without Aryan's OK)
- [ ] Keyboard help overlay (`?`)
- [ ] Mobile swipe actions
- [ ] ~~Real Gmail OAuth (read‑only) behind `REAL_GMAIL=true`~~ → promoted to Phase 6 (D10)
- [ ] Real sending via Gmail (`gmail.send`, restricted scope) — only after Phase 6 is done
- [ ] .ics download for "Add to calendar"
