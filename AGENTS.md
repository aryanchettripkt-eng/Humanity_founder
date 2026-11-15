# AGENTS.md — Rules for every AI agent working in this repo

> Applies to **Gemini**, **Claude**, and any other coding agent. `GEMINI.md` and `CLAUDE.md` point here; this file wins if they ever disagree.
> Human owner: **Aryan**. Aryan's word overrides any doc.

## 0. Read before you touch anything (every session)
1. This file.
2. `docs/PROGRESS.md` — the latest entries (what changed since you last worked, who is mid‑task).
3. `docs/ROADMAP.md` — what's claimed and by whom.
4. The spec for the area you'll touch: `docs/PRD.md`, `docs/DESIGN_SYSTEM.md`, `docs/FRONTEND.md`, `docs/BACKEND.md`.
5. `git status` and `git log --oneline -15` — never start on a dirty tree you don't understand.

## 1. Golden rules
1. **Never delete, rewrite or "clean up" work you did not create in this task.** That includes files, functions, styles, tests and doc sections. If you think something is wrong, leave it and write a note in PROGRESS.md under *Open issues* (or ask Aryan).
2. **Never overwrite a file wholesale** if it already exists. Make targeted edits. If a large rewrite is truly needed, ask Aryan first.
3. **One task, one branch, one owner.** Claim the task in ROADMAP.md before starting. Don't edit files that belong to another agent's in‑progress task (see §3).
4. **Specs before code.** If your change alters an API shape, data model, route, token, component contract or a product decision, update the relevant doc **in the same commit**.
5. **Ask before big moves.** New dependency outside the pinned stack, changing a pinned decision, deleting anything, renaming folders, force‑pushing, or touching `main` directly → ask Aryan.
6. **Leave it green.** Before you hand off: `npm run lint`, `npm run typecheck` (web), `npm test` pass, and the app starts. If you can't make it green, say so in PROGRESS.md with the error.
7. **No secrets in git.** Only `.env.example`. Never print keys in logs.
8. **UI/UX is the grade.** Any UI must follow DESIGN_SYSTEM.md and include loading/empty/error states. "Works but ugly" is not done.

## 2. Repository layout
```
/AGENTS.md  /GEMINI.md  /CLAUDE.md  /README.md
/docs/       PRD, DESIGN_SYSTEM, FRONTEND, BACKEND, ROADMAP, PROGRESS, DECISIONS
/web/        React app (see docs/FRONTEND.md)
/server/     Express API (see docs/BACKEND.md)
```

## 3. Ownership & claiming work
- The **unit of ownership** is a ROADMAP task. Its owner owns the files that task creates or changes until the task is `[x]` and merged.
- Default: **@gemini owns application code**; **@claude** owns tasks marked `@claude` (seed content, prompt/pipeline logic, UX/QA reviews, README) and anything Aryan hands it.
- **To claim**: change `[ ]` → `[~]`, add `@you (branch-name)`, commit that change alone on `main`‑synced branch or as the first commit of your branch, and add a PROGRESS entry "Started X".
- **Shared files** (touched by many tasks) — edit with extra care, small additive changes only, never reorder/reformat existing content:
  `web/src/app/router.tsx`, `web/src/lib/queryKeys.ts`, `web/src/types/api.ts`, `web/src/styles/globals.css`, `tailwind.config.*`, `server/src/app.js`, `server/src/routes/index.js`, `package.json` files, all `docs/*`.
- **Foreign file rule:** if you must change a file owned by another in‑progress task, don't. Add a note in PROGRESS.md *Handoffs needed* addressed to that owner.
- **Handoff:** when you stop mid‑task, set the task to `[~]` with a PROGRESS entry describing exactly where you stopped, what's left, and any gotchas. The next agent continues on the same branch.

## 4. Docs are the source of truth
| If you change… | Update… |
|---|---|
| An endpoint, request/response shape, socket event | `docs/BACKEND.md` §3/§7 **and** `web/src/types/api.ts` |
| A Mongo model or field | `docs/BACKEND.md` §4 |
| An AI prompt or output schema | `docs/BACKEND.md` §5 and bump `PROMPT_VERSION` |
| A route, folder, state rule, convention | `docs/FRONTEND.md` |
| A color, size, component, copy pattern | `docs/DESIGN_SYSTEM.md` |
| Scope, a user flow, acceptance criteria | `docs/PRD.md` (only with Aryan's OK) |
| A pinned tech choice / trade‑off | append to `docs/DECISIONS.md` |
| Task status | `docs/ROADMAP.md` |
| Anything you did | `docs/PROGRESS.md` (always) |

Docs edits follow the same "don't delete others' content" rule: append or amend, mark superseded text with ~~strikethrough~~ and a note rather than silently removing it.

## 5. Git conventions
- `main` is always runnable. No direct commits to `main` except ROADMAP claims and PROGRESS entries, and only if Aryan allows; otherwise use branches.
- Branch: `<agent>/<taskId>-<short-slug>` → `gemini/F2.5-thread-list`, `claude/B1.3-seed-data`.
- Commits: Conventional Commits with task id: `feat(inbox): F2.5 thread list with keyboard nav`, `fix(server): B1.8 search on summary`, `docs: update BACKEND §3 drafts`, `chore: P0.1 workspace scripts`.
  Add a trailer identifying the agent: `Agent: gemini` or `Agent: claude`.
- Small commits, one concern each. Never `git push --force` on shared branches; never rewrite history someone else pushed.
- Merge to `main` only after the task's checks pass; prefer squash‑merge with the task id in the title. Aryan merges unless they delegate it.
- Before starting work: `git pull --rebase` on `main` and rebase your branch.

## 6. Progress log format (`docs/PROGRESS.md`)
Newest at the top, one entry per work session:
```md
### 2026-11-14 18:30 · gemini · F2.5 thread list
- Done: ThreadList + ThreadRow with skeleton/empty/error, URL-driven segment, j/k nav.
- Changed contracts: none.
- Next: filter chips, search debounce.
- Notes/risks: virtualisation deferred; fine up to ~200 rows.
```

## 7. Code quality bar (prototype, but clean)
- Follow FRONTEND.md / BACKEND.md conventions. No `any`, no dead code, no commented‑out blocks, no `console.log` left behind (server uses the logger).
- Keep components < ~200 lines; extract when larger.
- **Reuse before you build (D17).** Check `docs/DESIGN_V2.md` §8 and `web/src/components` first. Extend a shared component with a prop instead of copying it; the landing page uses the same components as the app with sample data.
- Every user‑facing async action: loading state, success feedback, error feedback.
- Anything simulated is labelled in UI and listed in README "What's simulated".
- AI calls only through `server/src/ai` providers. Frontend never calls an LLM directly.

## 8. When unsure
Stop and write the question in PROGRESS.md *Questions for Aryan*, choose the most reversible option to continue with, and say which one you chose.
