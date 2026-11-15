# Relay design v2 — "Grove"

> **Status:** approved direction from Aryan, 2026-11-15 (D18). It **replaces** the lime workspace look (D13), the nav rail (D14), the phone-preview panel (D15) and `docs/WORKSPACE_UX.md`. **D17 still holds:** build once, reuse everywhere.
> **Reference:** a calm "ReFi" dashboard. It sits on a sage canvas, with a nature-photo hero band and frosted-glass cards floating on it, glass pill tabs, and below the hero a white working area with dropdown filter pills, a pager and a row of white data cards with sparklines and a green pill CTA.
> **What we take:** the layout, the materials (glass on photo, white below) and the calm earthy palette. **What we don't take:** finance content. Every slot is mapped to a Relay feature below.

---

## 1. Look and feel

| Element | Spec |
|---|---|
| Page canvas | See §1.0 (D21). ~~Sage `#DDE1D5`. The app sits in one **frame**: radius 28px, a 24px margin on desktop (0 on phones), and a soft shadow. Two faint decorative circles (1px, white at 40% opacity) on the canvas behind the frame, as in the reference~~ |
| Hero band | The top 44–52% of the frame (min 380px desktop, 300px tablet, auto on phones). A full-bleed **nature image** (`/hero/grove.webp`, ≤250 KB, `object-cover`, `fetchpriority=high`), with a 20% dark gradient at the top for nav contrast. **Fallback** when the image is missing or slow: layered radial gradients in moss, stone and mist, plus a subtle noise SVG. It must look intentional with no photo at all |
| Glass | `bg-white/14 backdrop-blur-xl border border-white/35 shadow-[soft]`, white text, radius 20px. Inner hairlines white at 25%. Text on glass is ≥ 14px and weight ≥ 500, and every glass card gets a 10% dark tint layer so AA contrast holds on any image |
| Working area | Below the hero: a white or near-white `#F4F4F2` sheet, 24–32px padding. Cards are white, radius 18px, with a 1px `#E7E7E3` border and no shadow |
| Primary action | An olive pill `#5E9A18` with white text (hover `#4F8413`). Only one per card |
| Ink | `#1E1F1C` text. Muted `#6B6F66`. Dark circle buttons are `#1E1F1C` |
| Type | **Urbanist** (already installed) for headings, numbers and card titles. Inter for body. Hero greeting 56/60 600, white. Glass numbers 40/44 600. Card titles 18/24 600 |
| Motion | Glass cards fade up 8px on load (stagger 60ms). The hero image does a slow 1.03 scale-in over 1.2s. Pager slides. Respects reduced motion |
| Dark mode | ~~Same layout. The hero image gets a 45% dark overlay, the working area is `#141513`, cards are `#1C1D1A` and the olive brightens to `#8CC63F`. Light is the default and is used for the demo video~~ See §1.0 (D21) |

### 1.0 Canvas and themes (D21; replaces the "Page canvas", "Hero band" image and "Dark mode" rows above)
The layout, components and spacing inside the frame don't change. What changes is the canvas behind the frame and how the frame itself is painted in each theme. Reference images are in the project files under `design/grove-themes/`:
- `light-reference.png` and `dark-reference.png` are the targets.
- `grove-light.webp` and `grove-dark.webp` are the canvas images. They go in `web/public/bg/`.

