# Relay design v2 — "Grove"

> **Status:** approved direction from Aryan, 2026-11-15 (D18). It **replaces** the lime workspace look (D13), the nav rail (D14), the phone-preview panel (D15) and `docs/WORKSPACE_UX.md`. **D17 still holds:** build once, reuse everywhere.
> **Reference:** a calm "ReFi" dashboard. It sits on a sage canvas, with a nature-photo hero band and frosted-glass cards floating on it, glass pill tabs, and below the hero a white working area with dropdown filter pills, a pager and a row of white data cards with sparklines and a green pill CTA.
> **What we take:** the layout, the materials (glass on photo, white below) and the calm earthy palette. **What we don't take:** finance content. Every slot is mapped to a Relay feature below.

---

## 1. Look and feel

| Element | Spec |
|---|---|
| Page canvas | Sage `#DDE1D5`. The app sits in one **frame**: radius 28px, a 24px margin on desktop (0 on phones), and a soft shadow. Two faint decorative circles (1px, white at 40% opacity) on the canvas behind the frame, as in the reference |
| Hero band | The top 44–52% of the frame (min 380px desktop, 300px tablet, auto on phones). A full-bleed **nature image** (`/hero/grove.webp`, ≤250 KB, `object-cover`, `fetchpriority=high`), with a 20% dark gradient at the top for nav contrast. **Fallback** when the image is missing or slow: layered radial gradients in moss, stone and mist, plus a subtle noise SVG. It must look intentional with no photo at all |
| Glass | `bg-white/14 backdrop-blur-xl border border-white/35 shadow-[soft]`, white text, radius 20px. Inner hairlines white at 25%. Text on glass is ≥ 14px and weight ≥ 500, and every glass card gets a 10% dark tint layer so AA contrast holds on any image |
| Working area | Below the hero: a white or near-white `#F4F4F2` sheet, 24–32px padding. Cards are white, radius 18px, with a 1px `#E7E7E3` border and no shadow |
| Primary action | An olive pill `#5E9A18` with white text (hover `#4F8413`). Only one per card |
| Ink | `#1E1F1C` text. Muted `#6B6F66`. Dark circle buttons are `#1E1F1C` |
| Type | **Urbanist** (already installed) for headings, numbers and card titles. Inter for body. Hero greeting 56/60 600, white. Glass numbers 40/44 600. Card titles 18/24 600 |
| Motion | Glass cards fade up 8px on load (stagger 60ms). The hero image does a slow 1.03 scale-in over 1.2s. Pager slides. Respects reduced motion |
| Dark mode | Same layout. The hero image gets a 45% dark overlay, the working area is `#141513`, cards are `#1C1D1A` and the olive brightens to `#8CC63F`. Light is the default and is used for the demo video |

### 1.1 Owner colours (earthy, AA-checked, always icon + label)
| Owner | Tone | Also used for |
|---|---|---|
| `assistant` ("For you") | Forest `#2F5D3A` | the bottom stack in the bar chart |
| `client` ("For Priya") | Clay `#8C7466` | the middle stack |
| `none` ("No reply") | Linen `#E8E4DE` with ink text | the top stack |
| `review` ("Needs your call") | Terracotta `#C2562A`, dashed border | only the review list and pills |

Positive delta chips are an olive tint and negative ones a terracotta tint, using the same arrows as the reference.

---

## 2. Frame and navigation (every signed-in page)

**Top nav, inside the hero band** (glass on the image):
- `[● logo]` then **glass tab pill**: `Today · Inbox · Client view · Ask AI`. The active tab is a solid white pill with ink text, as in the reference.
- On the right are glass circles: **search ⌘K**, **settings** and the **user avatar** (menu: theme, Simulate email *(Simulated in prototype)*, Sign out).
- A **client switcher** sits as a glass pill to the left of the circles: `Priya ▾` (clients with open counts).
- No sidebar, no rail. Segments live as filters in the working area (§3.2, §4).

**Phones (< 768):** the hero shrinks and the tabs move to a **bottom bar**: a white pill with an olive active tab. Today · Inbox · Client · Ask. Every tab is ≥ 44px.

---

## 3. Today

