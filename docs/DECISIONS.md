# Decisions Log

> Append‑only. To change a decision, add a new entry that supersedes the old one (reference its number). Don't edit or delete past entries.

| # | Date | Decision | Why | By |
|---|---|---|---|---|
| D1 | 2026-11-14 | MERN: React (Vite) + Express + MongoDB, Socket.io for realtime | Brief prefers MERN; live client↔assistant sync is a core demo moment | Aryan + Claude |
| D2 | 2026-11-14 | Frontend in TypeScript, backend in JavaScript (ESM) + JSDoc + zod | TS fits shadcn/ui and catches UI contract drift; plain JS keeps the server quick to iterate | Claude |
| D3 | 2026-11-14 | Folders named `/web` and `/server`, not `/client` | "client" is a product role; avoids confusion | Claude |
| D4 | 2026-11-14 | Tailwind + shadcn/ui, Inter, indigo brand, owner colors indigo/amber/slate/rose | Agreed UI/UX plan; color reserved for ownership | Aryan + Claude |
| D5 | 2026-11-14 | Email connections and sending are simulated; seeded realistic data | Brief allows simulation; effort goes to UX + AI | Aryan + Claude |
| D6 | 2026-11-14 | AI provider is configurable (`gemini` / `anthropic` / `mock`), structured JSON output validated with zod | Provider not final; mock keeps the deployed demo working without keys | Claude |
| D7 | 2026-11-14 | Model outputs assistant/client/none + confidence; server maps < 0.70 to `review` | Keeps threshold tunable and avoids the model overusing "review" | Claude |
| D8 | 2026-11-14 | Manual and client‑set owners are sticky; AI can only suggest changes to them | Users must stay in control of corrections | Claude |
| D9 | 2026-11-14 | Default AI provider is **Groq** (`AI_PROVIDER=groq`), JSON mode + zod validation; gemini/anthropic/mock stay available | Aryan has a Groq key; fast and free tier suits a prototype. Refines D6 | Aryan |
| D10 | 2026-11-15 | Add **real Gmail, read-only** via Google OAuth as an optional path behind `REAL_GMAIL`; demo inbox stays the default; sending stays simulated; nothing written back to Gmail. Promoted from P2 to P1 (ROADMAP Phase 6, after core UI) | `gmail.readonly` is a restricted scope: only test users can connect until Google verification, so reviewers need the demo path; real Gmail proves the integration in the video | Aryan |
| D11 | 2026-11-15 | Add **Sign in with Google** (`openid email profile`), same OAuth client and one shared callback URL | Non-restricted scope, works for anyone; nicer onboarding | Aryan + Claude |
| D12 | 2026-11-15 | Socket rooms split into `assistants:{clientId}` (full data), `client:{clientId}` (sanitised, client-relevant only) and `user:{userId}` (sync events) | Fixes client receiving assistant-only data (review finding); documents Gemini's fix | Gemini, documented by Claude |
| D13 | 2026-11-15 | Lime workspace replaces indigo app-wide (`:root` + `.dark` tokens, ink/lime primary, sky for `assistant` owner). Supersedes D4 indigo palette. | Unifies the public landing page and signed-in app into one cohesive design system | Aryan + Gemini |
| D14 | 2026-11-15 | Icon `NavRail` (Today · Inbox · Review · Client view · Ask · Settings) replaces the 240px sidebar; segments and statuses become `ChipRow` filters inside Inbox; the top bar is the schedule `PillBar` + ⌘K, 🔔 activity, client switcher, avatar menu | Matches the reference layout, frees space, and puts AI-extracted dates in every screen's header | Aryan + Claude |
| D15 | 2026-11-15 | The floating panel's top slot shows Priya's live `/c` phone preview (the reference's video-call slot) | Makes the assistant ↔ client relationship visible; it's the product's differentiator | Aryan + Claude |
| D16 | 2026-11-15 | Display font **Urbanist** (`@fontsource-variable/urbanist`) for titles and numbers; Inter stays for body | Closer to the reference's geometric type | Aryan |
| D17 | 2026-11-15 | **Build once, reuse everywhere:** shared view-model components in `web/src/components/workspace` (WORKSPACE_UX §8) power Today, Inbox, `/c` and the landing page; no page-specific copies | Stops the landing page and app drifting apart and avoids rebuilding the same UI | Aryan |
