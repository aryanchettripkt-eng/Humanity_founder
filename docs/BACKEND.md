# Backend Spec (`/server`)

> Node + Express + MongoDB (Mongoose) + Socket.io. This file is the **API contract**. Frontend types in `web/src/types/api.ts` must mirror §3–§4. **Change the contract here first, then code, then note it in PROGRESS.md.**

## 1. Stack
| Concern | Choice |
|---|---|
| Runtime | Node 20 LTS, ESM (`"type": "module"`), JavaScript + JSDoc types |
| HTTP | Express 4, `helmet`, `cors`, `morgan` (dev), `express-rate-limit` on `/api/ai/*` |
| DB | MongoDB Atlas, Mongoose 8 |
| Validation | zod (request bodies + AI outputs) |
| Auth | JWT (HS256) in `Authorization: Bearer`, bcrypt passwords |
| Realtime | Socket.io 4, JWT handshake auth, room per `clientId` |
| AI | provider abstraction (§5.1): **`groq` (default)** · `gemini` · `anthropic` · `mock` |
| Tests | Vitest + supertest (AI tests use the mock provider) |

## 2. Folder structure
```
server/
  src/
    index.js                 # http server + socket bootstrap
    app.js                   # express app (exported for tests)
    config/env.js            # zod-validated env
    db/connect.js
    models/                  # User, Client, EmailAccount, Thread, Message, Draft, Rule, Activity
    routes/                  # auth, accounts, threads, drafts, dashboard, ai, client, activity, demo
    controllers/
    services/
      classification.service.js   # pipeline orchestration (§5.3)
      draft.service.js
      ask.service.js
      brief.service.js
      sync.service.js             # simulated provider sync (§6)
      activity.service.js         # write Activity + emit socket
    ai/
      index.js               # getProvider() by env
      providers/groq.js  gemini.js  anthropic.js  mock.js
      prompts/classify.js  draft.js  ask.js  brief.js
      schemas.js             # zod schemas for AI outputs
    realtime/socket.js       # io instance, emit helpers
    middleware/auth.js  error.js  validate.js
    seed/
      seed.js                # npm run seed
      data/threads.json      # ~40 scripted threads (see §8)
      data/scenarios.json    # "simulate new email" scripts
  tests/
```

## 3. API contract
Base: `/api`. JSON only. Success: `{ "data": ... }`. Error: `{ "error": { "code": "STRING", "message": "Human readable", "details"?: any } }` with proper HTTP status. Lists: `{ "data": [...], "meta": { "total", "page", "pageSize" } }`.

Auth required on all routes except `/auth/*` and `/health`. `role` checks noted as **[A]** assistant, **[C]** client.

### 3.1 Auth
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/signup` | `{ name, email, password }` | `{ token, user }` (role assistant) |
| POST | `/auth/login` | `{ email, password }` | `{ token, user }` |
| POST | `/auth/demo` | `{ role: "assistant"|"client" }` | `{ token, user }` for seeded persona |
| GET | `/auth/me` | – | `{ user, clients: ClientSummary[] }` |

### 3.2 Accounts (connections) [A]
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/accounts` | – | `EmailAccount[]` |
| POST | `/accounts/connect` | `{ provider: "gmail"|"outlook", clientId }` | `{ accountId, consentUrl: null, simulated: true }` — FE shows `SimulatedOAuthModal` |
| POST | `/accounts/:id/authorize` | `{ approved: boolean, address }` | `EmailAccount` (status `syncing`); kicks off sync (emits `sync:progress`) |
| POST | `/accounts/:id/sync` | – | `{ started: true }` |
| DELETE | `/accounts/:id` | – | `{ ok: true }` (status `disconnected`, threads kept) |

### 3.3 Threads [A]
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | `/threads` | `?clientId&segment&q&filters=unread,important,dated&account&page=1&pageSize=50` | `ThreadListItem[]` + meta |
| GET | `/threads/counts` | `?clientId` | `{ [segment]: number }` for every segment |
| GET | `/threads/:id` | – | `ThreadDetail` (thread + messages + latest draft) |
| PATCH | `/threads/:id` | any of `{ unread, important, archived, status }` | `ThreadListItem` |
| PATCH | `/threads/:id/owner` | `{ owner, remember?: "sender"|"domain"|null }` | `ThreadListItem` (source `manual`; creates Rule if remember) |
| POST | `/threads/:id/reclassify` | – | `ThreadDetail` (forces AI run) |
| POST | `/threads/:id/suggestion` | `{ action: "apply"|"dismiss" }` | `ThreadListItem` |

