# Relay — workspace UX spec (reference layout, our product)

> ~~**Status:** approved by Aryan 2026-11-15 (D14–D17).~~ **Superseded by [DESIGN_V2.md](./DESIGN_V2.md) (D18), 2026-11-15.** Kept for history; only §8's reuse principle (D17) carries over. Linked from DESIGN_SYSTEM §11. Drives ROADMAP Phase 8 (W8.1–W8.3).
> **Inputs:** the reference image ("Workspace" CRM), the live site after R1 (`ef9a8b2`), and PRD §4 principles ("what needs me?" in 3 seconds; AI is visible but humble).

## 0. Why the live site feels different from the reference

The colours are now right. The **layout grammar** isn't. Here's what the reference does that we don't:

| Reference | Live Today (R1) | Effect |
|---|---|---|
| A **thin icon rail** (4 circles). The **schedule pill bar is the header** | A 240px text sidebar with 12 rows, plus a separate search top bar | Reads like an admin template, and the schedule bar is demoted to a strip |
| **One header row:** title, primary pill, 3 stats with delta badges | A greeting, then a 6-line brief paragraph, then stats floating 900px away | The eye has no anchor and the 3-second answer is buried in prose |
| **Person cards:** avatar, big name, role, then a footer with source chips and a dot meter | Text-only cards with three equal owner buttons | No faces, no confidence cue. Looks like a form |
| **Task cards:** person header, icon tile and big title, date with avatars, status pill and a black circle action | Title, a line of text and one button, with a big empty area | Half-empty cards and no hierarchy |
| **A floating dark panel** overlapping the grid, with media on top and a timeline with dots | A right column stacking summary, key points and a long activity log | Feels like a second sidebar, not a focal object |
| **Notched corner** arrow on every card | Arrow sits inside a plain rectangle | Loses the signature shape |

Fix the grammar and the page will look like the reference while still being our product.

---

## 1. Global frame (every assistant page)

### 1.1 Top bar = "the taskbar" (72px, sticky)
`[logo] [ Schedule pill bar ................................ ↗ ] [⌘K] [🔔] [Priya ▾] [Alex]`

| Slot | What it is | Why it's here |
|---|---|---|
| Logo | Relay mark, goes to Today | — |
| **Schedule pill bar** | Black pill. "Next 48h" date chip, then a **lime timeline** of extracted dates (time in bold, short title, 1–2 initials avatars), and a **now needle** with a time tag, as in the reference. The ↗ circle opens a popover listing 7 days of dates with "Add to calendar". | The AI-extracted dates are a headline feature. Putting them in the header shows "AI read your email" on every screen. Overflow scrolls horizontally inside the pill. Empty state: "No dates in the next 48 hours". |
| ⌘K circle | Opens Search + Ask AI (the existing palette) | Search moves out of the bar into one icon. ⌘K is the power path. |
| 🔔 circle | Activity popover: client actions, reclassifications, new mail (collapse duplicates, "Synced ×3"). A lime dot shows when something is unseen. | Activity no longer eats the Today panel. |
| **Client switcher** | Avatar pill "Priya ▾", which lists clients with their open counts | Multi-client is a PRD concept, so it belongs in the frame, not buried in a select |
| User avatar | Menu: theme, Settings → Accounts, Simulate email (demo), Sign out | Rarely used actions go behind the avatar |

"Simulate email" leaves the top bar and becomes a menu item plus a floating **"+ Simulate"** pill at the bottom right in demo mode only, labelled *Simulated in prototype*.

### 1.2 Left rail (64px, icons only, tooltips with shortcuts)
`Today · Inbox · Review (badge 3) · Client view · Ask` … then at the bottom `Settings`.
- The active item is a filled ink circle (lime in dark mode), as in the reference.
- **The 12 segment and status rows leave the sidebar.** They become **chip rows** inside Inbox (§3). That's how the reference filters ("All · Hot Client · Great interest…"), and it frees 180px for content.
- "Client view" opens `/c` as Priya *in preview mode* (read-only and clearly labelled), so the assistant can see exactly what the client sees. It's a strong demo moment.

