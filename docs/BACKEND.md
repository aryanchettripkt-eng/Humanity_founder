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
| GET | `/auth/google/start` | – (public) | 302 → Google consent (scopes `openid email profile`). P1, see §11 |

### 3.2 Accounts (connections) [A]
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/accounts` | – | `EmailAccount[]` |
| POST | `/accounts/connect` | `{ provider: "gmail"|"outlook", clientId }` | `{ accountId, consentUrl: null, simulated: true }` — FE shows `SimulatedOAuthModal` |
| POST | `/accounts/:id/authorize` | `{ approved: boolean, address }` | `EmailAccount` (status `syncing`); kicks off sync (emits `sync:progress`) |
| POST | `/accounts/:id/sync` | – | `{ started: true }` |
| DELETE | `/accounts/:id` | – | `{ ok: true }` (status `disconnected`, threads kept; for real Gmail also revokes + deletes tokens) |
| POST | `/accounts/gmail/start` | `{ clientId? }` | `{ authUrl }` — FE does `window.location = authUrl`. Only when `REAL_GMAIL=true` and Google creds are set, else `409 GMAIL_DISABLED`. See §11 |
| POST | `/accounts/gmail/complete` | `{ code }` | `EmailAccount` (status `syncing`). `403 ACCOUNT_MISMATCH` if the Google account isn't the signed-in user's (§11.3a). On success, removes the client's demo inbox (simulated accounts + their sample threads) before the import starts |

### 3.2a Google OAuth callback (public, no Bearer)
| Method | Path | Query | Returns |
|---|---|---|---|
| GET | `/oauth/google/callback` | `code, state` or `error` | 302 redirect to the web app. Purpose comes from the signed `state`: `login` → `${WEB_URL}/auth/callback#token=…`; `gmail` → `${WEB_URL}/onboarding?step=sync&accountId=…`. On failure → same targets with `?error=<code>` (`access_denied`, `not_test_user`, `state_invalid`, `exchange_failed`, `account_mismatch`). |

### 3.3 Threads [A]
| Method | Path | Body / Query | Returns |
|---|---|---|---|
| GET | `/threads` | `?clientId&segment&handoff=client_handling\|handed_to_assistant\|handled&q&filters=unread,important,dated&account&page=1&pageSize=50` (`handoff` filters on `handoff.state` and combines with `segment`) | `ThreadListItem[]` + meta |
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
| GET | `/dashboard?clientId` | – | `{ counts, brief: { text, generatedAt, fallback: boolean }, upcoming: UpcomingItem[], review: ThreadListItem[], recent: ThreadListItem[], activity: Activity[], nudges: ThreadListItem[] }` (`nudges` added by Gemini in B4.6: `lastSender:'us'`, > 3 days, still open) |
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
  name, email (unique, lowercase), passwordHash?,   // optional when the user only signs in with Google
  googleId?: String (unique, sparse), avatarUrl?: String,   // §11, P1
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
  simulated: Boolean (default true),      // false for a real Gmail connection (§11)
  google?: {                              // only when simulated = false
    sub: String,                          // Google account id
    refreshTokenEnc: String,              // AES-256-GCM with TOKEN_ENC_KEY; never returned by the API
    scope: String,
    historyId: String,                    // Gmail history cursor for polling
    lastPolledAt: Date
  }
}
// toJSON must strip `google.refreshTokenEnc`.