### 3.1 Hero band (glass over the image)
Left column:
- **"Good evening, Alex!"** in white, on two lines, with a glass **date chip** ("Sun, 15 Nov") beside it.
- **Glass chart card "This week"**: stacked bars for Mon–Sun showing how many threads the AI sorted per day, split into For you / For Priya / No reply (the forest, clay and linen stacks, like the reference's TVL chart). There's a tiny legend and the ↗ icon opens Inbox. Data is computed client-side from the thread list (`lastMessageAt` day × `owner`), so no new endpoint.

Right column:
- **Two glass stat cards** (like "ReFi Index / Avg Yield"):
  - **For you** `12` with "+3 since this morning" in olive.
  - **For Priya** `10` with "3 waiting on her".
  - Each card links to Inbox filtered by it.
- **Glass list card "Needs your call"** (like "Top Protocols"): the top 3 review threads, each with an avatar, sender, a muted subject and the confidence % on the right. A row click opens the thread, and the ↗ opens the Review filter. When it's empty it shows **"Next up"**: the next 3 extracted dates.

Under the greeting there's **one line of AI brief** in white/80 (first sentence, with "more" to expand in a glass popover). Times are always in the client's timezone, with no UTC and no year.

### 3.2 Working area (white)
- **Filter bar** (dropdown pills like "This week · Layer 2 · 8–15% APY · Low Risk"):
  `Owner: All ▾` · `Category ▾` · `Date: This week ▾` · `Confidence ▾` · `Source ▾`, then a **dark circle** that opens all filters in a sheet. On the right is the **pager**: `‹ 03 / 36 ›`. Filters sync to the URL.
- **Thread cards row** (like the protocol cards; 4 visible on desktop, the pager or swipe scrolls by page):
  - **Header:** a dark rounded-square avatar tile with initials, **sender** (18/600), the muted company or email domain, and ↗ to open the thread.
  - **Inner grey stat box, 3 columns:**

    | OWNER | CONFIDENCE | NEXT DATE |
    |---|---|---|
    | `For Priya` (owner colour) | `92%` | `Fri 5 pm` or "—" |

  - **Footer:** a **sparkline** of the thread's message activity over 14 days (olive when the last message is from them, ink when it's from us), a delta chip (`↗ 2 new` / `↘ quiet 5d`), and **one olive pill CTA** chosen by state: `Draft reply` (assistant), `Send to Priya` (client, not handed off), `Nudge Priya` (handed off and waiting), `Confirm` (review). It always opens a real action.
- **Below the row, a "Recently sorted" compact list** (5 rows) with a "View inbox" link.

---

## 4. Inbox
- **Hero band, short (≈ 220px):** the nav, then the title "Inbox" in white with three glass stat chips (For you · For Priya · Needs your call) that act as **segment tabs**.
- **Working area: 2 panes on desktop.** The **left list** (380px) is the same filter bar (compact), then thread rows as small white cards (avatar tile, sender, subject, owner pill, time, unread dot in olive). The **right reading pane** is a white card. Its header shows the subject (Urbanist 24), participants as avatars, and actions as circle buttons. Messages are inside it.
- **AI insight:** a **glass panel on a mini image strip** at the top of the reading pane. It shows the **Why** (reason and confidence), **Summary**, **Dates** (with Add to calendar) and **History**. It reuses the same `GlassCard` components as the Today hero, so the AI always "lives on the glass".
- **Composer:** a white card at the bottom with tone pills (Formal · Friendly · Brief), "Generate with AI", streaming dots and the olive pill "Send (simulated)".
- **Phones:** the list fills the screen and tapping opens the full thread. The AI glass panel collapses above the messages.

## 5. Client view `/c` (Priya, phone first)
- **Hero band:** "Hi Priya" with a glass chip "2 need you". One **glass card** holds the most urgent item: sender, subject and the AI's one-line *why it's you*.
- **Working area:** white cards for each item, each with **two pills**: olive `I'll handle it` and outline `Alex, take it`, plus an `Add note` text button. Handled cards slide out with an undo.
- **All caught up:** the hero shows "Nothing needs you, Priya" on a glass card and the working area is empty.
- The assistant opens it from the **Client view** tab in read-only preview mode.