### 1.3 Phones (< 768)
Top: logo, schedule pill (current and next slot only) and the client avatar. Bottom: a floating ink pill tab bar with **Today · Inbox · Review · Ask · More**. More holds Client view, Settings, Simulate and Sign out. Tablet: the same rail as desktop.

---

## 2. Today (= the reference's "Workspace")

```
┌ rail ┬───────────────────────── top bar (schedule pill) ─────────────────────────┐
│      │ PRIYA'S INBOX  [+ Ask AI ⌘K]        12ˢ for you   10ˢ for Priya   3ˢ review │
│      │ ✦ 3 signatures due before Mon · Lisbon fare hold expires tomorrow  (more ▾) │
│      │                                                                   ┌────────┐│
│      │ Who needs to reply  _12_   (⌕) [All][For you 12][For Priya 10][Review 3]   ││
│      │ [card][card][card][card]  ← person cards, horizontally scrollable  │ PANEL  ││
│      │                                                                   │(float) ││
│      │ Your day  _5_   [All][Dates][Drafts ready][Waiting on Priya][Follow-ups]   ││
│      │ [lime task][task][task]                                           └────────┘│
│      │ Recently sorted (5 rows, compact)                                           │
└──────┴─────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Header row
- **Title:** client name, uppercase, heavy, as in "WORKSPACE". For example **PRIYA'S INBOX** (for Daniel it becomes "DANIEL'S INBOX"). The greeting moves to a small muted line above it: "Good evening, Alex".
- **Primary pill:** "+ Ask AI ⌘K". The most valuable thing the assistant can do from Today is ask a question across the inbox.
- **3 stats, inline to the right and clickable** (each one opens Inbox with that chip): For you · For Priya · Needs review. The badge shows **change since the last visit** (lime ↑ / rose ↓), only when it's non-zero. Never show unrelated counts as deltas.
- **AI brief:** one line under the title with a ✦ icon, the 2 most urgent facts and "more ▾" to expand the full text. Never a 6-line block. All times are in the client's timezone. **The live brief still prints "UTC" and "Nov 15 2026 20:03"**, so the prompt has to format the times before they reach the model.

### 2.2 "Who needs to reply" (= New Leads)
- **Chips:** All · For you · For Priya · Review · No reply, with counts. The default is **Review if there are any, otherwise For you**, because the review cards are where the human is needed.
- **Person card anatomy** (matches the reference):
  - Top left: a 44px initials avatar (deterministic pastel colour per sender, from tokens).
  - Top right: the notch with an ↗ circle that opens the thread.
  - Body: the **sender name** large (18/600), then the subject on 1 line, muted.
  - Footer, left: "Source" with chips (Gmail/Demo, category). Footer, right: the owner pill (OWNER_META) and the **5-dot confidence meter**, which plays the role of the reference's "interest" dots.
  - **Review cards:** the footer becomes a 3-segment control (Assistant · Client · No reply) with keys 1–3, so you can assign without opening. Optimistic update, then an undo toast.
- 4 cards visible on desktop, scroll-snap, and "View all in Inbox →" as the last card.

### 2.3 "Your day" (= Your Days Tasks)
Generated from real data: `upcoming` (dates), drafts ready to send, client hand-offs waiting, and `nudges` (we wrote last, more than 3 days ago).
- **Chips:** All · Dates · Drafts ready · Waiting on Priya · Follow-ups.
- **Task card anatomy:**
  - Header: avatar, person and their company/role, with the notch ↗.
  - Body: an icon tile (calendar / sparkles / crown / clock), the **title** large, and a date line with participant avatars ("Thu 2:00 pm").
  - Footer: a **status pill** that's a real menu (Date: Add to calendar / Dismiss · Draft: Review / Regenerate · Hand-off: Remind Priya / Take it back · Follow-up: Draft nudge / Mark done), plus a **black circle** for the main action.
- **One lime card:** the next time-bound item. The rest are white (light) or zinc-900 (dark).
- No bell buttons, unless reminders really exist.

### 2.4 Floating panel (= video call + Summary)
Floats over the right side of the grid (sticky, 360px, radius 28) and is **driven by the selected card** (it defaults to the first review card).
- **Top "media" slot: Priya's phone.** A live mini `/c` preview showing what Priya sees right now ("2 need you", top card, her last action). It updates over the socket when she taps "I'll handle it". This is our version of the reference's video call: the *other person* is visible and live. It's the product's differentiator, so it gets the hero slot.
- **Summary** (title and ↗ to open the thread):
  - A vertical **timeline with dots and times** (received 3:15 → classified 3:16 → sent to Priya 3:20 → Priya: "I'll handle it" 4:02).
  - **Key points** card.
  - **Why** card: the reason, confidence, and "Change owner".
  - **Dates** card (the reference's "Documents" slot): extracted dates as small tiles with "Add".
- Activity is **not** here. It's under 🔔.

### 2.5 Recently sorted
5 compact `ThreadRow`s below the task cards (FRONTEND §7). Reclassified rows get the chip.

### 2.6 Responsive
- 1280+: the layout above.
- 768–1279: the panel docks under the header as a horizontal strip (phone preview and Why), and the cards use 2 columns.
- < 768: title, brief line and 3 stats in a row. Carousels with the next card peeking in. The panel becomes a bottom sheet when a card is tapped.

---

## 3. Inbox (same language, 3 panes)
- **List pane** (380px): a chip row at the top that replaces the sidebar segments, with For you · For Priya · Review · No reply · Waiting · Done, an overflow "More ▾" (Meetings, Important, Archived) and the search pill. Rows are rounded 16px cards on the canvas. The selected row is an ink outline and the unread dot is lime.
- **Thread pane:** a white rounded card. Header: subject large, participants as avatars, the owner pill, and actions as circle buttons (reply, star, done, archive). Messages are cards. Outbound messages have a lime left rule.
- **AI panel = the same dark floating panel component as Today** (Summary, Why, Key points, Dates, History). One component, two places.
- **Composer:** a bottom sheet card. Tone chips (Formal · Friendly · Brief), "Generate", a streaming state and a black "Send (simulated)" circle.

## 4. Client view `/c` (Priya, mobile first)
- The header is her name, uppercase, and "2 need you". Below it, one **lime card** for the most urgent item: sender avatar, subject, the AI's one-line *why it's you*, and big pills "I'll handle it" / "Alex, take it" / "Add note".
- The other items are white cards. Handled items slide right with an undo.
- "All caught up" state: a lime circle tick and "Nothing needs you, Priya."

## 5. Landing page `/`
Goal: a reviewer understands the product in 5 seconds and lands in the demo in one click. **The landing page renders the real app components with sample data** (Today cards, the floating panel and the schedule pill), so it can't drift from the app again.
1. **Top bar** (the same frame as the app): logo · schedule pill (animated sample day) · Log in · **Try the demo**.
2. **Hero:** "WHO REPLIES?" with a short line ("Relay reads your client's inbox and tells you which emails are yours, theirs, or nobody's"), CTAs **Try as assistant** / **Try as client**, and 3 stats.
3. **Product replica:** the Today grid (Who needs to reply and Your day) plus the floating panel, all interactive with the chips working. This is the reference image, made real.
4. **How it works:** 3 notched cards. Connect Gmail (read-only) → AI decides who replies, with a reason and confidence → Priya taps once on her phone.
5. **Feature strip:** ⌘K Ask · AI drafts · Live client sync · Dates to calendar.
6. **Footer CTA** plus the honest "Simulated in prototype" line.
- Signed-in users can reach it at `/welcome`, so it can be previewed without signing out.

## 6. Auth, onboarding, settings, 404
- **Login/Signup:** a split screen. On the left, the lime and black product collage (a static render of the floating panel and a lime task card). On the right, a form card with **demo buttons first** (Assistant · Client), then Google, then email.
- **Onboarding:** a 3-step pill stepper (Welcome · Connect · Sync). Provider cards are notched cards, and sync progress is a lime bar inside an ink pill.
- **Settings → Accounts:** account cards with the source badge, "Sync now" and "Disconnect" as circle buttons, plus a client section.
- **404:** a big uppercase "LOST THREAD" and an ink pill "Back to Today".

## 7. Visual rules (add to DESIGN_SYSTEM)
- **Shapes:** cards 24–28px with the notched ↗ corner; pills `rounded-full`; icon buttons are 44px circles; no square buttons anywhere.
- **Type:** titles uppercase 800 (hero) or regular 24px (sections) with an underlined count; numbers 48px light tabular. *Optional:* switch the display font to a geometric sans (Urbanist/Outfit via `@fontsource`) to match the reference. That's a new dependency, so Aryan has to approve it.
- **Lime is reserved for:** the schedule track, one "next" card per section, the active nav item in dark mode, positive deltas and primary CTAs on dark surfaces. Never lime body text.
- **Faces:** every person shows as an initials avatar with a token colour. Avatar stacks overlap by 6px with a 2px ring.
- **Density:** desktop content max-width is 1440px, the 24px grid gap stays, and there are never empty card bodies (cards size to content and footers are pinned).
- **Every control does something.** No decorative buttons.
- **Light is the default theme for the demo video.** Dark is an equal variant (ink canvas, zinc-900 cards).

## 8. Shared components — build once, reuse everywhere (D17)

Aryan's rule: **every screen is built from the same components.** Nothing is rebuilt for one page, and the landing page never has its own copies of app UI.

**How it works:** components take **view models**, never API types or sample types directly. Each page only maps its data source to the models:
- `features/today/mappers.ts`: API (`/dashboard`, `/threads`) → models
- `features/landing/sampleData.ts`: exports models directly
- `features/inbox/mappers.ts`: thread detail → `FocusPanel` model

| Shared component (`web/src/components/workspace/`) | Replaces / merges | Used by |
|---|---|---|
| `AppTopBar` (logo · `PillBar` · actions slot) | `LandingTopBar`, the top bar in `AssistantLayout` | App frame, Landing (actions slot = Log in / Try demo) |
| `PillBar` (already in `components/common`) | — | AppTopBar |
| `NavRail` + `MobileTabBar` | sidebar segment lists | App frame |
| `WorkspaceHeader` (eyebrow, uppercase title, primary pill, `StatWithBadge` ×3, brief line) | Today header, `LandingHero` | Today, Landing hero, `/c` header (smaller variant) |
| `PersonCard` (avatar, name, subtitle, source, owner + `ConfidenceMeter`, optional quick-assign) | landing `ReplyCard`, the Today review cards | Today, Landing, Inbox "Review" empty-pane suggestions |
| `TaskCard` (person header, icon tile + title, date + avatars, status menu, primary circle) | landing `TaskCard`, the Today task cards | Today, Landing |
| `FocusPanel` (dark floating) made of `PhonePreview`, `TimelineList`, `KeyPointsCard`, `WhyCard`, `DatesCard` | landing `SummaryPanel`, `TodaySummaryPanel`, the inside of `AIPanel` | Today, Landing, Inbox (AI panel), thread on mobile (bottom sheet) |
| `WorkspaceGrid` (the "Who needs to reply" + "Your day" sections with `SectionHeader` + `ChipRow`) | the bodies of TodayPage and LandingPage | Today (API models), Landing "product replica" (sample models) |
| `Avatar` / `AvatarStack` (initials, token colour by name hash) | the inline initials spans everywhere | All cards, PillBar, thread header, `/c` |
| Existing `NotchedCard`, `ChipRow`, `SectionHeader`, `StatWithBadge`, `OwnerPill`, `ConfidenceMeter`, `SourceBadge`, `EmptyState`, `ErrorState` | — | Everywhere; don't fork |

**Rules:**
- A new visual pattern goes into this table **before** it's built.
- If a page needs a variation, add a prop or variant to the shared component. Never copy it.
- `features/landing/components` should end up holding only landing-only sections (FeatureStrip, HowItWorks, LandingFooter).
- Delete the replaced duplicates in the same PR that migrates their last user. That's allowed because the task owner replaces them, so AGENTS §1.1 is satisfied.

## 9. Build order
- **W8.1:** shared components (§8) + the frame (top bar, rail, phone tab bar) + Today (§2).
- **W8.2:** Inbox (§3) on the same `FocusPanel`.
- **W8.3:** Client view, landing (renders `WorkspaceGrid` with sample models), auth, onboarding, settings, 404.
