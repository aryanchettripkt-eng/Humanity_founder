# PRD — Inbox Copilot for Personal Assistants

> Working name: **Relay** (rename freely; update this line and `web/index.html` title together).
> Status: v1.0 · Owner of this doc: Aryan · Last updated: 2026-11-14
> Related: [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) · [FRONTEND](./FRONTEND.md) · [BACKEND](./BACKEND.md) · [ROADMAP](./ROADMAP.md) · [AGENTS](../AGENTS.md)

---

## 1. Context

This is a **prototype** for an internship assignment (AI Full‑Stack Engineer Intern). Deliverables: a deployed link + a short demo video. Source code is not submitted, so **what matters is the product experience in the browser.**

Evaluation priorities, in order of how we spend effort:

1. **UI/UX quality** (explicitly the most important): polished, calm, consistent, responsive, every state designed.
2. **Product understanding**: the assistant ↔ client relationship and the "who needs to reply?" problem.
3. **AI implementation**: AI meaningfully decides ownership, summarises, extracts dates, drafts replies, answers questions.
4. **Functional execution**: the core journey works end‑to‑end. No decorative dead screens.
5. Attention to detail, ownership.

> Rule of thumb from the brief: *"A few core features implemented exceptionally well beats many incomplete ones."* When in doubt, polish a core feature instead of starting a stretch one.

## 2. Problem

Personal assistants (PAs) manage high‑volume inboxes on behalf of one or more clients. The hardest daily question is not *"what is this email?"* but **"who needs to reply to it — me, my client, or nobody?"** Clients often read an email and never say whether they'll answer it, so things fall through the cracks or get answered twice.

## 3. Users

| Persona | Who | Goal | Surface |
|---|---|---|---|
| **Assistant** (primary) — *Alex Morgan* | PA managing 1–3 clients' inboxes all day, desktop‑first, power user | Know in seconds what needs action, clear their queue fast, never miss something the client must answer | Full dashboard (`/app/*`) |
| **Client** (secondary) — *Priya Raman*, founder | Busy executive, mobile‑first, low patience | See only the few emails that truly need *them*, decide in one tap | Minimal view (`/c`) |

Seeded demo data uses these personas plus a second, lighter client (*Daniel Okafor*) to show the client switcher.

## 4. Product principles

1. **Calm over clever.** Neutral surfaces; color is reserved for *ownership* signals.
2. **Answer "what needs me?" in 3 seconds.** Every screen leads with the action, then details.
3. **AI is visible but humble.** Every AI decision shows *why* + confidence and is reversible in one click.
4. **Two products, one family.** Assistant view is dense and powerful; client view feels like a notification feed.
5. **Nothing is sent without a human.** AI drafts, humans approve.

## 5. Core concepts (shared vocabulary — use these exact names in code & UI)

| Concept | Values | Notes |
|---|---|---|
| **Owner** (reply responsibility) | `assistant` · `client` · `none` · `review` | UI labels: *Assistant* · *Client* · *No reply* · *Needs review*. `review` = AI confidence < 0.70 or AI failed. |
| **Owner source** | `ai` · `rule` · `manual` · `client` | Who set the current owner. Shown as a tiny icon/tooltip on the pill. |
| **Segment** | `today`, `inbox`, `assistant`, `client`, `review`, `action`, `waiting`, `meetings`, `important`, `general`, `none`, `done`, `archived` | Segments are *filters/views*, not folders. A thread can appear in several. |
| **Category** (AI) | `meeting` · `action` · `update` · `newsletter` · `finance` · `legal` · `personal` · `general` | Drives Meetings/General segments and icons. |
| **Handoff state** | `none` · `client_handling` · `handed_to_assistant` · `handled` | Set from the client view. |
| **Thread status** | `open` · `done` | "Mark complete". Archive is a separate flag. |

## 6. Feature scope

Legend: **P0** = must ship (core, maps to a brief deliverable) · **P1** = our standout ideas, ship if P0 is polished · **P2** = only if time remains.