## 6. Landing page `/` (also `/welcome` when signed in): a working sandbox

The landing page is **a working mini-version of Relay that runs in the browser on sample data**. Every control does something. It uses the **same components as the app** (D17), fed by a `landingSandbox` store (Zustand, in memory, seeded from `sampleData.ts`) instead of the API. One action in the sandbox updates every widget that reads the same store: chart, stats, list, cards and phone. A **"Reset sample"** link restores the seed. The layout follows the reference exactly: nav, then hero with greeting and chart on the left and glass cards on the right, then a white area with filter pills, a pager and a row of cards.

Sample seed: **10 threads** for Priya (3 For you, 3 For Priya, 2 No reply, 2 Needs your call), each with sender, domain, subject, body (3–6 lines), owner, confidence, reason, summary, key points, 0–1 date and a 14-day message-count series.

### 6.1 Top nav (glass, on the hero)
| Element | What it does |
|---|---|
| Logo | Scrolls to the top |
| Glass tabs: **Assistant · Client · How it works · Real vs simulated** | **Assistant** and **Client** switch the **right side of the hero** between the assistant cards and Priya's phone (§6.3). **How it works** and **Real vs simulated** scroll to those sections. The active tab is the white pill and follows the scroll position |
| 🔍 circle | Opens the **Ask sandbox** (§6.5) |
| ⚙ circle | Toggles light and dark (saved in localStorage) |
| Avatar circle | Goes to `/login` |
| **Try the demo** olive pill | Demo login as the assistant (same as §6.2) |

### 6.2 Hero, left
| Element | What it does |
|---|---|
| **"Know who replies."** + one line | Static |
| Date chip | Today's real date in the visitor's locale |
| **Try as assistant** / **Try as client** | `useDemoLogin(role)`, then `/app/today` or `/c`. While loading, the button shows a spinner. If the API takes over 4s, the label becomes **"Waking the demo server…"** (Render cold start). On error, a toast with Retry |
| Server warm-up | On page load, fire `GET /health` once in the background, so the API is warm by the time someone clicks. Nothing is shown unless it fails, and then a small glass note says "Demo server is starting, the first click may take ~30s" |
| **Glass chart "Sorted this week"** | `StackedBars` for Mon–Sun from the sandbox (day × owner, forest/clay/linen). **Hover** shows a tooltip ("Wed · 2 for you · 1 for Priya"). **Clicking a segment** sets the filters below (owner and day) and scrolls to the cards. It updates live when an owner changes |

### 6.3 Hero, right (switches with the Assistant / Client tab)
**Assistant tab (default):**
| Element | What it does |
|---|---|
| `GlassStat` **For you** / **For Priya** | Counts from the sandbox, with a delta line ("+1 since you arrived" after a change). **Clicking** sets the Owner filter below and scrolls |
| `GlassList` **Needs your call** | The sandbox's review threads (avatar, sender, subject, confidence %). Each row has **3 quick-assign buttons (You · Priya · No reply, keys 1–3)**. A click moves the thread to that owner: the row leaves, the stats, chart and cards update, and a toast says "Moved to Priya · Undo". Once the list is empty it shows "AI is confident about everything right now" and a "Reset sample" link |

**Client tab:**
| Element | What it does |
|---|---|
| Glass **phone frame** showing Priya's queue | Lists the sandbox threads that are owned by `client` and not yet handled. Each card has **I'll handle it** and **Alex, take it**. *I'll handle it* marks it handled: the card slides out, and the matching thread card below gets a "Priya is handling it" chip. *Alex, take it* sets the owner to assistant, so the For you count goes up. This demonstrates the live assistant ↔ client sync on one screen |