| | **Light** | **Dark** |
|---|---|---|
| Canvas behind the frame | `/bg/grove-light.webp` (`cover`, `center`, `fixed`): off-white with leaves, soft sage circles and dot grids. Fallback `#F3F4EF` | `/bg/grove-dark.webp` (`cover`, `center`, `fixed`): near-black green with lime leaves, glowing circles and dot grids. Fallback `#0A0F08` |
| Frame gap (≥768) | **80px left and right, 40px top and bottom.** The frame grows with the screen (no 1440 cap). Radius 28px | Same |
| Frame gap (<768) | 0, and the canvas image is hidden | Same |
| Frame | `#F8F8F5` at 92% with `backdrop-blur-xl`, 1px `#ECEDE7` border, soft shadow `0 24px 60px -24px rgba(30,31,28,.18)` | `#10120E` at 78% with `backdrop-blur-xl`, 1px `white/10` border, shadow `0 30px 80px -30px rgba(0,0,0,.7)`. The canvas shows faintly through it |
| Hero band | **No photo in either theme.** The hero sits on the frame. Greeting 56/60 600 in ink | Same, with the greeting in white |
| Hero cards (`.glass`) | `bg-white/80`, 1px `#ECEDE7` border, soft shadow, ink text | `bg-white/[0.06]`, 1px `white/12` border, white text |
| Nav | The tab pill is `white/70` with a hairline border. The active tab is a white pill with a shadow. The circles and client pill are white with a hairline | The tab pill is `white/8` with a `white/12` border, and the active tab is white with ink text. The circles are `white/8` |
| Working area | Continues on the frame (no separate sheet). Cards are white, radius 18px, 1px `#ECEDE7` | Continues on the frame. Cards are `white/[0.04]` with a 1px `white/10` border, and the inner stat box is `black/30` |
| Chart stacks | For you `#6DB27A`, For Priya `#E6C4AE`, No reply `#E8E2D3` | Muted: For you `#5E8F3A`, For Priya `#6B5A4E`, No reply `#4A4A42` |
| Avatars on cards | Dark circle `#2B2E2A` with white initials | Rounded square `#2A2C27` with white initials |
| Primary pill | Deep olive `#3F7A1E` with white text | Lime `#8CC63F` with ink text |
| Delta / positive text | `#3F7A1E` | `#B8EB78` |

All values go through tokens in `globals.css` (`--canvas-image`, `--frame-bg`, `--frame-border`, `--hero-fg`, `--glass-bg`, `--glass-border`, `--glass-fg`, `--card-bg`, `--card-border`, `--statbox-bg`, `--chart-assistant`, `--chart-client`, `--chart-none`, `--cta-bg`, `--cta-fg`), set in both `:root` and `.dark`. Components read the tokens and never branch on the theme in JSX. The `/hero/grove.webp` image and its gradient fallback are retired.

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
- On the right are glass circles: **search ⌘K**, **settings** and the **user avatar** (menu: theme, **Send test email** (demo workspace only), Sign out).
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

  - **Footer:** a **sparkline** of the thread's message activity over 14 days (olive when the last message is from them, ink when it's from us), a delta chip (`↗ 2 new` / `↘ quiet 5d`), and **one olive pill CTA** chosen by state: `Draft reply` (assistant), ~~`Send to Priya` (client, not handed off), `Nudge Priya` (handed off and waiting)~~ `Move up for Priya` (client, not yet important and not being handled: sets `important`, which puts it at the top of her queue, with Undo) or `Open in Priya's view` (otherwise; goes to `/c?preview=1`), `Confirm` (review). It always opens a real action, and its toast only states what actually happened (D20). A real "Nudge Priya" needs a backend notification endpoint and is out of scope for G9.1.
- **Below the row, a "Recently sorted" compact list** (5 rows) with a "View inbox" link.

---

## 4. Inbox
- **Hero band, short (≈ 220px):** the nav, then the title "Inbox" in white with three glass stat chips (For you · For Priya · Needs your call) that act as **segment tabs**.
- **Working area: 2 panes on desktop.** The **left list** (380px) is the same filter bar (compact), then thread rows as small white cards (avatar tile, sender, subject, owner pill, time, unread dot in olive). The **right reading pane** is a white card. Its header shows the subject (Urbanist 24), participants as avatars, and actions as circle buttons. Messages are inside it.
- **AI insight:** a **glass panel on a mini image strip** at the top of the reading pane. It shows the **Why** (reason and confidence), **Summary**, **Dates** (with Add to calendar) and **History**. It reuses the same `GlassCard` components as the Today hero, so the AI always "lives on the glass".
- **Composer:** a white card at the bottom with tone pills (Formal · Friendly · Brief), "Generate with AI", streaming dots and the olive pill "Send".
- **Phones:** the list fills the screen and tapping opens the full thread. The AI glass panel collapses above the messages.

