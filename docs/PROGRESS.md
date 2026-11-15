# Progress Log

> Newest entry at the top. Every agent adds an entry at the end of every work session (format in AGENTS.md §6). Don't edit other agents' entries; reply by adding your own.

## Questions for Aryan
- [ ] Product name — "Relay" is a placeholder. Keep or rename?
- [x] AI provider for the deployed demo → **Groq** (D9). Gemini/Anthropic/mock still supported.
- [ ] Should agents commit directly to `main` for ROADMAP/PROGRESS updates, or always via branches?
- [ ] Real Gmail (Phase 6): which Google account owns the Cloud project, and which Gmail goes in the demo video? (G6.1)

## Open issues
- [ ] Sync events reach an assistant twice (in both `assistants:` and `user:` rooms). Harmless if FE handlers are idempotent (FRONTEND §6). Optional server fix: emit with `io.to(a).to(b)` so Socket.io dedupes. — owner: @gemini
- [ ] Client socket isn't told when AI moves a thread *away* from `client` without a handoff. FE mitigation: `/c` refetches on focus + every 60s (FRONTEND §6). — owner: @gemini
- [ ] Backend not yet run against a real MongoDB by Claude (sandbox can't download mongod); first full run is Aryan's local start. — owner: Aryan
- [ ] QA 1 · Inbox/Today/Settings · 390 + 820 · expected DESIGN_SYSTEM §8 ("More" tab on mobile, icon sidebar/drawer on tablet) · actual: sidebar hidden below 1280px with no replacement, so the client picker (Daniel) and the Assistant/Client/No reply/Waiting segments are unreachable. — owner: @gemini
- [ ] QA 2 · Today brief · all · actual "(scheduled for 07:39 UTC)": `brief.service.js` passes a raw Date in the prompt. Format in `client.timezone` and tell the model not to mention UTC. — owner: @gemini
- [ ] QA 3 · header + bottom tab bar · 320–390 · expected §8 tap targets ≥ 44px · actual 32–36px. — owner: @gemini
- [ ] QA 4 · header Simulate icon · 390 · expected §9 accessible label · actual none. — owner: @gemini
- [ ] QA 5 · ⌘K Ask · all · citations read "Thread #1/#2/#3"; show the subject instead. — owner: @gemini
- [ ] QA 6 · ⌘K · all · empty "SEGMENTS" heading shows with no items; hide empty groups. — owner: @gemini
- [ ] QA 7 · AI panel after sending a reply · all · shows "Why No reply · 54%" with the old AI reason; when `ownerSource` isn't `ai`, show the history entry instead. — owner: @gemini
- [ ] QA 8 · Settings → Accounts · all · "Use demo inbox" offered while the demo inbox is connected; page doesn't name the client. — owner: @gemini
- [ ] QA 9 · `/c` card · 375 dark · "I'll handle it" button barely visible against the card (§2 contrast). — owner: @gemini

## Handoffs needed
_None yet._

---

### 2026-11-16 00:00 · gemini · G9.1c-fixes review fixes
- Done: Fixed all 8 items from the G9.1c review on `gemini/G9.1c-fixes`:
  1. Hero contrast: added `--hero-scrim` (`<768px` full-width gradient scrim in `HeroBand`) and `--hero-text-shadow` (greeting `h1`) tokens in `:root` and `.dark`; wrapped `TodayPage` brief line in a `.glass`-token pill (`rounded-full px-4 py-2`).
  2. StatBox truncation: changed `StatBox` grid to `grid-cols-[1.1fr_0.9fr_1.1fr]`, shortened `Confidence` label to `CONF.` (`title="Confidence"` + `aria-label="Confidence"`), allowed 2-line wrapping on `Owner`, and set `.working-panel` padding to `32px` below `1600px` and `40px` at `1600px+`.
  3. Nav single-row (`768–1023`): set `TopNav` header `flex-nowrap`, hid client name text below `lg`, and added a glass `"Menu"` pill + `Dialog` sheet for `md..lg` (`768–1023`).
  4. Filters single-row (`<1024`): hid secondary filter dropdowns below `lg` (`hidden lg:block`), keeping only `Owner` + `"All filters"` circle button visible in one row.
  5. Offline banner: replaced the amber strip in `OfflineBanner` with a fixed top-center `.glass` toast pill (`top-4 md:top-20`, `role="status"`, `"You're offline. Changes will sync when you're back."`).
  6. Mobile background: removed `bg-fixed` from `AppFrame` and rendered the background and overlay as dedicated `fixed inset-0 -z-10` layers.
  7. Recently sorted on phones: moved `OwnerPill` under the subject line below `640px` (`sm:hidden` / `hidden sm:inline-flex`) in `ThreadListRow`.
  8. Chart bars: tightened `StackedBars` spacing (`p-3.5`, `gap-1`) and expanded SVG height (`h-40`, `maxH = 112`) so bars fill ~70% of the card height.
  - Restored the `2026-11-15 23:30` UX subtraction PROGRESS entry with a revert note for `8f7d12b`.
  - Round 2 fixes: made `TopNav` Menu sheet solid (`--panel-bg` / `--cta-bg`), added `--toast-bg` / `--toast-fg` and moved `OfflineBanner` to bottom-center (`bottom-[calc(env(safe-area-inset-bottom)+88px)] md:bottom-6`), extended hero scrim to `<1024px` (`lg:hidden`), added `--hero-pill-bg` (`rgba(0,0,0,0.38)`) with `rounded-2xl sm:rounded-full` and inline `more` for the brief pill, fixed `ThreadListRow` time `min-w-16 whitespace-nowrap`, aligned `StatBox` values with `min-h-[2lh]`, and rendered `CONF.` with `<abbr title="Confidence">`.
- Changed contracts: none.
- Next: Open PR for `gemini/G9.1c-fixes` and wait for Aryan's merge before starting `G9.2`.

### 2026-11-16 00:30 · claude · G9.1c review + docs to match the build
- Reviewed G9.1c on main @ bab156a: composition correct, Today matches target, lint/typecheck/tests green. 8 fixes listed in ROADMAP G9.1c-fixes (hero contrast, StatBox truncation, nav/filter wrap <1024, offline toast, iOS background, phone rows, chart height).
- DESIGN_V2 §1.0 rewritten for what was built; D22 supersedes D21. ROADMAP G9.2/G9.3 specs expanded.
- Process: 8f7d12b and bab156a were pushed to main directly and #25 to #28 merged unreviewed; 8f7d12b reverted the UX subtraction work and removed its PROGRESS entry. Please use PRs.

### 2026-11-15 23:30 · gemini · G9.1c UX subtraction and label polish
- Done: Applied targeted UX subtractions & label swaps on `gemini/G9.1c-themes`:
  - `ThreadCard`: replaced the 3-column `StatBox` (`OWNER`, `CONFIDENCE`, `NEXT DATE`) with a 1-line truncated email subject, removed the green CTA button, made the whole card clickable with top-right `↗`, and moved `OwnerPill` (`size="sm"`) next to `DeltaChip` in the footer.
  - Renamed `"For you"` → `"Assistant queue"` and `"For {client}"` → `"{client}'s desk"` in `owners.ts`, `mappers.ts`, `TodayPage.tsx`, and `StackedBars` legend.
  - Removed the duplicate far-right user avatar circle from `TopNav` and merged user info, theme toggle, Send test email, and Sign out into the client switcher menu.
  - Added a subtle dashed horizontal reference line at the top of `StackedBars` with the `maxTotal` scale label on the left.
  - Updated `mappers.test.ts` and `TodayPage.test.tsx`.
- Changed contracts: none.
- Reverted: This UX subtraction work was reverted in `8f7d12b` (merged to `main` in `bab156a`) at Aryan's request after local issues, restoring the `StatBox` + CTA pill `ThreadCard` and separate user menu.

### 2026-11-15 23:12 · gemini · G9.1c glass hero over full-bleed background
- Done: Updated `gemini/G9.1c-themes` to match the full-bleed background + smoky glass hero + floating working panel composition:
  - Placed `web/public/bg/app-bg.webp` (`cover`, `center`, `fixed`, `#1A1B19` fallback, `20%` dark overlay in `.dark` via `--canvas-overlay`).
  - Removed the outer card from `AppFrame` and made `HeroBand` fully transparent with `padding-inline: clamp(16px, 8.5vw, 160px)`, white hero text, and a soft radial black scrim behind greeting/summary/title for AA contrast.
  - Switched `.glass` and tokens to smoky glass (`bg-black/25`, `backdrop-blur-xl`, `1px white/20` border, `20px` radius, white text) across `TopNav`, `GlassTabs`, date chip, `StackedBars`, `GlassStat`, and `GlassList`; logo circle is `#B7E36A` with `#1E1F1C` icon.
  - Wired `StackedBars` to `OWNER_META.*.chartColor` (`#7FA14A`, `#A07E66`, `#8A8C86` at `85%`).
  - Added `.working-panel` (`#F6F6F3` light / `rgba(21,22,20,0.94)` dark, `32px` radius, `clamp(0px, 6.4vw, 120px)` side gap, `40px` padding, full-width `24px` top radius on phones) wrapping `TodayPage` and non-Today pages (`Inbox`, `Settings`) in `AssistantLayout`.
  - Updated `FilterBar` filter circle to outlined white/card with hairline border, `ThreadCard` (`#FFFFFF` / `#1D1E1B`, no shadow, `#4E7A1A` / `#8CC63F` CTA), and docs (`DESIGN_SYSTEM.md` §6, `FRONTEND.md` §7).
- Changed contracts: none.
- Next: Push to `gemini/G9.1c-themes` and update PR #25 title to `feat(grove): G9.1c glass hero over full-bleed background`.

### 2026-11-15 21:08 · gemini · G9.1c themes and canvas
- Done: Implemented DESIGN_V2 §1.0 (D21) light and dark themes + canvas backgrounds on `gemini/G9.1c-themes`:
  - Added `web/public/bg/grove-light.webp` and `web/public/bg/grove-dark.webp`.
  - Added all §1.0 theme tokens (`--canvas-image`, `--canvas-fallback`, `--frame-bg`, `--frame-border`, `--frame-shadow`, `--hero-fg`, `--hero-muted`, `--glass-*`, `--nav-*`, `--card-*`, `--statbox-bg`, `--chart-*`, `--avatar-tile-*`, `--cta-*`, `--delta-fg`) to `:root` and `.dark` in `globals.css`; updated `.glass` to read them.
  - Updated `AppFrame` to paint the themed canvas (`cover`, `center`, `fixed`) on `≥768px` with `80px` horizontal / `40px` vertical gap, `min-h-[calc(100vh-80px)]`, `rounded-[28px]`, no `1440px` cap, gap `0` + hidden canvas `<768px`, translucent `backdrop-blur-xl` frame, and removed the two decorative CSS circles.
  - Retired `/hero/grove.webp`, CSS gradient fallback, and dark overlay from `HeroBand`; hero and working area sit directly on the translucent frame in both themes.
  - Wired `TopNav`, `GlassTabs`, `GlassCard`, `GlassStat`, `GlassList`, `StackedBars`, `FilterBar`, `ThreadCard`, `StatBox`, `ThreadListRow`, `Avatar`/`AvatarTile`, `TodayPage`, and `AssistantLayout` to read tokens with zero JSX theme branching (including `--avatar-tile-radius` circle in light / rounded-square in dark, pastel vs muted chart stacks, `#3F7A1E` vs `#8CC63F` CTA, and AA contrast).
  - Updated `docs/DESIGN_SYSTEM.md` §6, `docs/FRONTEND.md` §7, and claimed `G9.1c` in `docs/ROADMAP.md`.
- Changed contracts: none.
- Next: Open PR `feat(grove): G9.1c themes and canvas` for Claude's review & Aryan's merge before starting `G9.1b`.

### 2026-11-15 21:00 · claude · D21 themes and canvas (docs)
- Done: Aryan chose gap C (80px on the sides, 40px top and bottom) and gave a light and a dark mockup plus their canvas images. Wrote DESIGN_V2 §1.0 and D21, and added G9.1c to ROADMAP before G9.1b. The hero photo is retired.
- Next: Gemini G9.1c (prompt in the project files at `prompts/gemini-G9.1c-themes.md`). Aryan copies `grove-light.webp` and `grove-dark.webp` into `web/public/bg/`.

### 2026-11-15 20:05 · claude · G9.1 review (PR #21) + filter order fix
- Done: Reviewed PR #21 three times against DESIGN_V2 §1–3, §8, §9 at 1440/820/390/320, light + dark (review and shots in the project files, `reviews/2026-11-15-G9.1-pr21-review.md`). All blockers are fixed in db73551. Fixed one regression from db73551 at Aryan's request: on ≥640px the Owner filter had moved to the end of the filter row (`order-1` vs `sm:order-none`); now Owner · other filters · filter circle. DESIGN_V2 §3.2 CTA labels amended to `Move up for Priya` / `Open in Priya's view` (D20).
- Changed contracts: none.
- Next: #21 merged before #22 landed, so this fix goes to main in a follow-up PR. Then Gemini G9.1b.
- Notes/risks: A real "Nudge Priya" needs a backend notification endpoint (new scope). Prototype wording remains in AIPanel, DraftComposer, ConnectProviderCard, OnboardingPage and SettingsAccountsPage, to be cleaned up in G9.2/G9.3.

### 2026-11-15 19:54 · gemini · G9.1 PR #21 re-review blocker fix
- Done: Fixed remaining D20 truthfulness blocker on client-owned Today card CTAs:
  - `ctaLabelForThread` + `TodayPage.handlePrimaryAction` now use `"Move up for {client}"` (sets `important: true`, toast `"Moved to the top of {client}'s queue"` with Undo) when `!important && handoff?.state !== 'client_handling'`, and `"Open in {client}'s view"` (navigates to `/c?preview=1`) otherwise. Removed fake `"Sent to {client}"` / `"Reminder sent to {client}"` toasts and `unread: true` patch.
  - Pinned `"All filters"` circle button next to `Owner` on phones in `FilterBar`, and showed `Skeleton` in `HeroBand` right column during `isError` instead of empty `"No upcoming dates extracted."`.
  - Updated `mappers.test.ts` and `TodayPage.test.tsx`.
- Changed contracts: none.
- Next: Push to `gemini/G9.1-grove-foundation` for PR #21 merge.

### 2026-11-15 19:50 · gemini · G9.1 PR #21 review fixes
- Done: Addressed all Blockers (1–5) and Should-fix/Nits (6–14) from PR #21 review:
  - Wired real Today card CTAs (`useCreateDraft`, `usePatchThread`, `useChangeOwner`) with pending state and Undo/toast feedback.
  - Removed fabricated sparkline data (`series: []` until real 14-day series exists), fixed singular/plural `deltaText` (`1 msg` / `N msgs`), formatted compact `nextDateLabel` (`Mon 6:30 pm`), and changed delta label to `since your last visit`.
  - Kept `HeroBand` + `AssistantTopNav` visible during loading/error states; added responsive `PAGE_SIZE` (`1/2/4`) + mobile touch swipe + `<768px` `"This week ▾"` chart toggle; replaced dark bar on non-Today pages in `AssistantLayout` with short `HeroBand` and `flex-1 min-h-0` `<main>` so `InboxPage` fills frame height.
  - Upgraded `TopNav` menus to Radix `Popover` (`role="menu"`, `Esc` + outside-click + `aria-expanded`), added `.glass` utility, `h-11`/`min-h-[44px]` tap targets across Grove controls, CSS-var `StackedBars` + `getOwnerShortLabel` (`For Priya` / `For client`), fixed `AvatarTile` dark mode contrast, `HeroBand` `fetchpriority="high"`, and untracked `tsconfig.tsbuildinfo`.
  - Set `G9.1` back to `[~]` in `docs/ROADMAP.md` until PR #21 is merged.
- Changed contracts: none.
- Next: Push to `gemini/G9.1-grove-foundation` to update PR #21; wait for Claude re-review & Aryan merge before starting `G9.1b`.

### 2026-11-15 19:33 · gemini · G9.1 Grove foundation, frame and Today
- Done:
  - Updated `:root` and `.dark` tokens in `web/src/styles/globals.css`, `web/tailwind.config.ts`, and `web/src/lib/owners.ts` to the Grove earthy palette (sage `#DDE1D5` canvas, `#F4F4F2` surface, olive `#5E9A18`/`#8CC63F`, forest `#2F5D3A`, clay `#8C7466`, linen `#E8E4DE`, terracotta `#C2562A`).
  - Built shared Grove components in `web/src/components/grove/`: `models.ts`, `Avatar.tsx` (`Avatar`, `AvatarTile`), `AppFrame.tsx`, `HeroBand.tsx` (with `/hero/grove.webp` + layered CSS radial fallback), `GlassCard.tsx`, `GlassTabs.tsx`, `GlassStat.tsx`, `GlassList.tsx`, `StackedBars.tsx`, `DeltaChip.tsx`, `Sparkline.tsx`, `StatBox.tsx`, `FilterBar.tsx` (dropdowns + all-filters dialog + pager), `ThreadCard.tsx`, `ThreadListRow.tsx`, `BottomTabBar.tsx`, `TopNav.tsx`, and `AssistantTopNav.tsx`.
  - Migrated `AssistantLayout.tsx` onto `AppFrame` + `BottomTabBar` + `AssistantTopNav` (with `"Send test email"` D20 copy in the user menu).
  - Rebuilt `TodayPage.tsx` and `features/today/mappers.ts` onto `HeroBand` (`StackedBars` "This week", `GlassStat×2`, `GlassList` "Needs your call" / "Next up"), URL-synced `FilterBar`, 4-column `ThreadCard` pager, and 5 `ThreadListRow`s ("Recently sorted").
  - Deleted `NavRail.tsx` and `MobileTabBar.tsx` (left `AppTopBar`, `WorkspaceGrid`, `WorkspaceHeader`, `PersonCard`, `TaskCard`, `FocusPanel` in `components/workspace/` solely so `LandingPage` stays working until G9.1b).
  - Updated `features/today/mappers.test.ts` and `pages/TodayPage.test.tsx`.
- Changed contracts: none (all client-side view models; weekly chart computed from thread list).
- Next: Open PR `feat(grove): G9.1 foundation, frame and Today` for Claude review; after Aryan merges it, start G9.1b.
- Notes/risks: `web/public/hero/grove.webp` is not yet committed, so `HeroBand` renders its layered moss/stone/mist CSS gradient fallback cleanly.

### 2026-11-15 19:20 · claude · Public site + product copy (docs)
- Done: DESIGN_V2 §6 rewritten as a 5-page public site (D19) with per-page functionality and a shared `tourStore`; §6.8 product copy with no prototype labels (D20). AGENTS §7, DESIGN_SYSTEM §7 and PRD AC14 amended (struck, not deleted).
- Next: Gemini G9.1, then G9.1b.

### 2026-11-15 19:10 · claude · Design v2 "Grove" spec (docs)
- Done: Aryan scrapped the lime workspace look and chose a new reference (sage canvas, nature-image hero with frosted glass, white working area with filter pills, pager and data cards). Wrote `docs/DESIGN_V2.md` mapping every slot to Relay features; D18 supersedes D13–D15 and WORKSPACE_UX; D16 font and D17 reuse rule kept. Phase 8 W8.2–W8.4 superseded by Phase 9 (G9.1–G9.4).
- Changed contracts: design only; Today's "This week" chart is computed client-side from the thread list (no new endpoint).
- Next: Gemini G9.1. Hero image: `web/public/hero/grove.webp` if Aryan adds one, otherwise the CSS fallback.

### 2026-11-15 18:45 · gemini · W8.1 shared workspace components, frame, Today & landing migration
- Done:
  - Added `@fontsource-variable/urbanist` as `font-display` in Tailwind (`SectionHeader`, `StatWithBadge`, `WorkspaceHeader`, card names).
  - Built shared workspace components in `web/src/components/workspace/` (`models.ts`, `Avatar.tsx`, `AppTopBar.tsx`, `NavRail.tsx`, `MobileTabBar.tsx`, `WorkspaceHeader.tsx`, `PersonCard.tsx`, `TaskCard.tsx`, `FocusPanel.tsx`, `WorkspaceGrid.tsx`).
  - Rebuilt `AssistantLayout` with `AppTopBar` (48h `PillBar` + 7-day popover, `⌘K`, 🔔 collapsed activity w/ lime unseen dot, client switcher `"Priya ▾"`, user avatar menu), 64px `NavRail`, `MobileTabBar` + `More` dialog, and floating demo `"+ Simulate"` pill.
  - Rebuilt `TodayPage` + `features/today/mappers.ts` onto `WorkspaceHeader` + `WorkspaceGrid` + 5 `ThreadRow`s, `lastSeenCounts` stat deltas in `useUiStore`, and `1/2/3` keyboard quick-assign on `review` cards.
  - Added `/welcome` route and `/c?preview=1` read-only assistant preview (rendered via assistant-accessible `/threads` when `role === 'assistant'` so `server/src/routes/client.routes.js` stays strictly `client`-only).
  - Migrated `LandingPage` + `sampleData.ts` onto the shared workspace components and `git rm`'d the replaced duplicates (`LandingTopBar`, `LandingHero`, `ReplyCard`, `TaskCard`, `SummaryPanel`, `TodaySummaryPanel`).
  - Fixed `server/src/services/brief.service.js` to format dates as `"Sun 8:00 pm"` in client timezone (never UTC/year) and sanitize ISO timestamps; bumped `PROMPT_VERSION` to `'v4'`.
  - Added unit tests (`features/today/mappers.test.ts`, `pages/TodayPage.test.tsx`) and updated `LandingPage.test.tsx`.
- Changed contracts: Added `/welcome` and `/c?preview=1` frontend routes; bumped `PROMPT_VERSION` to `'v4'` (`docs/BACKEND.md` §5, `docs/FRONTEND.md` §2/§3/§7, `docs/DESIGN_SYSTEM.md` §6).
- Next: Open PR `feat(workspace): W8.1 shared components, frame and Today` for Claude review, then start W8.2 (Inbox).
- Notes/risks: Chrome remote debugging (`DevToolsActivePort`) was unavailable in earlier checks, so live browser screenshots at 1440/820/390/320 were not captured in this session.

### 2026-11-15 18:35 · claude · Workspace UX spec (docs)
- Done: wrote `docs/WORKSPACE_UX.md`, a screen-by-screen layout mapping the reference to Relay features, approved by Aryan (D14 nav rail + chips, D15 Priya phone preview in the floating panel, D16 Urbanist display font, D17 build-once shared components). Linked from DESIGN_SYSTEM §6/§11, reuse rule added to AGENTS §7, Phase 8 tasks W8.1–W8.4 added.
- Audits behind it: `reviews/2026-11-15-site-audit.md` (project files).
- Changed contracts: design only. No API changes; the brief prompt must format dates in the client's timezone (live brief still prints UTC).
- Next: Gemini W8.1.

### 2026-11-15 18:14 · gemini · R1 lime workspace tokens, shell and Today
- Done:
  - Updated `:root` and `.dark` tokens in `web/src/styles/globals.css`, `web/tailwind.config.ts`, `docs/DESIGN_SYSTEM.md`, and `docs/DECISIONS.md` (D13): zinc-200 / zinc-950 canvas, white / zinc-900 cards, ink / lime primary, sky `assistant` owner color (`web/src/lib/owners.ts`), and removed `.theme-landing`.
  - Moved shared primitives into `web/src/components/common/` (`PillBar`, `ChipRow`, `NotchedCard`, `StatWithBadge`, `SectionHeader`) and updated `LandingPage` to use them.
  - Restyled `AssistantLayout.tsx`: canvas sidebar with ink/lime active pill, pill client switcher, pill search trigger, black/lime Simulate button, circular theme/settings buttons, and floating mobile ink pill tab bar with lime active state.
  - Rebuilt `TodayPage.tsx` (`web/src/features/today/mappers.ts`, `TodaySummaryPanel.tsx`, `docs/FRONTEND.md` §7) as an app page with time-of-day greeting, `PillBar` in `client.timezone` (`formatUpcomingDate` updated in `web/src/lib/format.ts`), 3 real `StatWithBadge` counts, `"Needs your call"` review `NotchedCard`s, `"Your day"` tasks with lime highlight + `ChipRow`, collapsed `Activity` + dark summary panel, and last 5 `ThreadRow`s.
- Changed contracts: none.
- Next: review R0 (`gemini/R0-merge-q52`) and R1 (`gemini/R1-lime-shell-today`) PRs, then proceed to R2.

### 2026-11-15 17:53 · gemini · L7.1 full-bleed landing + replace TodayPage with lime workspace
- Done:
  - Extended `LandingPage` edge-to-edge (`w-full`, removed outer grey frame and `max-w-[1400px]` box) and stretched `LandingTopBar` schedule bar across wide screens.
  - Replaced the old `TodayPage` UI (`/app/today`) with the new lime-workspace layout powered by live `useDashboard` data (`web/src/features/today/mappers.ts`, `TodaySummaryPanel.tsx`, and `TodayPage.tsx`), preserving Morning Brief + refresh, owner counts, Quick Review 1-click owner assignment, Recent conversations (`ReplyCard`), Upcoming dates, Follow-up nudges (`TaskCard`), and Activity.
- Changed contracts: none.
- Next: review on `gemini/L7.1-landing-page` and merge PR.

### 2026-11-15 17:47 · gemini · L7.1 landing page audit fixes (P1 + P2 + a11y)
- Done:
  - P1 #1 (`StatWithDelta`): absolute top-right delta badge on the number wrapper; stacked label under number below `sm` so 320/375/390 stats never overlap.
  - P1 #2 (`ReplyCard`, `TaskCard`): `w-full flex-1` on `<article>` to fill grid cells; fixed two-row footer pinned with `mt-auto` on `ReplyCard`.
  - P1 #3 (`LandingPage`): removes `.dark` from `<html>` on mount and restores on unmount so `OWNER_META` pills and portalled tooltips always render light.
  - P1 #4: removed fake header bell, task-card bell, and status dropdown chevron; made decorative search/sliders non-interactive `<span>`s; labelled real demo triggers with `"Opens the live demo"` tooltips.
  - P1 #5 (`SummaryPanel`): `/c` preview only renders when `owner === 'client'`; shows owner-specific preview for `assistant`, `none`, and `review` with per-thread timelines.
  - P1 #6: dynamic filtered counts via `SectionHeader`, fixed `task-3` tags (`waiting`, `urgent`), added `THREAD_EMPTY_COPY` / `TASK_EMPTY_COPY` empty states.
  - P1 #7 (`LandingTopBar`): `<section aria-label>`, bold time + short title in `flex-1` slots (no truncation at 1440), absolute `54%` `"now"` needle.
  - P2 + a11y + refactors: added `--landing-card`, `--landing-card-soft`, `--landing-line`, `--landing-muted`, `--landing-ink-surface`, `--landing-ink-line`, `--landing-ink-muted`, `--landing-delta-down-foreground`, and `shadow-landing`; replaced raw palette classes; extracted `useDemoLogin()` (`features/auth/useDemoLogin.ts`) and `SectionHeader`; added scroll-spy on anchor rail, `82%` mobile carousel peek, `44px` tap targets, `12px` minimum text, `aria-live="polite"`, and 6 tests in `LandingPage.test.tsx`.
- Changed contracts: none.
- Next: push `gemini/L7.1-landing-page` and open PR after visual verification.

### 2026-11-15 17:30 · gemini · L7.1 Public landing page
- Done:
  - Added `.theme-landing` HSL tokens in `web/src/styles/globals.css` and mapped `landing.*` colors in `web/tailwind.config.ts` (app indigo palette untouched).
  - Built `web/src/features/landing/` (`sampleData.ts`, `LandingTopBar`, `LandingHero`, `StatWithDelta`, `FilterChips`, `ReplyCard`, `TaskCard`, `SummaryPanel`, `FeatureStrip`, `LandingFooter`) and `web/src/pages/LandingPage.tsx`.
  - Updated `RootRedirect` in `web/src/app/router.tsx` (`!token` renders lazy `LandingPage` instead of redirecting to `/login`; signed-in redirect unchanged).
  - Added `web/src/pages/LandingPage.test.tsx` and updated `docs/DESIGN_SYSTEM.md`, `docs/FRONTEND.md`, and `docs/ROADMAP.md`.
- Changed contracts: none (reuses `demoLoginApi` only).
- Next: manual visual check in Chrome at 1440/820/390/320 (Chrome remote debugging was unavailable in this session) and merge `gemini/L7.1-landing-page` -> `main`.

### 2026-11-15 04:15 · claude · Q5.1 QA pass + seed polish
- Done: QA pass on the live site at 1920 / 820 / 390 / 375 / 320 as Alex and Priya; 9 findings for Gemini under *Open issues* (full report with AC results in `reviews/2026-11-15-qa-pass.md` in project files). Fixed my own: seed entities use `when` (weekday/date in the client's timezone) so dates match the emails; relative times snap to :00/:30 in working hours; outside sender listed first; Reset clears `Client.brief`. Prompt v3 date fix + required `clientReason` are on PR #14.
- Changed contracts: seed item format gains `entities[].when` / `durationMins` (BACKEND §8). No API changes.
- Next: Gemini Q5.2 fix list; then I re-run AC2, AC5, AC7, AC9, AC11 (Q5.3).

### 2026-11-15 03:58 · gemini · Q5.2 UX & polish fixes (1–9)
- Done:
  - #1 Mobile/tablet navigation: added tablet icon sidebar (`md:flex lg:hidden`), mobile "More" tab (`md:hidden`) and shared drawer (`Dialog`) with client switcher + all segments + sign out in `AssistantLayout.tsx`.
  - #2 Brief UTC leak: formatted `u.startsAt` in `client.timezone` with `Intl.DateTimeFormat` and instructed the brief prompt never to mention UTC or timezones (`server/src/services/brief.service.js`).
  - #3 Tap targets: raised mobile bottom tabs and mobile/tablet header buttons (`Simulate email`, theme toggle, settings) to `>= 44px` (`h-11 min-w-[44px]`).
  - #4 Simulate button label: added `aria-label="Simulate email"` and `title="Simulate email"`.
  - #5 Ask citations: `askInbox` now returns `threads: [{ id, subject }]` and `AskPanel` renders the truncated thread subject on citation chips.
  - #6 Empty SEGMENTS heading: `CommandPalette` hides the `Segments` group when `filteredSegments.length === 0`.
  - #7 Non-AI owner reason: `AIPanel` hides `ConfidenceMeter` and shows the latest history reason (or source fallback) when `ownerSource !== 'ai'`.
  - #8 Settings → Accounts: titled `<FirstName>'s accounts` and hid `Use demo inbox` when a simulated Gmail account is already connected (`SettingsAccountsPage.tsx`, `ConnectProviderCard.tsx`).
  - #9 Client card dark-mode contrast: switched `"I'll handle it"` to primary `variant="default"` and added crisp borders on secondary/outline buttons (`ClientHomePage.tsx`).
- Changed contracts: `POST /api/ai/ask` response adds `threads: [{ id, subject }]` alongside `threadIds`.
- Next: merge `gemini/Q5.2-ux-fixes` -> `main`.

### 2026-11-15 04:00 · claude · Q5.5 README
- Done: README rewritten: live links, one-click demo tour, how the AI works, real vs simulated (matches PRD §11), architecture diagram, run locally, env vars, security notes, limitations. Marked Q5.4 (deploy) done, since it's live on Vercel + Render + Atlas.
- Changed contracts: none.
- Next: Q5.1/Q5.3 QA pass on the live site.

### 2026-11-15 03:50 · claude · B4.5 few-shot corrections, B1.7 reviewed
- Done: classification prompt now includes up to 5 recent threads whose owner was set by the assistant (manual change) or the client (hand-off) as few-shot examples (`formatCorrections` / `loadRecentCorrections` in `classification.service.js`). Loading them never blocks classification. B1.7 (pipeline written by Gemini) reviewed across the Phase 6 and audit passes and marked done.
- Also (v3): message times in the prompt are now shown in the client's timezone with the weekday (`formatLocalStamp`), plus a rule to resolve "by Friday" from the message's own date, and `clientReason` is now required for client-owned threads (a live simulated email reached Priya's view with no "Why you" line). Seen live: a Sat 22:03 UTC email (Sunday morning in IST) saying "Friday 5 PM" was saved as Sun Nov 22.
- Changed contracts: `PROMPT_VERSION` v1 → v3 (user prompt gains a "Recent corrections" block and local message times). No API or model changes.
- Next: Q5.5 README, then Q5.1/Q5.3 QA pass on the live site.


### 2026-11-15 03:20 · gemini · Audit fixes (1–10)
- Done:
  - #1 Classification date/timezone: added `Client.timezone` (default `Asia/Kolkata`), passed weekday + next 7 days + timezone into `buildClassificationSystemPrompt`, and requested ISO-8601 dates with offset.
  - #2 Account switch safety: added `activeClientUserId` to `useUiStore`; `useMe` resets `activeClientId` if user changes or client is invalid, `useLogout` clears it, and `AssistantLayout` validates against `me.clients`.
  - #3 Cached AI morning brief: added `Client.brief` (`{ text, generatedAt, fallback }`), `getDashboardBrief` returns cached AI brief if `< 2h` old or triggers one background refresh, and `postBriefRefresh` updates cache.
  - #4 Preserve owner on AI failure: `classifyThread` only falls back to `owner: 'review'` on `isFirstClassification`.
  - #5 Groq rate limits & cancellation: `Groq` client uses `maxRetries: 0` + `timeout`, `withTimeout` passes `AbortSignal`, `callWithBackoff` honours `retry-after-ms`/`retry-after`, and `draft.service.js` trims quoted replies + caps message bodies at 2,000 chars.
  - #6 Poller retries & sync events: added `Thread.aiAttempts` (poller retries `pending`/`failed` up to 3 attempts) and `pollGmailAccount` emits `sync:done` only when threads changed or on manual sync.
  - #7 Two-step Gmail connect: `/oauth/google/callback` redirects with a 5-min one-time `connect` token instead of creating `EmailAccount` directly; `POST /accounts/gmail/complete` verifies `req.user.id === payload.userId` before saving & importing.
  - #8 Production `JWT_SECRET` guard: `loadEnv` throws if `NODE_ENV === 'production'` and `JWT_SECRET` is the default dev string.
  - #9 Demo lockdown: `/demo/simulate-email` and `/demo/reset` require `alex@example.com` (and simulated account for simulate-email); `Simulate email` button in `AssistantLayout` hidden for non-demo users.
  - #10 Rate limiting & `trust proxy`: `app.set('trust proxy', 1)`, shared `aiLimiter` applied to `reclassify`, `drafts`, `simulate-email`, and client `note`, and `authLimiter` (10/min) applied to `/auth/login` and `/auth/signup`.
- Changed contracts: added `POST /api/accounts/gmail/complete { code }` for two-step Gmail OAuth handoff.
- Next: merge `gemini/audit-fixes` -> `main`.

### 2026-11-15 03:04 · gemini · Fast Gmail classification & pending thread retry
- Done:
  - Gmail `import.js` and `poller.js` now call `classifyThread(..., { fast: true })` so they use `GROQ_FAST_MODEL` (`openai/gpt-oss-20b`).
  - `server/src/ai/providers/groq.js` now passes `reasoning_effort: 'low'` for `openai/gpt-oss-*` models.
  - Raised default `AI_TIMEOUT_MS` to `30000` in `server/src/config/env.js` and `.env.example`.
  - `pollGmailAccount` now retries up to 5 `pending` or `failed` threads (oldest first) on each poll tick.
- Changed contracts: none.
- Next: merge `gemini/gmail-fast-retry` -> `main`.

### 2026-11-15 02:52 · gemini · Gmail sync concurrency lock, quota retry, early historyId
- Done:
  - Added in-memory `activeSyncAccounts` lock (`isAccountSyncing` / `tryLockAccount` / `unlockAccount`) in `server/src/services/gmail/oauth.js` and wired it into `importGmailAccount`, `pollGmailAccount`, and `POST /accounts/:id/sync`.
  - Saved `google.historyId` from `users.getProfile` immediately at the start of `importGmailAccount` so interrupted imports don't cause the poller to re-import.
  - Added `callGmailWithRetry` (1s, 2s, 4s; max 4 tries) for Gmail `429` / `403 rateLimitExceeded` / `"Quota exceeded"` and `100ms` pauses between `threads.get` calls in `import.js` and `poller.js`.
  - Lowered default `GMAIL_IMPORT_LIMIT` to `20` in `server/src/config/env.js` and `.env.example`, and added retry unit test in `server/tests/gmail.test.js` (26/26 server tests pass).
- Changed contracts: none.
- Next: merge `gemini/gmail-rate-limit` -> `main` and set `GMAIL_IMPORT_LIMIT=20` on Render.

### 2026-11-15 02:32 · gemini · Fix Groq classification schema validation
- Done:
  - Logged Zod validation issue paths + codes (without email content) in `server/src/ai/utils.js` `runJSONWithRetry`.
  - Made `classificationSchema` (`server/src/ai/schemas.js`) tolerant: trimmed/lowercased enums (`category` falls back to `'general'`), coerced `confidence` (0..100 -> 0..1), `"true"`/`"false"` booleans, `keyPoints` capped via transform to first 6, `null` strings defaulted to `''` (and `summary` falls back to `snippet`/`subject`), and invalid `entities` dropped per-item.
  - Spelled out the exact JSON structure in `buildClassificationSystemPrompt` (`server/src/services/classification.service.js`).
  - Added Groq-style normalization unit test in `server/tests/ai.test.js` (25/25 server tests pass).
- Changed contracts: none.
- Next: merge `gemini/fix-classification-schema` -> `main`, wait for Render deploy, then press **Reset demo** and **Simulate email** to verify live classification (`aiStatus: 'done'`).

### 2026-11-15 02:00 · gemini · Fix all Phase 6 review findings (`c56b099` review)
- Done:
  - Must-fix #1: replaced `sparse: true` with `partialFilterExpression: { externalId: { $exists: true } }` on `Thread` (`{accountId, externalId}`) and `Message` (`{threadId, externalId}`) so seeded/simulated threads & messages don't collide on `null`.
  - Should-fix #2–#5: `pollGmailAccount` now resets `status: 'connected'` + emits `sync:done` on generic errors; Google login requires `verified_email === true` before matching by email; `login` returns `401 INVALID_CREDENTIALS` when `passwordHash` is missing; `OnboardingPage` polls `GET /accounts` while on `step === 'sync'`.
  - Minor: improved default client naming, added `nextPageToken` loop in `history.list`, added `trimQuotedReplies` for AI prompts, added `returnTo: 'settings'` so connecting from Settings returns to `/app/settings/accounts` without re-triggering the tour, and added dedupe + quote-trimming unit tests in `server/tests/gmail.test.js`.
- Changed contracts: none.
- Next: merge `gemini/G6-real-gmail` -> `main` (and drop any old `accountId_1_externalId_1` / `threadId_1_externalId_1` indexes if built on Atlas).

### 2026-11-15 01:48 · gemini · Phase 6 (G6.2–G6.7): Real Gmail + Sign in with Google
- Done:
  - Backend (`server/`): added `googleapis`, Google/Gmail env flags (`REAL_GMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `WEB_URL`, `TOKEN_ENC_KEY`, `GMAIL_IMPORT_LIMIT`, `GMAIL_POLL_SECONDS`) and `/health` flags (`gmail`, `googleLogin`).
  - Models: `User.googleId` (optional `passwordHash`), `EmailAccount.google` (`refreshTokenEnc` stripped in `toJSON`), `Thread.source` + `externalId`, `Message.externalId` with sparse unique dedupe indexes.
  - Services (`server/src/services/gmail/`): AES-256-GCM token encryption & 10m signed JWT OAuth state (`crypto.js`), Google OAuth2 client (`oauth.js`), MIME/HTML/address mapper (`mapper.js`), idempotent initial importer with concurrency-2 classification & `sync:progress` (`import.js`), `history.list` poller + 404/invalid_grant handling (`poller.js`).
  - Routes (`google.controller.js`, `accounts.controller.js`): `GET /api/auth/google/start`, `POST /api/accounts/gmail/start`, `GET /api/oauth/google/callback`, real Gmail `sync` & `disconnect` (revokes token + optional `?removeMail=true`).
  - Frontend (`web/`): `GoogleButton`, `SourceBadge`, `/auth/callback` (`AuthCallbackPage`), dual actions + `not_test_user` error state on `ConnectProviderCard`/`OnboardingPage`/`SettingsAccountsPage`, and `"Changes here stay in Relay"` + `"Open in Gmail"` footer in `InboxPage`.
  - Tests: `server/tests/gmail.test.js` (mapper multipart/html/outbound + AES-256-GCM + OAuth state verification).
- Changed contracts: none beyond BACKEND §3/§4/§11.
- Next: Aryan (`G6.1` Google Cloud OAuth credentials) + `@claude` (`G6.8` review).
### 2026-11-15 · claude · B1.3 sample email data
- Done: `server/src/seed/data/threads.json` (Priya 38: assistant 12, client 10, none 12, review 4; Daniel 10) and `scenarios.json` (6). 8 multi-message threads, 4 ownership changes with history, 17 dated items within 7 days, Waiting/Done/Archived examples, client hand-offs (handling, handed to Alex with a note, handled) and seeded Activity.
- Changed contracts: `createThreadWithMessages` now also reads `startsInHours`/`endsInHours`, `history`, `activity`, `reclassifiedHoursAgo`, `handoff`, and `"client"` as a person placeholder (BACKEND §8). Existing fields unchanged; fallback threads still work.
- Next: after merge, run `POST /api/demo/reset` (or `npm run seed`) on the deployed server to load it. Then B4.5.
- Notes: validated every item against the Mongoose schemas without a DB; not yet run against Atlas.


### 2026-11-15 01:32 · gemini · QA & live-site fixes (Groq models, mobile UX, shortcuts, code splitting)
- Done:
  - Fixed Groq model defaults in `server/src/config/env.js` and `.env.example` (`openai/gpt-oss-120b` / `openai/gpt-oss-20b` — `llama-3.3-70b-versatile` returned `model_not_found` on this Groq account).
  - Fixed singular/plural in `brief.service.js` (`1 thread needs you`), sanitized `reason`/`history` in `client.controller.js` REST responses, and deduped `sync:progress`/`sync:done` via `io.to(...).to(...)` in `socket.js`.
  - Frontend: added collapsible `MobileAISummary` above thread messages (`< xl`), fixed mobile client card button wrapping + 60s queue refetch, fixed `"Draft with AI"` button wrapping, updated Onboarding Outlook copy + `"Simulated"` badge, hid `"seed"` model pill, added `o` owner-cycle shortcut, added post-onboarding `GuidedTour` (`?tour=1`), and added route-level `React.lazy` code splitting in `router.tsx`.
- Changed contracts: none.
- Next: merge `gemini/q5-qa-fixes` -> `main`, remove/update `GROQ_MODEL` & `GROQ_FAST_MODEL` on Render, then `@claude` `B1.3` full seed data + `B4.5` few-shot + `Q5.1`/`Q5.3`.

### 2026-11-15 00:40 · claude · Docs: real Gmail plan, real-vs-simulated, review follow-ups
- Done: BACKEND §3 (Google routes, `nudges` on `/dashboard`), §4 (Google/account/source fields), §6, §7 (new socket rooms), §9, new §11 (real Gmail + Google sign-in). PRD §6.1, S10 → P1, F1b, new §11 real-vs-simulated table. FRONTEND routes/conventions, DESIGN_SYSTEM components + copy, ROADMAP Phase 6, DECISIONS D10–D12, README "What's real vs simulated", new `docs/GOOGLE_SETUP.md`.
- Re-reviewed Gemini's fix commit `e6fae15`: all 8 findings fixed; lint clean; 18/18 tests pass. Two minor leftovers logged under Open issues.
- Changed contracts: additive only (new routes/fields behind `REAL_GMAIL`; documented existing `nudges` and socket rooms).
- Next: Phase 6 waits until the core frontend (Phase 2–3) is solid. Claude: B1.3 seed data, B4.5 few-shot.

### 2026-11-15 00:38 · gemini · Complete Frontend (`web/`) + P0.1/P0.3–P0.5, F2.1–F4.3
- Done:
  - Root `package.json` updated with `web` workspace and `concurrently` `dev` script; `README.md` Run locally guide.
  - `web/`: Vite + React 18 + TypeScript (strict), Tailwind + design tokens (`globals.css`, `tailwind.config.ts`), `OWNER_META`, `SEGMENTS`, `api.ts`, `socket.ts`, `queryKeys.ts`, Zustand UI/command stores.
  - Auth (`/login`, `/signup`, demo buttons, `RequireAuth`), Onboarding (`/onboarding` + `SimulatedOAuthModal` + `SyncProgress`), Settings → Accounts (`/app/settings/accounts`).
  - Assistant workspace (`AssistantLayout`, `TodayPage`, `InboxPage` 3-pane with `ThreadList`, `ThreadRow`, `ThreadHeader`, `MessageItem`, `AIPanel`, `DraftComposer`, `j/k/s/u/e/d/r` shortcuts, `CommandPalette` + `AskPanel`, Simulate email, Dark mode).
  - Client view (`/c`, `/c/thread/:id` with Framer Motion cards, handling/handled/handoff/note actions, live socket sync).
- Changed contracts: none.
- Next: `@claude` QA/UX review (`Q5.1`, `Q5.3`), full seed data (`B1.3`), and production deploy (`Q5.4`).
- Notes/risks: `npm run lint`, `npm run typecheck`, `npm test` (18 server + 2 web), and `vite build` all pass.

### 2026-11-14 23:55 · gemini · Fix all issues from Claude's backend review
- Done:
  - Onboarding sync (`sync.service.js`): loads seed threads and runs `classifyThread` when a new client has 0 threads.
  - Socket rooms (`realtime/socket.js` + `accounts.controller.js`): separated `assistants:{clientId}` from `client:{clientId}` (client receives sanitized payloads only); `sync:progress` & `sync:done` also emit to `user:{assistantId}`; newly created `Client` joins active assistant sockets to `assistants:{clientId}`.
  - `/demo/reset` (`seed.js`): upserts demo users/clients by email (preserving IDs and active JWTs) and never deletes non-demo users.
  - Classification (`classification.service.js`): `aiStatus === 'pending'` is treated as initial classification (no false `reclassifiedAt`/history); invalid `endsAt` dates are omitted instead of throwing `CastError`; removed dead `isImportant` assignment.
  - Search (`threads.controller.js`): `q` now also searches `Message.bodyText`.
  - Client note → draft (`client.controller.js`): wrapped draft generation in `try/catch` so handoff still succeeds if drafting fails.
  - Updated default `ANTHROPIC_MODEL` to `claude-sonnet-4-20250514`.
- Changed contracts: none.
- Next: pushed to `origin/gemini/backend`; ready for `@claude` (`B1.3`, `B1.7` review + `B4.5`) or frontend (`P0.3`+).

### 2026-11-14 23:49 · gemini · B4.1, B4.2, B4.4, B4.6 Phase 4 backend endpoints
- Done:
  - `B4.1`: `server/src/services/ask.service.js` + `ai.controller.js` + `ai.routes.js` (`POST /api/ai/ask` with intent routing, thread citation filtering, and 30/min rate limit).
  - `B4.2`: `server/src/services/brief.service.js` + `POST /api/ai/brief/refresh` + wired into `GET /api/dashboard`.
  - `B4.4`: `server/src/controllers/demo.controller.js` + `demo.routes.js` (`POST /api/demo/simulate-email` with fallback scenarios & reclassification, `POST /api/demo/reset`).
  - `B4.6`: Follow-up nudges (`lastSender: 'us'`, `> 3 days`) included in `GET /api/dashboard` (`nudges`).
- Changed contracts: `GET /api/dashboard` now also includes `nudges: ThreadListItem[]` (additive).
- Next: `@claude` can pick up `B1.3` (seed data), `B1.7` (prompt/pipeline polish), `B4.5` (few-shot overrides). Frontend (`P0.3`+) awaits user go-ahead.

### 2026-11-14 23:48 · gemini · B3.1 Drafts API + B3.2 Client/Dashboard/Activity API (+ B4.3)
- Done:
  - `B3.1`: `server/src/services/draft.service.js`, `drafts.controller.js`, `drafts.routes.js` (`POST /threads/:id/drafts`, `PATCH /drafts/:id`, `POST /drafts/:id/send` simulated send, `DELETE /drafts/:id`).
  - `B3.2` + `B4.3`: `client.controller.js`, `client.routes.js` (`/client/queue`, `/client/threads/:id`, `/client/threads/:id/action` including `note` -> AI draft + `draft:created` socket), `dashboard.controller.js`, `dashboard.routes.js`, `activity.routes.js`.
- Changed contracts: none.
- Next: Phase 4 backend (`B4.1` Ask AI, `B4.2` Morning brief service, `B4.4` Simulate new email + `/demo/reset`, `B4.6` Follow-up nudges).

### 2026-11-14 23:46 · gemini · B1.4 Seed script + B1.11 Backend tests
- Done:
  - `server/src/seed/seed.js`: seeds demo users (`alex`, `priya`, `daniel`), clients, email accounts, and loads `seed/data/threads.json` if present (falls back to 5 starter threads across all 4 owners until `@claude` completes `B1.3`). Supports `--classify` flag and exports `seedDatabase()` for `/demo/reset`.
  - `server/tests/`: `segments.test.js`, `ai.test.js`, `classification.test.js`, `health.test.js` — 4 files, 17 tests passing.
- Changed contracts: none.
- Next: Phase 3 & 4 backend tasks (`B3.1` Drafts API, `B3.2` Client API + Dashboard, `B4.1` Ask AI, `B4.2` Morning brief, `B4.3` Client note -> draft, `B4.4` Simulate email).

### 2026-11-14 23:45 · gemini · B1.10 Accounts API + simulated sync
- Done: `server/src/services/sync.service.js`, `server/src/controllers/accounts.controller.js`, `server/src/routes/accounts.routes.js` (`/accounts`, `/accounts/connect`, `/accounts/:id/authorize`, `/accounts/:id/sync`, `DELETE /accounts/:id`).
- Changed contracts: none.
- Next: `B1.4` seed script (`npm run seed`, `--classify` flag) and `B1.11` tests.

### 2026-11-14 23:45 · gemini · B1.8 Threads API
- Done:
  - `server/src/services/segments.js` (`segmentFilter` + `computeSegmentCounts` for all 12 segments).
  - `server/src/services/classification.service.js` (`classifyThread` pipeline with Rule matching, threshold → `review`, sticky manual/client owners, history, activity & socket emits, safe fallback).
  - `server/src/controllers/threads.controller.js` + `threads.routes.js`: list, counts, detail, patch, owner + Rule upsert, reclassify, suggestion apply/dismiss.
- Changed contracts: none.
- Next: `B1.10` Accounts API + simulated sync (`sync:progress`), then `B1.4` seed script and `B1.11` tests.
- Notes/risks: `@claude` can refine `classification.service.js` prompt/few-shot in `B1.7` / `B4.5`.

### 2026-11-14 23:44 · gemini · B1.9 Socket.io server + Activity service
- Done: `server/src/realtime/socket.js` (JWT handshake auth, `user:{id}` & `client:{id}` rooms, emit helpers for thread/counts/activity/sync/draft), `server/src/services/activity.service.js`, wired `initSocket` in `server/src/index.js`.
- Changed contracts: none.
- Next: `B1.8` Threads API (plus `segments.js` and classification hook) and `B1.10` Accounts & simulated sync.

### 2026-11-14 23:43 · gemini · B1.5 & B1.6 AI providers
- Done:
  - `server/src/ai/schemas.js` (`classificationSchema`, `askSchema`), `server/src/ai/utils.js` (`AIError`, `withTimeout`, `runJSONWithRetry` with 1 JSON/schema retry).
  - `mock`, `groq` (with 429 exponential backoff + `GROQ_FAST_MODEL` support), `gemini`, and `anthropic` providers + `getProvider()`.
- Changed contracts: none.
- Next: `B1.9` Socket.io server, `B1.8` Threads API (plus classification service stub/hook so reclassify works cleanly while `B1.7` is `@claude`), `B1.10` Accounts & sync, `B1.4` Seed script, `B1.11` Tests.
- Notes/risks: `B1.7` (classification prompt v1 + pipeline) is assigned to `@claude`; will build a clean `classifyThread()` service interface that `B1.8`/`B1.10` can call and `@claude` can refine or own in `B1.7`.

### 2026-11-14 23:42 · gemini · B1.1 Mongoose models + B1.2 Auth
- Done:
  - B1.1: All 8 Mongoose models (`User`, `Client`, `EmailAccount`, `Thread`, `Message`, `Draft`, `Rule`, `Activity`) with `applyBaseTransform` (`id` string, strips `_id`/`__v`/`passwordHash`) and indexes per BACKEND §4.
  - B1.2: `/api/auth/signup`, `/api/auth/login`, `/api/auth/demo`, `/api/auth/me`, JWT helpers, `requireAuth`, `requireRole`, `requireClientScope` middleware.
- Changed contracts: none.
- Next: `B1.5` & `B1.6` AI provider abstraction + `mock`, `groq`, `gemini`, `anthropic` providers.
- Notes/risks: `npm run lint` and `npm test` (health) pass; full DB-backed auth integration tests will be added in `B1.11`.

### 2026-11-14 23:40 · gemini · P0.2 server scaffold (+ P0.1 root/server workspace)
- Done: root `.gitignore`, `.editorconfig`, root `package.json` (with `server` workspace), `server/` Express app (`helmet`, `cors`, `morgan`, zod env validation, `/health` & `/api/health`, centralized error/validation middleware, Mongo connect/disconnect, ESLint + Vitest + Supertest).
- Changed contracts: none.
- Next: Phase 1 backend (`B1.1` Mongoose models, `B1.2` Auth, `B1.5/B1.6` AI providers, `B1.8`–`B1.11`).
- Notes/risks: `web` workspace omitted from root `package.json` for now because user requested backend-only work; will add `"web"` in `P0.3`.

### 2026-11-14 18:05 · claude · AI provider → Groq
- Done: BACKEND §1/§2/§5.1 now default to Groq (`groq-sdk`, JSON mode, 429 backoff), DECISIONS D9.
- Changed contracts: env vars `GROQ_API_KEY`, `GROQ_MODEL`, `GROQ_FAST_MODEL`; `/health` may return `groq`.
- Next: unchanged.

### 2026-11-14 · claude · Project docs
- Done: created AGENTS.md, GEMINI.md, CLAUDE.md, README.md and docs/ (PRD, DESIGN_SYSTEM, FRONTEND, BACKEND, ROADMAP, PROGRESS, DECISIONS). No app code yet.
- Changed contracts: initial versions of all specs.
- Next: Gemini starts Phase 0 (P0.1–P0.5). Claude can start B1.3 (seed content) in parallel once P0.2 exists.
- Notes: folder was empty before this; not yet a git repo (P0.1 runs `git init`).