Thread {
  clientId, accountId,
  source: 'seed' | 'simulated' | 'gmail',   // default 'seed'; drives the Live/Demo badge
  externalId?: String,                      // Gmail threadId; unique per account (index {accountId, externalId}, sparse)
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
  externalId?: String,                      // Gmail message id; unique per thread, used for dedupe
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
GROQ_FALLBACK_MODELS=qwen/qwen3.8-27b   # comma-separated; tried after the two above when they are rate-limited (D25)
GEMINI_API_KEY=...       GEMINI_MODEL=<current Gemini Flash model>
ANTHROPIC_API_KEY=...    ANTHROPIC_MODEL=<current Claude Sonnet/Haiku model>
AI_CONFIDENCE_THRESHOLD=0.7
AI_TIMEOUT_MS=15000
```
- **Groq (default)**: `groq-sdk` (OpenAI‑compatible chat completions) with `response_format: { type: "json_object" }`; put the JSON schema in the system prompt and validate with zod (Groq JSON mode guarantees valid JSON, not schema conformance). Respect free‑tier rate limits: sync classification runs with concurrency 2 and exponential backoff on HTTP 429; seed ships pre‑computed AI fields so first load doesn't hit limits.
  - **Model fallback (D25):** free-tier limits are per model (≈8K tokens/min each), so every Groq call walks a chain: normal `GROQ_MODEL → GROQ_FAST_MODEL → GROQ_FALLBACK_MODELS`, fast `GROQ_FAST_MODEL → GROQ_MODEL → …`. A 429 parks that model until its `retry-after` and the next model takes the request; 404 parks it for 10 min; 400/5xx try the next model; 401 fails at once. If every model is parked the call waits for the earliest (max 3 rounds). gpt-oss models get `reasoning_effort: low`, Qwen models `reasoning_format: hidden`.
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

### 5.5 Classification prompt (v3 — built in `services/classification.service.js`, export `PROMPT_VERSION`; v2 adds the corrections block; v3 shows each message's time in the client's timezone with its weekday and tells the model to resolve "by Friday" from that date and check weekdays)
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
- **Brief** (`generateText`, `PROMPT_VERSION = 'v4'`): input counts + top 5 assistant/client/review threads + upcoming 48h entities → 2–3 sentences, no greeting fluff, times formatted in the client's timezone as `"Sun 8:00 pm"` (never UTC or year), and ISO timestamps in thread summaries sanitized before prompt injection. Fallback template: `"{a} threads need you, {c} need {client}, {r} to review. Next up: {entity}."`

## 6. Mock integrations (what is simulated)
> Real vs simulated summary lives in PRD §11. Real Gmail (read-only) is an optional path, see §11 below; the demo inbox stays the default.

| Real thing | Prototype behaviour |
|---|---|
| Gmail/Outlook OAuth | **Demo path (default):** `POST /accounts/connect` + `SimulatedOAuthModal` (provider-styled consent with scopes list). `authorize` marks account `syncing`. **Real path (Gmail only, P1):** §11. Outlook is always simulated. |
| Mailbox sync | `sync.service` loads `seed/data/threads.json` for that client in batches, emitting `sync:progress {accountId, step, done, total}` steps: `fetching` → `classifying` → `extracting` → `done`. Adds a ~150ms delay per thread so progress is visible (≈ 6–8s total). |
| New incoming email | `POST /demo/simulate-email` picks next scenario from `scenarios.json` (some create new threads, some append to existing to demonstrate reclassification). |
| Sending email | `POST /drafts/:id/send` appends an outbound Message; nothing leaves the server. |
| Calendar | "Add to calendar" → toast only (could produce .ics download as P2). |

## 7. Realtime (Socket.io)
- Connect with `auth: { token }`. Rooms (changed in Gemini's review‑fix commit, see DECISIONS D12):
  - `assistants:{clientId}` — every assistant socket that manages that client; receives full payloads. When a Client is created after the socket connected, `joinAssistantClientRoom()` adds it.
  - `client:{clientId}` — the client's own login; receives only `thread:created/updated` for threads that are client-owned or have a handoff, with `history`, `reason`, `suggestedOwner` removed. No drafts, activity or counts.
  - `user:{userId}` — per user; `sync:progress` / `sync:done` are also sent here so a brand-new assistant sees onboarding progress.
- Known quirk: an assistant is in both `assistants:` and `user:` rooms, so sync events can arrive twice. FE must treat them idempotently (they carry absolute `done/total`).
- Known gap: if AI moves a thread *away* from `client` without a handoff, the client socket isn't told; the client view should refetch `/client/queue` on focus and every 60s.
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
- Priya: ~38 threads; Daniel: ~10 threads. Mix target for Priya:
  - assistant ≈ 35% (rescheduling, vendor quotes, travel booking, invoice follow‑up, event RSVP)
  - client ≈ 25% (investor term sheet, board deck approval, hiring offer decision, personal note from friend, legal signature, journalist interview request)
  - none ≈ 25% (newsletters, Stripe receipts, GitHub/Slack notifications, FYI updates, resolved threads)
  - review ≈ 10–15% (ambiguous: "Quick question" from unknown sender, cc‑heavy threads)
  - At least 6 threads with multi‑message history; at least 3 where the latest message flips ownership; 8+ with extractable dates within the next 7 days relative to seed time (generate dates relative to `now`).
- Seed stores pre‑computed AI fields (so first load is instant) **and** can re‑run the live pipeline with `npm run seed -- --classify`.
- `threads.json` item format (all optional unless noted; see `seed.js`): `clientKey` (`priya`|`daniel`), `subject`*, `participants`, `messages[]` (`from`, `to`, `cc`, `direction`, `hoursOffset` < 0 or `sentAt`, `bodyText`), the AI fields (`owner`, `ownerSource`, `suggestedOwner`, `confidence`, `reason`, `clientReason`, `category`, `actionRequired`, `waitingOnOthers`, `summary`, `keyPoints`), `entities[]` with `when` (`{ weekday: 'fri', at: '17:00' }`, `{ inDays: 1, at: '17:00' }` or `{ date: '11-19', at: '17:00' }`, resolved in the client's `timezone` so dates match the email's wording) plus optional `durationMins`, or `startsInHours`/`endsInHours` (relative to seed time, snapped to the half hour within 9:00–19:00 local), or `startsAt`, `history[]` and `activity[]` with `hoursOffset`, `reclassifiedHoursAgo`, `handoff` (`state`, `note`, `hoursOffset`), `unread`, `important`, `status`, `archived`. Participants are stored outside people first (client and assistant last), because list views show `participants[0]` as the sender. Reset clears `Client.brief`. The string `"client"` in place of a person means the thread's client, so onboarding sync can reuse Priya's threads for any new client.
- `scenarios.json`: ≥ 5 scenarios (new investor email → client; reply on existing "dinner reschedule" thread that now asks for Priya's personal choice → reclassify assistant→client; newsletter → none; ambiguous → review; meeting request → assistant + entity).

## 9. Security & config (prototype‑appropriate)
- Env validated at boot: `MONGODB_URI`, `JWT_SECRET`, `CORS_ORIGIN`, `PORT`, `DEMO_MODE`, AI vars above, Google vars in §11 (all optional; real Gmail/Google sign-in turn off cleanly when missing).
- Client users can only access `/client/*` for their own `clientId`; assistants only their own clients. Enforce in middleware, not in controllers.
- Never log email bodies or API keys. Rate‑limit AI routes (30/min/user).
- `.env.example` committed, `.env` git‑ignored.

## 10. Deployment
- Server: Render (web service, `npm start`), health check `/health`, WebSockets enabled.
- DB: MongoDB Atlas free tier. Web: Vercel with `VITE_API_URL`/`VITE_SOCKET_URL`.
- On deploy with `DEMO_MODE=true`, run seed once; `/demo/reset` lets reviewers restore state.

## 11. Real Gmail + Sign in with Google (P1, ROADMAP Phase 6)
Goal: prove the integration is real (Aryan connects their own Gmail in the demo video) without making reviewers depend on it. The demo inbox stays the default path.

### 11.1 Why it's optional, not the default
`gmail.readonly` is a Google **restricted** scope. Until the app passes Google's verification + security assessment (weeks), only accounts listed as **test users** on the OAuth consent screen (max 100) can grant it; others get blocked or an "unverified app" screen. Reviewers won't be test users, so they must always be able to use the demo inbox. `openid email profile` (Sign in with Google) is not restricted and works for anyone.

### 11.2 Env
```
REAL_GMAIL=true                     # feature flag; false hides the button and disables the routes
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4000/api/oauth/google/callback   # one URI for login + gmail
WEB_URL=http://localhost:5173       # where the callback redirects back to
TOKEN_ENC_KEY=<32 random bytes, base64>   # encrypts refresh tokens
GMAIL_IMPORT_LIMIT=50               # threads imported on first connect
GMAIL_POLL_SECONDS=60
```
`/health` adds `gmail: true|false` and `googleLogin: true|false` so the FE knows which buttons to show.

### 11.3 Flow (both purposes share one callback)
1. FE calls `POST /accounts/gmail/start` (or navigates to `GET /auth/google/start` for login).
2. Server builds the Google URL with `access_type=offline`, `prompt=consent`, `include_granted_scopes=true`, scopes (`gmail.readonly` + `openid email` for gmail; `openid email profile` for login) and `state` = short-lived signed JWT `{ purpose, userId?, clientId?, nonce }` (10 min).
3. Google → `GET /api/oauth/google/callback`. Server verifies `state`, exchanges `code` (library: `googleapis` / `google-auth-library`).
   - `login`: find user by `googleId`, else by verified email, else create assistant user; issue our JWT; redirect `${WEB_URL}/auth/callback#token=…` (fragment so it never hits server logs).
   - `gmail`: create `EmailAccount { provider:'gmail', simulated:false, address, google:{…} }` on the chosen client (default: assistant's first client, created if none), store encrypted refresh token, redirect to onboarding sync step, start import in the background.
4. Errors map to `?error=` codes in §3.2a. `access_denied` with an unlisted account → `not_test_user` (FE explains the test-user limit and offers the demo inbox).

### 11.3a Only your own mailbox (D25)
- `gmail/start` sends `login_hint=<signed-in email>` so Google pre-selects the right account.
- The hint can be overridden in Google's picker, so the callback checks the returned account (`services/gmail/ownership.js`): Google sign-in users need the same Google `sub` (`user.googleId`); email/password users need a verified Google email equal to their Relay email. A mismatch revokes the grant and redirects with `?error=account_mismatch`. `gmail/complete` re-checks and answers `403 ACCOUNT_MISMATCH`.
- Connecting a client's or colleague's mailbox under your login is therefore not possible today; that would need its own invite flow where the mailbox owner signs in.

### 11.3b Switching from the demo inbox
- After Google sign-in, an assistant whose only accounts are demo ones (and `/health.gmail` is true) lands on `/onboarding?step=connect`, which offers "Switch to your Gmail" or "Keep the demo inbox".
- Settings › Accounts offers the same switch. When the real Gmail connects, `services/demo.service.js#clearDemoInbox` deletes that client's simulated accounts and their threads, messages, drafts and activity. Real Gmail data is never touched.

### 11.4 Import (`services/gmail/import.js`)
- `users.getProfile` → save `historyId`.
- `users.threads.list` (`labelIds=INBOX`, `maxResults=GMAIL_IMPORT_LIMIT`) → for each, `users.threads.get(format=full)`.
- Map with `services/gmail/mapper.js` (pure, unit-tested):
  - headers `From/To/Cc/Subject/Date` → Message fields; `internalDate` → `sentAt`.
  - body: first `text/plain` part; else `text/html` stripped to text; base64url decode; trim quoted replies (`On … wrote:`) for the prompt only; cap 20k chars.
  - `direction` = `outbound` if From equals the account address, else `inbound`.
  - Thread: `source:'gmail'`, `externalId`, `unread` from `UNREAD` label, `important` from `IMPORTANT`/`STARRED`, participants, `lastSender`.
- Upsert by `externalId` (idempotent: re-running never duplicates). Then `classifyThread` with concurrency 2 (Groq limits), emitting `sync:progress` like the simulated sync.

### 11.5 New mail (`services/gmail/poller.js`)
- `setInterval` every `GMAIL_POLL_SECONDS` over accounts with `simulated:false, status:'connected'` (single process is fine for the prototype). "Sync now" triggers one poll immediately.
- `users.history.list(startHistoryId, historyTypes=messageAdded)` → fetch changed threads → upsert → `classifyThread(emit:true)` for threads with a new inbound message (this gives the live Reclassified behaviour on real mail). Save new `historyId`.
- `404` (history too old) → re-import last 20 threads. `invalid_grant` (revoked) → account `status:'error'`, `error:'Reconnect Gmail'`.
- Push notifications via Pub/Sub are out of scope (needs a public topic + domain setup).

### 11.6 What stays local
Read-only scope means archive / read / important / done changes stay in Relay and are **not** written back to Gmail. Sending stays simulated (`gmail.send` is a separate restricted scope; consider only after the core demo is done). UI says so (DESIGN_SYSTEM §7).

### 11.7 Privacy & safety
- Real email content is sent to the configured AI provider (Groq). The connect screen says this in one line.
- Never log bodies, tokens or codes. Refresh token encrypted at rest; access tokens kept in memory only.
- Disconnect = `oauth2.revokeToken` + delete `google` sub-document; imported threads are kept unless the user picks "Remove imported mail".
- Tests: mapper (multipart, html-only, base64url, outbound detection), state verification, dedupe. Mock the Google client; never call Google in CI.