## 5. Client view `/c` (Priya, phone first)
- **Hero band:** "Hi Priya" with a glass chip "2 need you". One **glass card** holds the most urgent item: sender, subject and the AI's one-line *why it's you*.
- **Working area:** white cards for each item, each with **two pills**: olive `I'll handle it` and outline `Alex, take it`, plus an `Add note` text button. Handled cards slide out with an undo.
- **All caught up:** the hero shows "Nothing needs you, Priya" on a glass card and the working area is empty.
- The assistant opens it from the **Client view** tab in read-only preview mode.

## 6. Public site: separate pages, no long scroll (D19)

The public site is **5 pages**, not one long scroll. Each page is **one screen inside the frame** on desktop (frame height = viewport − 48px). The hero band takes the top half and the white working area the bottom half, exactly like the reference. Anything that doesn't fit goes into a pager, tabs or a sheet, never extra scroll. Phones scroll naturally, but every page stays short. You move between pages with the **glass tabs** in the nav or the **"Next" buttons** on each page.

All interactive parts use the **same components as the app** (D17), fed by a shared `tourStore` (Zustand, kept in `sessionStorage`) seeded with 10 example threads for Priya. **A change made on one page carries over to the others**, so assigning a thread on Overview shows up on the Client page. Copy reads like a finished product (D20).

### 6.0 Public nav (every public page)
`[● Relay]` `[ Overview · Sorting · Client app · Ask & drafts · How it works ]` … `[Log in]` `[Get started]`
- The tabs are real routes: `/`, `/sorting`, `/client-app`, `/ask`, `/how-it-works`. The active tab is the white pill.
- **Log in** goes to `/login`. **Get started** (olive) goes to `/signup`.
- Every page also has **Open demo workspace** (outline pill): one-click demo login as the assistant, then `/app/today`. The page warms the API with `GET /health` on load. If login takes over 4s, the button reads "Opening your workspace…".
- Phones: the tabs collapse into a glass menu button (sheet with the 5 pages).

### 6.1 Overview `/` — "Know who replies."
| Area | Content and behaviour |
|---|---|
| Hero, left | The headline **"Know who replies."** and one line: "Relay reads your client's inbox and sorts every email: yours, theirs, or nobody's, with the reason why." Then **Get started** and **Open demo workspace**. Below that, the glass **"Sorted this week"** `StackedBars` chart. Hovering shows counts. Clicking a segment filters the cards below |
| Hero, right | `GlassStat` **For you** and **For Priya**: live counts from `tourStore`, and a click filters the cards. `GlassList` **Needs your call**: review threads with **You · Priya · No reply** buttons (keys 1–3). A click moves the thread, every widget updates, and a toast offers Undo |
| White area | `FilterBar` (Owner only) + pager `‹ 01 / 03 ›` + 4 `ThreadCard`s. The card CTAs work as they do in the app (Draft reply opens the thread sheet with the draft typing in). Bottom right: **Next: Sorting →** |

### 6.2 Sorting `/sorting` — "Every email gets one owner."
| Area | Content and behaviour |
|---|---|
| Hero, left | The title and one line. A glass **"Incoming"** card with 5 email chips. **Picking one** plays the classification: the subject arrives, then the verdict appears in steps: owner pill → confidence → reason ("Priya is asked directly to approve the budget.") → extracted date. **Add to inbox** puts it into `tourStore` as a new card |
| Hero, right | A glass **Why** card for the selected thread: the reason, a confidence meter and the evidence lines quoted from the email. An **Override** row (You · Priya · No reply) with an **"Always for this sender"** checkbox: once it's set, every thread from that sender in the store moves too, and a toast says so |
| White area | The full `FilterBar` (Owner · Category · Date · Confidence, plus the dark clear circle) + pager + `ThreadCard`s. ↗ opens the **thread sheet**: email body, Why, Summary, Key points, Dates with **Add to calendar** (downloads a real `.ics`), and the owner dropdown. **Next: Client app →** |