### 3.4 Drafts [A]
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/threads/:id/drafts` | `{ tone: "formal"|"friendly"|"brief", instruction?: string }` | `Draft` (AI generated) |
| PATCH | `/drafts/:id` | `{ body?, subject?, to? }` | `Draft` |
| POST | `/drafts/:id/send` | – | `ThreadDetail` (simulated send: creates outbound Message, sets `waitingOnOthers=true`, owner→`none` unless AI says otherwise) |
| DELETE | `/drafts/:id` | – | `{ ok: true }` |

### 3.5 Dashboard & AI [A]
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/dashboard?clientId` | – | `{ counts, brief: { text, generatedAt, fallback: boolean }, upcoming: UpcomingItem[], review: ThreadListItem[], recent: ThreadListItem[], activity: Activity[] }` |
| POST | `/ai/ask` | `{ clientId, question, threadId? }` | `{ answer: string, threadIds: string[], action?: { type: "draft", threadId } }` |
| POST | `/ai/brief/refresh` | `{ clientId }` | `{ text, generatedAt, fallback }` |

### 3.6 Client view [C]
Client users are scoped to their own `clientId` server‑side.
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/client/queue` | – | `ClientCardItem[]` (owner `client`, handoff ≠ `handled`, not archived) |
| GET | `/client/threads/:id` | – | read‑only `ThreadDetail` (no drafts, no history) |
| POST | `/client/threads/:id/action` | `{ action: "handling"|"handled"|"handoff"|"note", note?: string }` | `ClientCardItem` — writes Activity + emits socket. `note` → owner `assistant` and generates a Draft from the note (P1). |

### 3.7 Activity & demo
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/activity?clientId&limit=20` [A] | – | `Activity[]` |
| POST | `/demo/simulate-email` [A] | `{ clientId, scenarioId? }` | `ThreadListItem` (new or updated) — runs full pipeline |
| POST | `/demo/reset` [A] | – | `{ ok: true }` re‑seeds the demo data (only when `DEMO_MODE=true`) |
| GET | `/health` | – | `{ ok: true, ai: "groq"|"gemini"|"anthropic"|"mock" }` |

## 4. Data model (Mongoose)
All docs have `createdAt/updatedAt` timestamps. IDs serialised as `id` (string) via `toJSON` transform; remove `_id`, `__v`, `passwordHash`.

```js
User {
  name, email (unique, lowercase), passwordHash,
  role: 'assistant' | 'client',
  clientId?: ObjectId,          // set when role = client
  onboarding: { completed: Boolean, tourSeen: Boolean }
}

Client {                        // a person the assistant works for
  name, firstName, email, title?, // e.g. "Founder, Raman Studio"
  assistantId: ObjectId,
  userId?: ObjectId,             // client login
  profile: {                     // used in prompts
    delegation: String,          // e.g. "Alex handles scheduling, vendors, travel. Priya handles investors, hiring decisions, legal sign-off."
    vipSenders: [String]
  }
}

EmailAccount {
  clientId, assistantId,
  provider: 'gmail' | 'outlook',
  address,
  status: 'connecting' | 'syncing' | 'connected' | 'error' | 'disconnected',
  lastSyncedAt?, error?: String,
  simulated: Boolean (default true)
}

Thread {
  clientId, accountId,
  subject, snippet,                       // snippet = first 140 chars of latest msg
  participants: [{ name, email }],
  lastMessageAt, messageCount,
  lastSender: 'them' | 'us',
  unread: Boolean, important: Boolean, archived: Boolean,
  status: 'open' | 'done',
  // --- AI / ownership ---
  owner: 'assistant' | 'client' | 'none' | 'review',
  ownerSource: 'ai' | 'rule' | 'manual' | 'client',
  suggestedOwner?: 'assistant' | 'client' | 'none',  // AI best guess when owner = review, or disagreement on sticky owner
  confidence: Number,                     // 0..1
  reason: String,                         // one sentence for the assistant
  clientReason?: String,                  // one sentence addressed to the client ("You're asked to approve…")
  category: 'meeting'|'action'|'update'|'newsletter'|'finance'|'legal'|'personal'|'general',
  actionRequired: Boolean,
  waitingOnOthers: Boolean,
  summary: String, keyPoints: [String],
  entities: [{ type: 'meeting'|'deadline'|'date', title, startsAt: Date, endsAt?: Date, location?: String }],
  reclassifiedAt?: Date,                  // drives "Reclassified" chip (24h)
  aiStatus: 'pending' | 'done' | 'failed',
  aiModel?: String,
  history: [{ at, from, to, source, reason }],   // ownership changes
  handoff: { state: 'none'|'client_handling'|'handed_to_assistant'|'handled', note?: String, at?: Date },
  // indexes: {clientId, owner, archived, status, lastMessageAt:-1}, text index on subject/snippet/summary/participants.email
}

Message {
  threadId, clientId,
  from: { name, email }, to: [{ name, email }], cc: [{ name, email }],
  sentAt, bodyText, bodyHtml?,
  direction: 'inbound' | 'outbound',
  simulated: Boolean
}

Draft {
  threadId, clientId, createdBy: 'ai' | 'user',
  tone, instruction?, sourceNote?,        // client note that produced it
  to: [{ name, email }], subject, body,
  status: 'draft' | 'sent' | 'discarded'
}

Rule {                                     // "learns from corrections"
  clientId, match: { type: 'sender' | 'domain', value }, owner, createdFromThreadId, hits: Number
}

Activity {
  clientId, actor: { type: 'client'|'assistant'|'ai'|'system', name },
  type: 'client_handling'|'client_handled'|'client_handoff'|'client_note'|'reclassified'|'owner_changed'|'draft_sent'|'sync_completed'|'new_email',
  threadId?, payload: Mixed, createdAt
}
```