### 6.4 White working area (the reference's filter row and cards)
| Element | What it does |
|---|---|
| `FilterBar` dropdown pills: **Owner** (All / For you / For Priya / No reply / Needs your call) · **Category** (Meeting, Finance, Legal, Personal, Update…) · **Date** (Any / Has a date / Next 7 days) · **Confidence** (Any / ≥ 90% / 70–89% / < 70%) | Filters the cards. Combined filters use AND. Selected pills show their value ("Owner: For Priya"). The state is mirrored in the URL hash so a link reproduces it |
| Dark circle | Clears all filters (tooltip "Clear filters"). It shows a dot when any filter is active |
| Pager `‹ 01 / 03 ›` | 4 cards per page on desktop, 2 on tablet, 1 on phones. Arrows, swipe and ←/→ keys work. It resets to page 1 when the filters change |
| Empty result | `EmptyState` "No sample threads match" and a Clear filters button |
| **`ThreadCard`** header: `AvatarTile`, sender, domain, ↗ | ↗ (or clicking the card) opens the **thread sheet** (§6.6) |
| `StatBox` **OWNER · CONFIDENCE · NEXT DATE** | OWNER is a small dropdown. **Changing it overrides the AI**: the card, chart, stats, list and phone all update, and the confidence becomes "Manual". CONFIDENCE shows a % with a tooltip of the AI's reason. NEXT DATE shows "Fri 5 pm" or "—" |
| `Sparkline` + `DeltaChip` | The thread's 14-day message counts. The chip shows "↗ 2 new" (olive) or "↘ quiet 5d" (terracotta) |
| **Olive CTA** (one, chosen by state) | **Draft reply** (owner = you): opens the thread sheet with the draft streaming in (pre-written, typed out at about 40 chars/s), with tone pills that switch between 3 pre-written versions. **Send to Priya** (owner = client, not handed off): marks it handed off, so it appears on the phone in the Client tab, with a toast "Sent to Priya's view". **Nudge Priya** (handed off and waiting): the toast "Nudge drafted" opens the sheet with a short pre-written nudge. **Confirm** (needs your call): accepts the AI's suggestion and moves the thread to the suggested owner |

### 6.5 Ask sandbox (🔍 or ⌘K)
A glass dialog with **4 suggested questions** ("What does Priya need to sign this week?", "Anything waiting on me?", "Summarise the offsite thread", "Which emails can I ignore?"). Each one returns a **pre-written answer** with **cited thread chips**, and clicking a chip opens that thread sheet. Free-text questions are answered with "In the live demo, Ask searches the whole inbox" and a Try as assistant button. The dialog is labelled **"Sample answers"**.

### 6.6 Thread sheet (right-side sheet, full screen on phones)
Shows the subject, participants, the sample email body, and an **AI glass panel**: Why (reason + confidence), Summary, Key points, Dates (**Add to calendar** downloads a real `.ics` for that sample date, built in the browser), the draft area (§6.4) and the owner dropdown. Esc closes it.

### 6.7 Below the cards
- **How it works:** 3 white cards (Connect Gmail read-only → AI decides who replies and why → Priya taps once). Each card has a **"Show me"** button that scrolls to and highlights the matching live widget (the filter bar, the Needs-your-call list, the Client tab).
- **Real vs simulated:** a table generated from the same list as the README / PRD §11.
- **Footer:** the two demo buttons again, plus GitHub and video links if Aryan adds them.

### 6.8 Rules
- **No API calls except `GET /health` and demo login.** Everything else is local and labelled "Sample data" in the hero corner.
- Everything here is built from the shared components. The sandbox only provides a different data source and different handlers.
- All states are designed: loading (demo login), empty (filters, review list, phone), errors (login, health) and reduced motion.

### 6.9 What lives on other pages, not the landing page
| Page | Owns |
|---|---|
| Today | Real brief, real counts and chart, real review queue, real cards, Simulate email |
| Inbox | Real thread reading, full AI panel, real drafts (LLM), owner rules ("Always for this sender") |
| Client view `/c` | Priya's real queue and actions over the socket |
| Ask (⌘K) in the app | Real LLM answers over the whole inbox |
| Onboarding / Settings | Connecting Gmail or the demo inbox, sync, disconnect |
| Login / Signup | Accounts, Google sign-in |

## 7. Auth, onboarding, settings, 404
- **Login/Signup:** the frame splits 50/50. Left is the hero image with one glass sample card ("Needs your call") and the tagline. Right is white with the **demo buttons first**, then Google, then email.
- **Onboarding:** a short hero with step pills (Welcome · Connect · Sync) as glass tabs. Provider cards are white cards with olive CTAs. Sync progress is an olive bar in a glass card.
- **Settings → Accounts:** a short hero titled "Settings". Account cards use the thread-card layout, with an inner stat box (STATUS · LAST SYNC · SOURCE) and an outline "Disconnect" pill.
- **404:** the hero only, with "This thread got lost." and a white pill "Back to Today".

