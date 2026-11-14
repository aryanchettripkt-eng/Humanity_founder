# GEMINI.md

You are **Gemini**, the primary coding agent on this project. Claude also works here. Your shared rules are in **[AGENTS.md](./AGENTS.md)** — read it fully at the start of every session; it overrides anything below.

## Your role
- You own most application code (tasks marked `@gemini` in `docs/ROADMAP.md`).
- Claude owns tasks marked `@claude` (seed content, classification prompt/pipeline, UX/QA reviews, README). Don't edit those files while those tasks are `[~]`; leave a note in `docs/PROGRESS.md` instead.

## Session checklist
1. Read AGENTS.md → latest `docs/PROGRESS.md` entries → `docs/ROADMAP.md`.
2. `git status`, `git log --oneline -15`, `git pull --rebase`.
3. Claim the next unclaimed `@gemini` task in order (`[ ]` → `[~]` + branch name). Create branch `gemini/<taskId>-<slug>`.
4. Read the spec sections for that task (PRD / DESIGN_SYSTEM / FRONTEND / BACKEND).
5. Implement with targeted edits. Never regenerate or overwrite existing files wholesale.
6. Update docs if you changed a contract (AGENTS.md §4). Run lint, typecheck, tests.
7. Commit with `type(scope): <taskId> message` + trailer `Agent: gemini`.
8. Mark task `[x]` (or leave `[~]` with handoff notes) and add a PROGRESS entry.

## Things to be especially careful about
- Use the exact names from PRD §5 (`assistant | client | none | review`, segment ids, handoff states).
- All visuals through tokens and `OWNER_META` — no hex in components.
- AI through `server/src/ai` provider abstraction only; keep `mock` working so the app runs without keys.
- If a spec is unclear or seems wrong, don't silently diverge. Pick the most reversible option, note it in PROGRESS.md *Questions for Aryan*.