### Segment → query mapping (single function `segmentFilter(segment)` in `services/segments.js`)
| Segment | Filter (always `clientId` scoped, `archived:false` unless noted) |
|---|---|
| inbox | `status:'open'` |
| assistant / client / review / none | `owner:X, status:'open'` |
| action | `actionRequired:true, status:'open'` |
| waiting | `waitingOnOthers:true, status:'open'` |
| meetings | `category:'meeting'` or `entities.type:'meeting'` |
| important | `important:true` |
| general | `category in ['general','update','newsletter']` |
| done | `status:'done'` |
| archived | `archived:true` |

## 5. AI pipeline

### 5.1 Provider abstraction (keep provider swappable)
```js
// ai/index.js
export function getProvider() // returns provider based on env AI_PROVIDER
// every provider implements:
generateJSON({ system, prompt, schema /* zod */, temperature = 0.2 }) -> Promise<object>   // validated, throws AIError
generateText({ system, prompt, temperature = 0.5 }) -> Promise<string>
name -> 'groq' | 'gemini' | 'anthropic' | 'mock'
```
Env:
```
AI_PROVIDER=groq | gemini | anthropic | mock   # groq is the project default; falls back to mock if no key
GROQ_API_KEY=...         GROQ_MODEL=<current Groq Llama 3.x 70B-class model>   # e.g. llama-3.3-70b-versatile; check console.groq.com/docs/models
GROQ_FAST_MODEL=<small Groq model for bulk sync classification>          # optional, e.g. an 8B instant model
GEMINI_API_KEY=...       GEMINI_MODEL=<current Gemini Flash model>
ANTHROPIC_API_KEY=...    ANTHROPIC_MODEL=<current Claude Sonnet/Haiku model>
AI_CONFIDENCE_THRESHOLD=0.7
AI_TIMEOUT_MS=15000
```
- **Groq (default)**: `groq-sdk` (OpenAI‑compatible chat completions) with `response_format: { type: "json_object" }`; put the JSON schema in the system prompt and validate with zod (Groq JSON mode guarantees valid JSON, not schema conformance). Respect free‑tier rate limits: sync classification runs with concurrency 2 and exponential backoff on HTTP 429; seed ships pre‑computed AI fields so first load doesn't hit limits.
- Gemini: `@google/genai` SDK with `responseMimeType: "application/json"` + response schema.
- Anthropic: `@anthropic-ai/sdk` with a single tool / structured output for JSON.
- **Mock**: deterministic keyword heuristics (newsletter/unsubscribe → none; "approve", "your decision", "sign", investor/board → client; schedule/reschedule/invoice/booking → assistant; else review @ 0.5). Generates template summaries. This guarantees the deployed demo never breaks (AC13).
- All AI output is validated with zod; one retry with "Return only valid JSON matching the schema"; then fallback (§5.4).
- Cache by `threadId + lastMessageAt + promptVersion` to avoid repeat calls.