### 6.1 Onboarding & email connection — P0 (Deliverable 1)
- Sign up / log in (email + password, JWT). One‑click **"Try the demo"** buttons for Assistant and Client personas on the login screen.
- 3‑step onboarding: **Welcome** (value prop, 3 bullets) → **Connect** (Gmail / Outlook cards) → **Sync** (live progress: "Fetching 42 conversations… Classifying… Extracting dates…").
- Connection uses a **simulated OAuth** modal that looks like a provider consent screen (clearly labelled "Simulated for prototype" in small text). See BACKEND §6. This "demo inbox" path is the default and must always work.
- **Real Gmail (P1, Phase 6):** the Gmail card also offers *Connect real Gmail (beta)*: real Google OAuth, read-only, imports the last ~50 inbox threads into the same AI pipeline and checks for new mail every minute. Works only for Google accounts added as test users until Google verifies the app, so it's for Aryan's demo video, not for reviewers. See BACKEND §11.
- **Sign in with Google (P1):** "Continue with Google" on the login page, alongside email/password and the demo buttons.
- Connection status visible in sidebar footer and Settings → Accounts: `connected` / `syncing` / `error` / `disconnected`, last synced time, **Sync now**, **Disconnect**.
- Lands on **Today** with a 3‑stop guided tour (owner pill, review strip, client view link). Skippable, shown once.

### 6.2 Assistant dashboard — "Today" — P0 (Deliverable 2)
- **AI brief card** (P1 content, P0 slot): 2–3 sentences, e.g. *"4 threads need you, 2 need Priya, Thursday's board call conflicts with the dentist."* Falls back to a template string if AI is down.
- **4 stat tiles that act as filters**: Needs you (assistant) · Needs client · Needs review · Waiting on others. Click → Inbox with that segment.
- Secondary counts (small, in a row): Total · Unread · Important · Action required.
- **Needs review strip**: horizontal list of low‑confidence threads with inline "Assistant / Client / No reply" quick buttons.
- **Upcoming rail**: meetings, deadlines and dates extracted by AI, next 7 days, with "Add to calendar" (simulated, toast).
- **Client activity feed**: live events like *"Priya handed back: Contract renewal — 'Say yes but push to Friday'"*.
- **Recent conversations**: last 5 updated threads.
- Global search (top bar) + **⌘K / Ctrl+K command palette** (search, jump to segment, ask AI).

### 6.3 Automatic classification & reply responsibility — P0 (Deliverable 4, *most important*)
- Runs automatically on: initial sync, new inbound message on any thread, manual "Re‑analyse".
- Input = **whole thread** (all messages, oldest→newest) + client profile + sender rules + recent manual corrections (few‑shot).
- Output (strict JSON, see BACKEND §5): owner, confidence 0–1, one‑line reason, category, isImportant, actionRequired, waitingOnOthers, summary, keyPoints, extracted dates.
- **confidence < 0.70 → owner = `review`** with the AI's best guess kept as `suggestedOwner`.
- AI must not mark everything as needing a reply: newsletters, notifications, FYIs, resolved threads → `none`.
- Owner pill visible on every list row and the thread header.
- **Manual override**: click pill → popover with 4 options + checkbox *"Always do this for emails from {sender/domain}"* (creates a Rule). Undo toast for 5s.
- When a new message arrives in a thread, it is re‑classified; if the owner changes, show a **"Reclassified"** chip on the row for 24h and log it in the thread's history ("Was Assistant → now Client: Priya was asked directly for approval").
- **Manual owners are sticky**: a re‑classification never silently overwrites a `manual` or `client` owner. Instead, if the AI now disagrees with ≥ 0.85 confidence, it adds a suggestion banner in the thread ("AI suggests Client now — Apply / Dismiss").

### 6.4 Segments & organisation — P0 (Deliverable 3)
- Sidebar: **Today**, **Inbox (all open)**, then *Who replies*: Assistant · Client · Needs review · No reply; then *Status*: Action required · Waiting · Meetings · Important · General · Done · Archived. Each shows a count.
- Search (sender, subject, body, summary) + filter chips (unread, important, has date, account, category).
- Switching segments preserves the selected thread if it's in the new segment, scroll position per segment, and filters (URL‑driven).

### 6.5 Thread detail & management — P0 (Deliverable 6)
- Messages oldest→newest; older ones collapsed with "Show 3 earlier messages". Sender name, email, avatar initials, timestamps (relative + absolute on hover).
- **AI side panel**: summary, key points, extracted dates (with add‑to‑calendar), *"Why {owner}?"* reason + confidence meter + source, classification history.
- Actions (toolbar + keyboard): mark important (`s`), unread (`u`), archive (`e`), mark done (`d`), reply (`r`), change owner (`o`), next/prev (`j`/`k`), re‑analyse.
- Client note / handoff banner if the client acted on this thread.

