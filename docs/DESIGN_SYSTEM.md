# Design System

> **2026-11-15 — Design v2 (D18):** colours, layout, materials and components are now defined in **[DESIGN_V2.md](./DESIGN_V2.md)**, which wins wherever this file disagrees (§2 palette, §4 radius/elevation, §6 component list, §8 layout, §11). Principles (§1), motion basics (§5), copy (§7) and accessibility (§9) still apply.

> UI/UX is the #1 evaluation criterion. **Every UI change must follow this file.** If you need a new token or component, add it here first (see AGENTS.md §4), then build it.
> Stack: Tailwind CSS + shadcn/ui (Radix) + lucide-react icons + Framer Motion.

---

## 1. Principles (apply to every screen)
1. **Calm over clever** — zinc neutrals, hairline borders, generous whitespace. Color = meaning, never decoration.
2. **Action first** — the first thing on a screen is what needs doing.
3. **AI is humble** — AI output always shows *why*, a confidence cue, and an undo/override.
4. **One family, two densities** — Assistant view: compact, 3 panes. Client view: airy, one column, big tap targets.
5. **Fast feedback** — every click gives feedback in < 100ms (optimistic UI, pressed states, toasts).

## 2. Color tokens

Defined as CSS variables in `web/src/styles/globals.css` (shadcn convention, HSL) and mapped in `tailwind.config`. **Never hardcode hex in components** — use the semantic classes.