### 5.2 Classification output schema (`ai/schemas.js`)
```json
{
  "owner": "assistant | client | none",
  "confidence": 0.0,
  "reason": "One sentence, evidence-first, for the assistant.",
  "clientReason": "One sentence addressed to the client, or null if owner != client.",
  "category": "meeting | action | update | newsletter | finance | legal | personal | general",
  "isImportant": true,
  "actionRequired": true,
  "waitingOnOthers": false,
  "summary": "≤ 2 sentences.",
  "keyPoints": ["≤ 4 short bullets"],
  "entities": [{ "type": "meeting | deadline | date", "title": "", "startsAt": "ISO-8601", "endsAt": "ISO-8601 | null", "location": "string | null" }]
}
```
Note the model never outputs `review`; the server maps `confidence < AI_CONFIDENCE_THRESHOLD` → `owner:'review'`, `suggestedOwner: <model owner>`.

### 5.3 Pipeline (`classification.service.js`)
1. Load thread + messages (cap: last 12 messages, each body truncated to 2,000 chars; older messages summarised into one line each).
2. **Rules first**: if a Rule matches latest inbound sender/domain → set owner from rule (`ownerSource:'rule'`, confidence 1, reason "Rule: emails from X go to Client"), still call AI for summary/entities.
3. Build prompt (§5.5) with client profile + up to 5 recent manual corrections as few‑shot examples.
4. Call provider → validate → map review threshold.
5. **Sticky owners**: if current `ownerSource` is `manual` or `client`, do not overwrite owner; if AI disagrees with confidence ≥ 0.85, set `suggestedOwner` (UI shows suggestion banner).
6. If owner changed vs previous: push to `history`, set `reclassifiedAt`, write Activity `reclassified`.
7. Save, emit `thread:updated` (and `counts:changed`).
Triggers: sync (batched, concurrency 4, emits `sync:progress`), new inbound message, `/reclassify`, `/demo/simulate-email`.

### 5.4 Failure handling
Timeout/invalid JSON after retry → `aiStatus:'failed'`, `owner:'review'`, `reason:'AI unavailable — please review'`, summary = snippet. Never block the request; never 500 to the UI because of AI.

### 5.5 Classification prompt (v1 — `ai/prompts/classify.js`, export `PROMPT_VERSION`)
```
SYSTEM:
You triage email for a personal assistant (PA) who manages the inbox of their client.
Decide WHO must reply to the conversation:
- "assistant": the PA can handle it on the client's behalf — scheduling/rescheduling, logistics, routine
  vendor or business inquiries, follow-ups on pending requests, admin, travel, invoices/payments processing.
- "client": only the client can reply — personal decisions or approvals, sensitive business matters
  (investors, legal, hiring/firing, compensation, negotiations), messages explicitly asking for the
  client's own input/opinion, close personal relationships, anything requiring the client's signature.
- "none": no reply needed — newsletters, notifications, receipts, automated messages, FYIs,
  cc-only updates, or threads already resolved (e.g. last message is a thank-you/confirmation).
Rules:
- Consider the WHOLE conversation; the latest message matters most. If the PA already replied and
  the other side has not answered, owner is "none" and waitingOnOthers = true.
- Do not default to a reply. Most automated or informational mail is "none".
- confidence reflects how clearly the evidence supports the owner (0.9+ explicit, 0.7–0.9 strong
  signals, <0.7 ambiguous).
- reason: one sentence that cites the evidence ("James asks Priya directly to approve the Q3 budget.").
- Extract every concrete date/time/deadline as ISO-8601 in the client's timezone ({{timezone}}).
  Today is {{today}}.
- Output ONLY JSON matching the schema.

USER:
Client: {{client.name}}, {{client.title}}. Assistant: {{assistant.name}}.
Delegation notes: {{client.profile.delegation}}
VIP senders: {{client.profile.vipSenders}}
Recent corrections by the assistant (follow these patterns):
{{#each corrections}}- "{{subject}}" from {{sender}} → {{owner}} ({{why}})
{{/each}}
Conversation (oldest → newest):
{{#each messages}}
--- [{{direction}}] {{from.name}} <{{from.email}}> · {{sentAt}}
To: {{to}}  Cc: {{cc}}
{{bodyText}}
{{/each}}
```