### 6.6 AI reply drafting & review — P0 (Deliverable 8)
- **Draft with AI** button → composer prefilled. Tone chips: *Formal · Friendly · Brief*. Optional instruction box ("decline politely, offer next week").
- User edits inline; **Regenerate** keeps instruction; **Send** is always a deliberate click with a confirm state ("Send to james@acme.com?"). Sending is **simulated**: appends an outbound message, thread moves to *Waiting* if a reply is expected.
- Never auto‑send. Drafts persist per thread until sent or discarded.

### 6.7 AI assistance — P0 summaries, P1 chat (Deliverable 7)
- P0: per‑thread summary + key points + dates; "Summarise" available on long threads.
- P1: **Ask your inbox** panel (in ⌘K and a sidebar button). Supports at least the brief's example questions:
  "Show me emails that need my attention" · "Summarise this conversation" · "What am I waiting for a response on?" · "Which emails require the client's attention?" · "Why has this email been assigned to the client?" · "Draft a reply to this conversation".
  Answers cite threads as clickable chips.

### 6.8 Client view — P0 (Deliverable 5)
- Route `/c`, mobile‑first single column, no sidebar. Greeting: *"Good morning, Priya. 3 things need you."*
- Shows only threads with owner = `client` and handoff ≠ `handled`, sorted by urgency then date.
- Card: sender + subject, received date, 2‑line AI summary, **"Why you"** line (the AI reason, rephrased for the client), actions:
  - **I'll handle it** → handoff `client_handling` (stays on list with a subtle "You're on it" tag; can then **Mark handled**).
  - **Assistant take over** → owner = `assistant` (source `client`), handoff `handed_to_assistant`, optional note.
  - **Reply with a note** (P1) → client types/dictates "say yes but Friday"; AI turns it into a draft in the assistant's composer; owner → `assistant`.
  - Tap card → read original conversation (read‑only, clean).
- All actions sync **live** to the assistant (Socket.io) and appear in the Today activity feed + thread banner.
- Empty state: calm illustration + "You're all caught up."

### 6.9 Responsive & states — P0 (Deliverable 9)
- Desktop 3‑pane, tablet 2‑pane + drawer, mobile bottom tabs + full‑screen thread (see DESIGN_SYSTEM §8).
- Every data view has: skeleton loading, empty, error (with retry), and success feedback (toast). AI failure falls back to `review` with reason "AI unavailable — please review".
- Offline banner when socket disconnects.

### 6.10 Stretch — P1 / P2
| ID | Feature | Pri |
|---|---|---|
| S1 | Learns from corrections (sender/domain rules + few‑shot from overrides) | P1 (rules are P0 via checkbox; few‑shot is P1) |
| S2 | Client "reply with a note" → AI draft | P1 |
| S3 | Morning brief content | P1 |
| S4 | Ask your inbox chat | P1 |
| S5 | Follow‑up nudges: we sent last, no reply 3+ days → "Nudge" draft | P1 |
| S6 | **Simulate new email** demo button (assistant top bar, demo only) → picks a scripted scenario, shows live classification + Reclassified chip | P1 (very valuable for the video) |
| S7 | Dark mode | P1 |
| S8 | Keyboard shortcut help overlay (`?`) | P2 |
| S9 | Swipe gestures on mobile list | P2 |
| S10 | Real Gmail OAuth (read‑only) behind `REAL_GMAIL` flag + Sign in with Google — BACKEND §11, ROADMAP Phase 6 | **P1** (after core UI is solid) |
| S11 | Custom platform‑domain email addresses | Out of scope (mention in video as future) |

### 6.11 Explicitly out of scope
Real sending of email (even for real Gmail), writing changes back to Gmail (archive/read/labels), Gmail push notifications, real Outlook integration, attachments upload, multi‑assistant teams, billing, notifications by email/push, i18n.

## 7. Key user flows

**F1 — First run (assistant):** Login → "Try demo as Assistant" *or* sign up → Welcome → Connect Gmail (simulated consent) → Sync progress → Today + tour.

**F1b — Real Gmail (P1):** Settings → Accounts *or* onboarding Connect → "Connect real Gmail (beta)" → Google consent → back to Sync progress (real threads importing + classifying) → Today with a *Live* badge on that account. If Google refuses (not a test user) → friendly error + "Use the demo inbox instead".

**F2 — Morning triage:** Today → read brief → click "Needs review (3)" → for each, read reason → tap correct owner (optionally "always for this sender") → undo available → Today counts update live.

**F3 — Handle an assistant thread:** Inbox › Assistant → open thread → read AI summary → Draft with AI (Friendly) → edit → Send (confirm) → thread moves to Waiting → toast "Sent (simulated)".

