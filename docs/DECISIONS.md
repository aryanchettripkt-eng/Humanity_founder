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