### 5.6 Other prompts (short specs)
- **Draft** (`generateText`): inputs thread, tone, instruction, optional client note, signature "{{assistant.name}}, on behalf of {{client.name}}" when owner is assistant. Output plain text body only, ≤ 150 words for brief. Never invent facts/dates not in thread or instruction; use `[placeholder]` if missing.
- **Ask** (`generateJSON`): server first runs intent routing with cheap rules (`waiting` → waiting segment, `attention|need me` → assistant+review, `client` → client segment, `why` + threadId → return stored reason, `draft` → action draft). Pass the matching thread summaries (≤ 25) to the model: `{ answer, threadIds }`. Model only cites ids it was given.
- **Brief** (`generateText`): input counts + top 5 assistant/client/review threads + upcoming 48h entities → 2–3 sentences, no greeting fluff. Fallback template: `"{a} threads need you, {c} need {client}, {r} to review. Next up: {entity}."`

## 6. Mock integrations (what is simulated)
| Real thing | Prototype behaviour |
|---|---|
| Gmail/Outlook OAuth | `POST /accounts/connect` + `SimulatedOAuthModal` (provider-styled consent with scopes list). `authorize` marks account `syncing`. |
| Mailbox sync | `sync.service` loads `seed/data/threads.json` for that client in batches, emitting `sync:progress {accountId, step, done, total}` steps: `fetching` → `classifying` → `extracting` → `done`. Adds a ~150ms delay per thread so progress is visible (≈ 6–8s total). |
| New incoming email | `POST /demo/simulate-email` picks next scenario from `scenarios.json` (some create new threads, some append to existing to demonstrate reclassification). |
| Sending email | `POST /drafts/:id/send` appends an outbound Message; nothing leaves the server. |
| Calendar | "Add to calendar" → toast only (could produce .ics download as P2). |

## 7. Realtime (Socket.io)
- Connect with `auth: { token }`. Server joins socket to `client:{clientId}` for each client the user can see, plus `user:{userId}`.
- Events (server → client), payloads are the same shapes as REST:

| Event | Payload | FE reaction |
|---|---|---|
| `thread:created` | `ThreadListItem` | invalidate lists + counts, highlight row |
| `thread:updated` | `ThreadListItem` | patch detail/list cache, invalidate counts |
| `counts:changed` | `{ clientId }` | invalidate counts + dashboard |
| `activity:new` | `Activity` | prepend to feed, toast if actor is client |
| `sync:progress` | `{ accountId, step, done, total }` | drive SyncProgress |
| `sync:done` | `EmailAccount` | finish onboarding |
| `draft:created` | `Draft` | when client note generates a draft |

No client → server events besides connection (all writes go through REST).

## 8. Seed data (`npm run seed`)
- Users: `alex@example.com` (assistant), `priya@example.com` (client of Alex), `daniel@example.com` (client of Alex). Password for all: `demo1234`.
- Priya: ~32 threads; Daniel: ~10 threads. Mix target for Priya:
  - assistant ≈ 35% (rescheduling, vendor quotes, travel booking, invoice follow‑up, event RSVP)
  - client ≈ 25% (investor term sheet, board deck approval, hiring offer decision, personal note from friend, legal signature, journalist interview request)
  - none ≈ 25% (newsletters, Stripe receipts, GitHub/Slack notifications, FYI updates, resolved threads)
  - review ≈ 10–15% (ambiguous: "Quick question" from unknown sender, cc‑heavy threads)
  - At least 6 threads with multi‑message history; at least 3 where the latest message flips ownership; 8+ with extractable dates within the next 7 days relative to seed time (generate dates relative to `now`).
- Seed stores pre‑computed AI fields (so first load is instant) **and** can re‑run the live pipeline with `npm run seed -- --classify`.
- `scenarios.json`: ≥ 5 scenarios (new investor email → client; reply on existing "dinner reschedule" thread that now asks for Priya's personal choice → reclassify assistant→client; newsletter → none; ambiguous → review; meeting request → assistant + entity).

## 9. Security & config (prototype‑appropriate)
- Env validated at boot: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`, `DEMO_MODE`, AI vars above.
- Client users can only access `/client/*` for their own `clientId`; assistants only their own clients. Enforce in middleware, not in controllers.
- Never log email bodies or API keys. Rate‑limit AI routes (30/min/user).
- `.env.example` committed, `.env` git‑ignored.

## 10. Deployment
- Server: Render (web service, `npm start`), health check `/health`, WebSockets enabled.
- DB: MongoDB Atlas free tier. Web: Vercel with `VITE_API_URL`/`VITE_SOCKET_URL`.
- On deploy with `DEMO_MODE=true`, run seed once; `/demo/reset` lets reviewers restore state.