---

## 8. Components (D17: build once, reuse everywhere)

All visual components live in `web/src/components/grove/` and take **view models**. Pages only map their data (`features/*/mappers.ts` for the API, `features/landing/sampleData.ts` for sample data).

| Component | Purpose | Used by |
|---|---|---|
| `AppFrame` | Sage canvas, rounded frame, decorative circles | All pages |
| `HeroBand` | Image + fallback + overlay. Sizes `tall | short | split`, with slots for nav, left and right | Today, Inbox, Client, Landing, Auth, Settings, 404 |
| `TopNav` | Logo, `GlassTabs`, client switcher, glass circles, avatar menu. Variant `public` (Log in / Try demo) | All signed-in pages, Landing |
| `GlassTabs` | Segmented glass pill (also used as Inbox segment tabs and onboarding steps) | TopNav, Inbox, Onboarding |
| `GlassCard` | The glass material, with title, ↗ and children | Everywhere on the hero |
| `GlassStat` | Label, icon, big number, delta line | Today, Inbox, Client, Landing |
| `GlassList` | A titled list of avatar rows with a right value | Today, Landing, Login |
| `StackedBars` | Owner-stacked bars with a legend (SVG, no chart library) | Today, Landing |
| `FilterBar` | `FilterDropdown` pills, a dark filter circle, a `Pager` | Today, Inbox, Landing |
| `ThreadCard` | Header, inner `StatBox`, `Sparkline`, `DeltaChip`, CTA pill | Today, Landing, Settings (account variant) |
| `StatBox` | The grey inner 3-column box | ThreadCard, account cards |
| `Sparkline`, `DeltaChip` | Small SVG line and up/down chip | ThreadCard |
| `ThreadListRow` | Compact white row card | Inbox list, "Recently sorted" |
| `AIGlassPanel` | Why, Summary, Dates, History on glass | Inbox reading pane, mobile thread |
| `ClientItemCard` | Client card with two pills | `/c` |
| `BottomTabBar` | The phone nav | Phones |
| `Avatar`, `AvatarTile` | Initials. Round, or the dark rounded square used on cards | Everywhere |
| Existing, restyled not rebuilt: `OwnerPill`, `ConfidenceMeter`, `SourceBadge`, `EmptyState`, `ErrorState`, `Skeleton`, `CommandPalette`, `AskPanel`, `DraftComposer` logic, `OwnerPopover` | | |

**Delete when replaced** (in the PR that migrates their last user): `components/workspace/*` (AppTopBar, NavRail, MobileTabBar, PersonCard, TaskCard, FocusPanel, WorkspaceGrid, WorkspaceHeader), `PillBar`, `NotchedCard`, `StatWithBadge`, `ChipRow`, `SectionHeader`, and the lime tokens. **Keep:** the mappers, the hooks, `models.ts` (reshaped to the new view models) and all data and API code.

## 9. Responsive
- ≥ 1280: as specified.
- 768–1279: the hero right column moves under the left column, and there are 2 thread cards per page.
- < 768: the frame margin is 0. The hero shows the greeting, then a 2×1 row of glass stats, then the "Needs your call" glass list. The chart is hidden behind a "This week ▾" toggle. One thread card per page with swipe. Bottom tab bar.
- No horizontal page scroll at 320. Tap targets ≥ 44px.

## 10. Build order (ROADMAP Phase 9)
- **G9.1:** tokens, fonts and the image + fallback, `AppFrame`, `HeroBand`, `TopNav`, `BottomTabBar`, the glass set, `FilterBar`, `ThreadCard`, `StackedBars`, then **Today** on them. Delete the replaced workspace components.
- **G9.1b:** the **Landing sandbox** (§6) on the same components.
- **G9.2:** Inbox, `AIGlassPanel`, composer and ⌘K restyle.
- **G9.3:** Client view, auth, onboarding, settings and 404.
- **G9.4** (Claude): review each PR at 1440, 820, 390 and 320 in light and dark.