**F4 — Client loop:** Client opens `/c` on phone → sees 3 cards → "Assistant take over" with note "Say yes but push to Friday" → assistant's Today shows activity item instantly → thread owner = Assistant, banner shows note → Draft with AI uses the note.

**F5 — New mail arrives (demo):** Assistant clicks *Simulate new email* → toast "New email from Acme Legal" → row appears at top with skeleton pill → pill resolves to *Client* (reason shown) → if it was an existing thread whose owner changed, "Reclassified" chip appears.

**F6 — Ask AI:** ⌘K → "What am I waiting on?" → answer with 3 thread chips → click opens thread.

## 8. Acceptance criteria (definition of done for the prototype)

A reviewer with no instructions can, on desktop **and** a phone:

- [ ] AC1 Log in via demo button in ≤ 2 clicks and see Today with real numbers.
- [ ] AC2 Complete onboarding: connect Gmail or Outlook (simulated), watch sync progress, land on Today.
- [ ] AC3 See an owner pill on every thread row; pills are consistent in color/label everywhere.
- [ ] AC4 Open any thread and see summary, key points, dates, and *why* this owner + confidence.
- [ ] AC5 Change an owner in ≤ 2 clicks, see counts update, and undo it.
- [ ] AC6 At least 15% of seeded threads are `none` and ~10% are `review` (AI does not mark everything as needing a reply).
- [ ] AC7 Generate an AI draft, edit it, and "send" it; nothing is sent without a click.
- [ ] AC8 Open `/c` as the client and only see Client‑owned threads; "Assistant take over" updates the assistant view live (< 2s, no refresh).
- [ ] AC9 A new inbound message reclassifies a thread and the UI shows it.
- [ ] AC10 Search finds a thread by sender, subject or body text.
- [ ] AC11 Every list/panel has designed loading, empty and error states; no raw errors or blank screens.
- [ ] AC12 Works at 375px, 768px and 1440px widths without horizontal scroll.
- [ ] AC13 App works with **no AI key** (mock provider; default live provider is Groq) so the deployed demo never breaks.
- [ ] AC14 ~~Anything simulated is labelled subtly in‑app and~~ Anything simulated is listed in the README "What's simulated" section; the UI uses true product wording without prototype labels (D20, Aryan 2026-11-15).

## 9. Success metrics for the demo video (≈ 3–4 min)
Script order: problem (15s) → onboarding (30s) → Today in 3 seconds (30s) → classification + override + why (45s) → draft & send (30s) → client view on phone + live handoff (45s) → simulate new email / reclassify (20s) → ask AI (15s) → what's simulated & next steps (15s).

## 10. Open questions
- Who owns the Google Cloud project for real Gmail (Aryan's personal Google account assumed). See `docs/GOOGLE_SETUP.md`.
- Product name: "Relay" placeholder — Aryan to confirm.
- ~~AI provider for deployment~~ → Groq (DECISIONS D9); Gemini/Claude/mock remain switchable.
- Deployment targets: Vercel (web) + Render (server) + MongoDB Atlas assumed.

## 11. What's real vs simulated (keep in sync with README)
| Area | Status |
|---|---|
| Sign up / log in, password hashing, JWT | **Real** |
| Sign in with Google | **Real** (P1, Phase 6) |
| MongoDB storage of threads, labels, drafts, actions, rules | **Real** |
| AI: who-replies + confidence + reason, summaries, key points, dates, drafts, ask-your-inbox, morning brief | **Real** LLM calls via Groq when `GROQ_API_KEY` is set; deterministic keyword **mock** when no key or the provider fails |
| Owner overrides, "always for this sender" rules, re-classification on new messages | **Real** |
| Live assistant ↔ client sync (Socket.io) | **Real** |
| Search, filters, segments, archive / done / important | **Real** (on stored data) |
| Connecting Gmail / Outlook | **Simulated** consent screen (default). **Real Gmail, read-only** as optional P1 path for test users |
| Mailbox contents | **Simulated** sample threads (seed). Real inbox when real Gmail is connected |
| New mail arriving | **Simulated** via "Simulate new email" button. Real Gmail: polled every ~60s |
| Sending replies | **Simulated** (saved to the thread; nothing leaves) — also for real Gmail |
| Changes written back to Gmail | **Not done** (read-only) |
| Outlook | **Simulated** only |
| Add to calendar | **Simulated** (toast) |