### 2.1 Base (light / dark)
| Token | Light | Dark | Use |
|---|---|---|---|
| `--background` | `#E4E4E7` (zinc‑200) | `#09090B` (zinc‑950) | app canvas |
| `--surface` | `#FFFFFF` | `#18181B` (zinc‑900) | elevated panels, inputs |
| `--card` | `#FFFFFF` | `#18181B` (zinc‑900) | cards, popovers |
| `--border` | `#D4D4D8` (zinc‑300) | `#27272A` (zinc‑800) | hairlines (1px) |
| `--foreground` | `#0B0B0C` (ink) | `#FAFAFA` | primary text |
| `--muted-foreground` | `#585860` | `#A1A1AA` (zinc‑400) | secondary text, timestamps (AA) |
| `--primary` (brand) | `#0B0B0C` (ink) | `#C6F36B` (lime) | primary buttons, active nav |
| `--primary-foreground` | `#FAFAFA` | `#0B0B0C` (ink) | text on primary |
| `--accent-lime` | `#C6F36B` | `#C6F36B` | highlight cards, schedule track, mobile active pill |
| `--accent-lime-foreground` | `#0B0B0C` | `#0B0B0C` | text on lime |
| `--ink` | `#0B0B0C` | `#18181B` | dark summary cards, pill bars |
| `--ink-foreground` | `#FAFAFA` | `#FAFAFA` | text on ink |
| `--ring` | `#0B0B0C` (ink) | `#C6F36B` (lime) | focus rings (2px) |
| `--success` | `#16A34A` | `#4ADE80` | sent, synced |
| `--warning` | `#D97706` | `#FBBF24` | sync slow (don't confuse with client — use icon) |
| `--destructive` | `#DC2626` | `#F87171` | errors, disconnect |

### 2.2 Owner colors (the core visual language — identical everywhere)
| Owner | Label | Text | Background (pill) | Border | Icon (lucide) |
|---|---|---|---|---|---|
| `assistant` | Assistant | sky‑800 / dark sky‑300 | sky‑50 / sky‑500@15% | sky‑200 / sky‑500@30% | `UserRoundCheck` |
| `client` | Client | amber‑900 / dark amber‑300 | amber‑50 / amber‑500@15% | amber‑200 / amber‑500@30% | `Crown` |
| `none` | No reply | slate‑700 / dark slate‑300 | slate‑100 / slate‑500@15% | slate‑300 / slate‑500@30% | `BellOff` |
| `review` | Needs review | rose‑800 / dark rose‑300 | rose‑50 / rose‑500@15% | **dashed** rose‑300 / rose‑500@40% | `CircleHelp` |

Exported once from `web/src/lib/owners.ts` as `OWNER_META` — components must read from it, never redefine.

Category icons (muted, no color): meeting `CalendarDays`, action `CircleAlert`, update `Info`, newsletter `Newspaper`, finance `Receipt`, legal `Scale`, personal `Heart`, general `Mail`.

### 2.3 ~~Landing theme (`.theme-landing`)~~ (Superseded by D13)
Removed in R1: the public landing page and the signed-in app now share the same `:root` and `.dark` tokens in §2.1.

## 3. Typography
- Display font (D16): **Urbanist** via `@fontsource-variable/urbanist` for page titles, section titles, stat numbers and card names; body stays Inter.
- Font: **Inter** (variable, `font-feature-settings: "cv11","ss01"`), fallback system‑ui. Mono: JetBrains Mono for keyboard hints only.
- Scale (px / line-height / weight):

| Token | Size | LH | Weight | Use |
|---|---|---|---|---|
| `text-xs` | 12 | 16 | 500 | pills, meta, timestamps |
| `text-sm` | 13 | 18 | 400/500 | list rows, sidebar, body in dense views |
| `text-base` | 14 | 20 | 400 | email body, panels |
| `text-md` | 16 | 24 | 500 | client view body, section titles |
| `text-lg` | 20 | 28 | 600 | page titles |
| `text-xl` | 28 | 34 | 600 | stat numbers, client greeting |

- Numbers in tiles use `tabular-nums`. Max line length in email body: 72ch.
- Unread rows: sender + subject weight 600; read rows: 400 + muted subject.

## 4. Spacing, radius, elevation
- 4px grid. Common: 4, 8, 12, 16, 20, 24, 32, 48.
- Radius: `--radius: 10px` (inputs, pills, buttons use `rounded-full`), cards `24px` (`rounded-3xl`), icon buttons `40–44px` circles, modals `16px`.
- Elevation: borders by default; shadow only for floating layers: popover/menus `shadow-md`, modals/⌘K `shadow-xl`. No shadows on cards in lists.
- Layout widths: sidebar 240px (collapsed 64px), list pane 380px (min 320), detail flex, AI panel 320px (collapsible). Client view max‑width 560px centered.

## 5. Motion
- Durations: 150ms (hover, press), 200ms (popover, panel), 250ms (route/page, card exit). Easing `cubic-bezier(0.2, 0.8, 0.2, 1)` (ease‑out).
- Patterns: list row remove → height collapse + fade 200ms; client card handled → slide right + fade; new row → slide down + 1.2s soft indigo highlight; pill change → crossfade.
- Respect `prefers-reduced-motion`: disable transforms, keep opacity fades ≤ 100ms.

## 6. Components (build in `web/src/components`)

> **Reuse rule (D17):** every screen, including the landing page, is assembled from the shared components listed in [DESIGN_V2.md §8](./DESIGN_V2.md) (previously WORKSPACE_UX §8). Components take view models; pages only map data. If a screen needs a variation, add a prop to the shared component instead of copying it.

Each component must support the listed states. "✓" = required.

| Component | Purpose | Key props | States |
|---|---|---|---|
| `OwnerPill` | shows owner; clickable → `OwnerPopover` | `owner, source, confidence, size: sm/md, interactive` | default, hover, focus, loading (shimmer while classifying), disabled ✓ |
| `OwnerPopover` | change owner | `threadId, current, sender` | 4 options w/ shortcut 1–4, "Always for {sender}" checkbox, saving ✓ |
| `ConfidenceMeter` | 5‑dot or thin bar, + % on hover | `value 0–1` | low (<.7 rose), mid, high ✓ |
| `ThreadRow` | list item | `thread, selected, density` | unread, read, selected, hover, focused (kbd), reclassified chip, has‑date chip, important star ✓ |
| `ThreadList` | virtualised list | `segment, filters` | loading skeleton (8 rows), empty (per segment copy), error + retry, end of list ✓ |
| `ThreadHeader` | subject, participants, owner pill, actions | | ✓ |
| `MessageItem` | one email | `message, collapsed` | collapsed, expanded, outbound (subtle indigo left border) ✓ |
| `AIPanel` | summary, key points, dates, why, history | `thread` | loading (skeleton), AI unavailable (inline notice + Retry), suggestion banner ✓ |
| `DraftComposer` | AI draft editor | `threadId` | empty, generating (streaming dots), editing, confirm‑send, sending, sent ✓ |
| `StatTile` | number + label, clickable filter | `label, count, owner?, href` | loading, zero (muted), hover ✓ |
| `BriefCard` | AI morning brief | | loading, fallback text, refresh ✓ |
| `UpcomingRail` | extracted dates | | empty "No dates in the next 7 days" ✓ |
| `ActivityFeed` | client actions, reclassifications | | live item highlight, empty ✓ |
| `ReviewStrip` | quick‑assign low‑confidence threads | | empty hides strip ✓ |
| `CommandPalette` | ⌘K: search, navigate, ask AI | | no results, AI answering ✓ |
| `AskPanel` | AI Q&A with thread chips | | thinking, answer, error ✓ |
| `ClientCard` | client view card | `thread` | default, "You're on it", exiting, note input open ✓ |
| `ConnectProviderCard` | Gmail / Outlook | `provider, status, realAvailable` | idle, connecting, connected, error; Gmail shows primary "Use demo inbox" + secondary "Connect real Gmail (beta)" when `realAvailable` ✓ |
| `GoogleButton` | "Continue with Google" on login | | default, loading; follows Google's button branding guidelines (white, G logo, "Continue with Google") ✓ |
| `SourceBadge` | marks an account or thread source | `source: 'gmail'|'demo'` | *Live* (success dot) / *Demo* (muted) ✓ |
| `SimulatedOAuthModal` | fake consent screen | `provider` | ✓ |
| `SyncProgress` | steps w/ progress bar | | running, done, error + retry ✓ |
| `AccountStatusBadge` | sidebar footer | | connected (green dot), syncing (spinner), error (red) ✓ |
| `EmptyState` | icon + title + 1 line + optional action | | ✓ |
| `ErrorState` | friendly message + Retry | | ✓ |
| `Toast` | sonner; success / error / undo action | | ✓ |
| `OfflineBanner` | socket disconnected | | ✓ |
| `KbdHint` | `<kbd>` styled hints in tooltips | | ✓ |
| ~~`LandingTopBar`~~ | replaced by `AppTopBar` (`components/workspace`) | | |
| ~~`LandingHero`~~ | replaced by `WorkspaceHeader` (`components/workspace`) | | |
| `PillBar` | black/ink schedule pill bar with lime track (`components/common`) | `label, slots, nowPercent?, actionSlot?` | mobile compact, desktop full ✓ |
| `ChipRow` | `aria-pressed` filter pills (`components/common`) | `items, value, onChange` | active, inactive, keyboard focus ✓ |
| `NotchedCard` | rounded-3xl card with notched top-right action slot (`components/common`) | `tone: default/soft/lime, notch` | default, lime, interactive ✓ |
| `StatWithBadge` | large tabular stat + optional top-right badge (`components/common`) | `value, label, badge?, badgeTone?` | up (lime), down (rose), no badge, mobile stacked ✓ |
| `SectionHeader` | section title + underlined count + `aria-live` status (`components/common`) | `id, title, countLabel, liveText` | responsive, accessible ✓ |
| `AppTopBar` | shared workspace header + 48h `PillBar` + right actions (`components/workspace`) | `dateLabel, slots, scheduleActionSlot, actions` | landing + app ✓ |
| `NavRail` | 64px left icon rail (`components/workspace`) | `reviewCount, onOpenAsk` | Today, Inbox, Review, Client view, Ask, Settings ✓ |
| `MobileTabBar` | `<768px` floating bottom ink pill nav (`components/workspace`) | `reviewCount, onOpenAsk, onOpenMore` | ≥44px tap targets ✓ |
| `WorkspaceHeader` | greeting, uppercase title, primary CTA, 3 `StatWithBadge`s, 1-line brief (`components/workspace`) | `eyebrow, title, primaryLabel, stats, briefText` | landing + Today ✓ |
| `PersonCard` | shared reply/triage card (`components/workspace`) | `item: PersonCardModel, selected, onQuickAssign` | review 1/2/3 assign, landing + Today ✓ |
| `TaskCard` | shared task/date card (`components/workspace`) | `item: TaskCardModel, onStatusChange, onPrimaryAction` | lime next-up, status menu ✓ |
| `FocusPanel` | sticky dark summary panel (`components/workspace`) | `model: FocusPanelModel, onOpenThread, onChangeOwner` | PhonePreview, Timeline, KeyPoints, Why, Dates ✓ |
| `WorkspaceGrid` | shared 2-section grid + responsive `FocusPanel` (`components/workspace`) | `people, tasks, focusModel` | desktop sticky, tablet docked, mobile sheet ✓ |
| ~~`ReplyCard`~~ | replaced by `PersonCard` (`components/workspace`) | | |
| ~~`SummaryPanel`~~ | replaced by `FocusPanel` (`components/workspace`) | | |
| `FeatureStrip` | 4-card product capability strip | | responsive grid ✓ |
| `LandingFooter` | dark CTA band + dual demo login + simulated tooltip | `demoLoading, onDemoLogin` | loading, tooltip ✓ |

shadcn primitives to install: button, input, textarea, badge, card, dialog, sheet, popover, dropdown-menu, command, tooltip, tabs, scroll-area, separator, skeleton, avatar, checkbox, toggle-group, sonner.

## 7. Copy & tone
- Plain, warm, short. Sentence case everywhere. No exclamation marks except the success empty state.
- AI reasons: one sentence, starts with the evidence: *"Priya is asked directly to approve the budget."* not *"I think…"*.
- Client view addresses the client by first name and says "your assistant" or the assistant's first name.
- Empty states (examples): Assistant segment → "Nothing on your plate. Nice." · Client segment → "Nothing waiting on Priya." · Review → "AI is confident about everything right now." · Search → "No conversations match "{q}"."
- ~~Simulated features: small muted label "Simulated in prototype" with an `Info` tooltip~~ Superseded by D20: no prototype labels in the UI; product wording per DESIGN_V2 §6.8.
- Real Gmail copy:
  - Connect card helper: "Read-only. Your emails are analysed by AI to sort them. Nothing is sent or changed in Gmail."
  - Beta note: "Works for approved test accounts while Google reviews the app."
  - `not_test_user` error: "Google didn't allow this account yet. Real Gmail only works for approved test accounts during the beta." + button "Use the demo inbox instead".
  - Thread detail footer for Gmail threads: "Changes here stay in Relay" + "Open in Gmail" link.

## 8. Responsive rules
| Breakpoint | Width | Assistant layout | Navigation |
|---|---|---|---|
| Mobile | < 768 | 1 pane. List → tap → full‑screen thread (back button). AI panel becomes a collapsible section above messages. Composer is a bottom sheet. | Bottom tab bar: Today · Inbox · Review · Ask · More |
| Tablet | 768–1279 | 2 panes (list + detail). AI panel opens as right `Sheet`. Sidebar collapses to icons or drawer. | Icon sidebar / drawer |
| Desktop | ≥ 1280 | 3 panes: sidebar · list · detail (+ AI panel 320px, collapsible ≥ 1440 shown by default) | Full sidebar |

- Tap targets ≥ 44px on touch. Client view is designed at 375px first.
- No horizontal scroll at 320px. Long subjects truncate with ellipsis; full text in title attribute.
- Stat tiles: 4 columns desktop, 2×2 tablet/mobile.

## 9. Accessibility
- WCAG AA contrast for all text, including pills in both themes.
- Owner never conveyed by color alone: always icon + label (label may hide on `sm` rows but stays in `aria-label`).
- Full keyboard support: `j/k` navigate, `Enter` open, `Esc` close, `o` owner, `1–4` set owner in popover, `r` reply, `e` archive, `s` star, `u` unread, `d` done, `⌘K` palette, `?` help.
- Focus visible (`ring-2 ring-ring ring-offset-2`). Live regions announce toasts and reclassifications.

## 10. Screen checklist (what each screen must look like before it's "done")
- [ ] Login / signup with demo buttons
- [ ] Onboarding: welcome, connect, simulated OAuth modal, sync
- [ ] Today (desktop + mobile)
- [ ] Inbox 3‑pane with segments
- [ ] Thread detail + AI panel + composer
- [ ] Settings → Accounts
- [ ] Client view list, card states, read conversation, all‑caught‑up
- [ ] ⌘K palette + Ask AI
- [ ] Global states: loading, empty, error, offline, toast
- [ ] Dark mode pass (P1)
- [ ] Landing: public `/` workspace showcase (320 / 390 / 820 / 1440)

## 11. Workspace layout (D14–D17)
~~The layout ... follows WORKSPACE_UX.md~~ Superseded: the layout now follows **[DESIGN_V2.md](./DESIGN_V2.md)** (D18). Old text: the layout of every assistant screen, the client view and the landing page followed **[WORKSPACE_UX.md](./WORKSPACE_UX.md)**: an icon rail, the top bar with the schedule `PillBar`, the uppercase workspace header, person and task cards, and the dark floating `FocusPanel` with Priya's live phone preview. It wins over older layout notes in §4 and §8 where they disagree (sidebar 240px → `NavRail` 64px; segments → `ChipRow` in Inbox).
