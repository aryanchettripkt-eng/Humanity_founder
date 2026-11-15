# Frontend Spec (`/web`)

> React SPA. Read [DESIGN_SYSTEM](./DESIGN_SYSTEM.md) for visuals and [BACKEND](./BACKEND.md) §3 for the API contract. **Do not invent endpoints** — if you need one, add it to BACKEND.md first.

## 1. Stack (pinned decisions — change only via `docs/DECISIONS.md`)
| Concern | Choice |
|---|---|
| Build | Vite + React 18 + **TypeScript** (strict) |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix) + `clsx` / `tailwind-merge` (`cn()`) |
| Icons | lucide-react |
| Routing | react-router-dom v6 (data routers not required) |
| Server state | TanStack Query v5 |
| UI state | Zustand (small stores only; see §5) |
| Forms | react-hook-form + zod |
| Realtime | socket.io-client |
| Motion | framer-motion |
| Toasts | sonner |
| Dates | date-fns |
| HTTP | fetch wrapper in `lib/api.ts` (no axios) |

> Why `/web` and not `/client`: "client" is a product role (the PA's client). Using it as a folder name causes confusion. Same reason the API folder is `/server`.

## 2. Folder structure
```
web/
  index.html
  src/
    main.tsx                 # providers: QueryClient, Router, Theme, Toaster, Socket
    app/
      router.tsx             # all routes (single source of truth)
      providers.tsx
      layouts/
        AssistantLayout.tsx  # sidebar + topbar + outlet (responsive)
        ClientLayout.tsx     # minimal header + outlet
        AuthLayout.tsx
    pages/                   # thin route components; compose features
      LandingPage.tsx  LoginPage.tsx  SignupPage.tsx  OnboardingPage.tsx
      TodayPage.tsx  InboxPage.tsx  SettingsAccountsPage.tsx
      ClientHomePage.tsx  ClientThreadPage.tsx  NotFoundPage.tsx
    features/                # one folder per domain; owns its hooks + components
      landing/ auth/ onboarding/ today/ inbox/ thread/ composer/ ai/ client-view/ accounts/ activity/ command/
        components/  hooks/  api.ts  types.ts (if domain-specific)
    components/
      ui/                    # shadcn generated — do not hand-edit except via shadcn CLI
      common/                # OwnerPill, EmptyState, ErrorState, KbdHint, NotchedCard, PillBar, ChipRow, ...
      grove/                 # AppFrame, HeroBand, TopNav, BottomTabBar, GlassCard, GlassTabs, GlassStat, GlassList, StackedBars, FilterBar, ThreadCard, ThreadListRow, StatBox, Sparkline, DeltaChip, Avatar, AvatarTile, models.ts
      workspace/             # Transitional for LandingPage until G9.1b (NavRail & MobileTabBar deleted in G9.1)
    lib/
      api.ts                 # fetch wrapper, auth header, error normalisation
      socket.ts              # singleton socket + useSocketEvent hook
      queryKeys.ts           # ALL query keys live here
      owners.ts              # OWNER_META (labels, colors, icons) — single source
      segments.ts            # SEGMENTS config (id, label, icon, filter)
      format.ts              # dates, names, initials
      utils.ts               # cn()
    stores/
      ui.ts                  # sidebar collapsed, aiPanel open, density, theme
      command.ts             # palette open state
    types/
      api.ts                 # mirrors BACKEND.md §3/§4 shapes — keep in sync
    styles/globals.css
```

**Ownership hint for agents:** features are the unit of work. One agent works on one feature folder at a time (see AGENTS.md).

## 3. Routes
| Path | Page | Auth | Notes |
|---|---|---|---|
| `/` | Landing / redirect | – | shows `LandingPage` (anon); redirects signed-in users → `/app/today` (assistant) or `/c` (client) |
| `/welcome` | Landing (signed-in) | – | always renders `LandingPage` for signed-in users wanting to view the marketing page |
| `/login`, `/signup` | Login/Signup | anon | demo buttons call `POST /api/auth/demo`; "Continue with Google" navigates to `${API}/auth/google/start` (shown only if `/health` says `googleLogin:true`) |
| `/auth/callback` | AuthCallback | anon | reads `#token=` (or `?error=`), stores token, clears the hash, routes by role. P1 |
| `/onboarding` | Onboarding | assistant | step via `?step=welcome|connect|sync`; after real Gmail OAuth the server lands here with `&accountId=` or `&error=` (`not_test_user`, `access_denied`, …) |
| `/app/today` | Today | assistant | |
| `/app/inbox/:segment?/:threadId?` | Inbox | assistant | default segment `inbox`. Mobile: threadId present → full‑screen thread |
| `/app/settings/accounts` | Accounts | assistant | |
| `/c` | Client home | client (or assistant w/ `?preview=1`) | `?preview=1` lets assistants inspect a read-only preview of the client queue |
| `/c/thread/:threadId` | Client read view | client | read‑only |
| `*` | 404 | – | |

Query params on Inbox: `q` (search), `f` (comma filters: `unread,important,dated`), `account`, `client` (active client id for multi‑client assistants).

Route guards: `RequireAuth role="assistant"|"client"`. Assistant without any connected account → redirect to `/onboarding?step=connect`.

## 4. Data fetching rules
- All server calls go through `features/*/api.ts` functions that call `lib/api.ts`. Components never call `fetch` directly.
- Query keys only from `lib/queryKeys.ts`, e.g.:
  ```ts
  qk.threads.list({ segment, q, filters, clientId })
  qk.threads.detail(id)
  qk.dashboard.summary(clientId)
  qk.client.queue()
  qk.accounts.all()
  qk.activity.list(clientId)
  ```
- **Optimistic updates** for: owner change, important, unread, archive, done, client actions. Always provide rollback + error toast, and an **Undo** action on the success toast (calls the inverse mutation).
- Realtime: `lib/socket.ts` listens to server events (BACKEND §7) and **invalidates or patches** queries. Never keep a second copy of server data in Zustand.
- Stale times: lists 30s, detail 60s, dashboard 30s; refetch on window focus on.

## 5. State boundaries
| Kind | Where |
|---|---|
| Server data (threads, counts, drafts…) | TanStack Query only |
| Navigation state (segment, selected thread, search, filters) | URL |
| Ephemeral UI (sidebar collapsed, AI panel open, density, theme, palette open) | Zustand, persisted to localStorage where sensible |
| Form state | react-hook-form |

## 6. Conventions
- Components: PascalCase files, one component per file, named exports. Hooks: `useXxx.ts`.
- Props typed with `type XxxProps = {...}`. No `any`. API types imported from `types/api.ts`.
- Styling: Tailwind utility classes + `cn()`. No inline styles, no CSS modules, no hex values in TSX.
- Owner/segment visuals only via `OWNER_META` / `SEGMENTS`.
- Every component that fetches renders `<Skeleton>`, `<EmptyState>`, `<ErrorState>` branches.
- Accessibility: interactive elements are `<button>`/`<a>`; icons‑only buttons need `aria-label` + tooltip with `KbdHint`.
- Keyboard shortcuts registered in one place: `features/command/useShortcuts.ts`.
- Env: `VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_DEMO_MODE=true` (shows Simulate button + demo labels). Whether real Gmail / Google login buttons show comes from `GET /health` (`gmail`, `googleLogin`), not from a FE env var.
- Socket events can arrive twice (assistant is in two rooms, BACKEND §7). Handlers must be idempotent: patch by id, set absolute progress values, never increment.
- Client view (`/c`) refetches `/client/queue` on window focus and every 60s, because a thread moved away from the client by AI isn't pushed to the client socket.
- Lint/format: ESLint (typescript-eslint, react-hooks) + Prettier (2 spaces, single quotes, semi, width 100). Run `npm run lint && npm run typecheck` before committing.

## 7. Screen composition (what each page uses)
- **LandingPage**: `AppTopBar` · `WorkspaceHeader` · `WorkspaceGrid` (`PersonCard`, `TaskCard`, `FocusPanel` mapped from `sampleData.ts`) · `HowItWorks` · `FeatureStrip` · `LandingFooter`.
- **TodayPage**: `AppFrame` + `BottomTabBar` (in `AssistantLayout`) · `HeroBand` (`AssistantTopNav`, greeting + date chip + 1-line brief w/ `more`, `StackedBars` "This week", `GlassStat×2` For you / For Priya, `GlassList` "Needs your call" / "Next up") · `FilterBar` (URL-synced + all-filters sheet + pager) · `ThreadCard×4` · `ThreadListRow×5` ("Recently sorted").
- **InboxPage**: `SegmentNav` (in layout) · `ThreadList` (+ search/filter bar) · `ThreadView` (`ThreadHeader`, `MessageItem[]`, `DraftComposer`) · `AIPanel`.
- **ClientHomePage**: greeting, count, `ClientCard[]` with AnimatePresence, all‑caught‑up `EmptyState`.
- **OnboardingPage**: `Stepper`, `ConnectProviderCard×2`, `SimulatedOAuthModal`, `SyncProgress` (driven by `sync:progress` socket events). Gmail card has two actions: primary **Use demo inbox** (simulated) and secondary **Connect real Gmail (beta)** (when enabled). Handles `?error=` from the OAuth redirect with an inline `ErrorState` + "Use demo inbox instead".
- **SettingsAccountsPage**: list accounts with `SourceBadge` (Live / Demo), status, last synced, Sync now, Disconnect; "Connect real Gmail" button when enabled.

## 8. Testing (light, prototype‑level)
- Vitest + Testing Library for `OwnerPill`, `OwnerPopover`, `ThreadRow`, `ClientCard`, and query‑key/optimistic logic.
- Manual QA checklist = PRD §8 acceptance criteria at 375 / 768 / 1440.