### 6.3 Client app `/client-app` — "Your client decides in one tap."
| Area | Content and behaviour |
|---|---|
| Hero, left | The title and one line. A glass **phone** showing Priya's queue (the store's client threads that aren't handled yet). The buttons **I'll handle it**, **Alex, take it** and **Add note** (a small input) all work. Handled cards slide out. When the queue is empty: "Nothing needs you, Priya." |
| Hero, right | A glass **"Assistant side"** list: the threads sent to Priya, each with a live status chip (Waiting → Priya is handling it → Back with you), plus a small activity feed of her taps with times. A phone tap updates this list instantly |
| White area | `ThreadCard`s owned by `client`. **Send to Priya** pushes a thread onto the phone, and **Nudge Priya** adds a "Reminder sent" line to the activity. **Next: Ask & drafts →** |

### 6.4 Ask & drafts `/ask` — "Ask your inbox. Reply in your voice."
| Area | Content and behaviour |
|---|---|
| Hero, left | A glass **Ask** box with 4 suggested questions ("What does Priya need to sign this week?", "Anything waiting on me?", "Summarise the offsite thread", "Which emails can wait?"). Each one returns an answer with **cited thread chips**, and a chip opens the thread sheet. Typing your own question offers those suggestions plus **Open demo workspace** to ask anything |
| Hero, right | A glass **Draft** card for the selected thread: tone pills **Formal · Friendly · Brief** switch versions, the draft types itself out, **Copy** works, and **Insert** shows the reply in the thread sheet |
| White area | A row of **Dates found** cards (meeting, deadline, travel), each with **Add to calendar** (`.ics`) and the source thread. Below that, the assistant-owned `ThreadCard`s, and picking one sets the Draft card's thread. **Next: How it works →** |

### 6.5 How it works `/how-it-works` — "Set up in two minutes."
| Area | Content and behaviour |
|---|---|
| Hero | 3 glass step cards: **Connect Gmail** (read-only) → **Relay sorts every thread** → **Your client decides**. Each one has a **See it** button that goes to Overview, Sorting or Client app |
| White area | **Integration cards:** Gmail (Connect, read-only access) and Outlook (Connect). **Trust cards** with true claims only: "Read-only access to Gmail", "Nothing is sent or changed in your mailbox", "Every AI decision shows its reason and can be overridden". Then a final row with **Get started** and **Open demo workspace** |

### 6.6 Rules
- **API calls:** only `GET /health` and demo login. Everything else runs in `tourStore`. Avatar menu → **Reset tour** restores the seed.
- **No** "prototype", "simulated", "sample data" or "real vs simulated" anywhere in the UI (D20).
- Every interactive piece is built from the shared Grove components. The public pages only provide `tourStore` data and handlers.
- All states are designed: login loading and error, empty phone, empty filters, empty review list, reduced motion.

### 6.7 What stays in the app
| Page | Owns |
|---|---|
| Today | Real brief, counts, chart, review queue, cards, **Send test email** |
| Inbox | Real threads, full AI panel, AI drafts, sender rules |
| `/c` | Priya's real queue and actions |
| ⌘K Ask | Real answers over the whole inbox |
| Onboarding / Settings | Connecting accounts, sync, disconnect |
| Login / Signup | Accounts, Google sign-in |

### 6.8 Product copy (D20)
The UI reads like a finished product, without prototype labels. Wording must still be **true**:
- "Simulate email" becomes **"Send test email"** (it delivers a scripted test email to the demo workspace).
- The demo inbox is called **"Demo workspace"**.
- The simulated OAuth modal is titled **"Connect demo workspace"**.
- Sending in the demo workspace says **"Reply sent"**. For a real Gmail thread it says **"Reply saved in Relay"** with an "Open in Gmail" link, because Relay doesn't send through Gmail.
- "Add to calendar" downloads a real `.ics` file instead of showing a toast.
- The "real vs simulated" list stays in the README for reviewers, but never in the UI.

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
- **G9.1b:** the **public site** (§6): 5 pages, `tourStore`, public nav, on the same components.
- **G9.2:** Inbox, `AIGlassPanel`, composer and ⌘K restyle.
- **G9.3:** Client view, auth, onboarding, settings and 404.
- **G9.4** (Claude): review each PR at 1440, 820, 390 and 320 in light and dark.
