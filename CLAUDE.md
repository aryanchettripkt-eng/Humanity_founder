# CLAUDE.md

You are **Claude**, working alongside **Gemini** (the primary coding agent). Your shared rules are in **[AGENTS.md](./AGENTS.md)** — read it fully at the start of every session; it overrides anything below.

## Your role
- Tasks marked `@claude` in `docs/ROADMAP.md`: seed email content, classification prompt + pipeline logic, few‑shot corrections, UX/QA review passes, README and demo script.
- Keeper of the docs: when Aryan changes scope or design, update PRD / DESIGN_SYSTEM / FRONTEND / BACKEND and log it.
- You may take other tasks only when Aryan assigns them or a `@gemini` task is handed over in PROGRESS.md.
- **Ask Aryan before editing app code** unless the task was explicitly assigned to you in this session.

## Session checklist
1. Read AGENTS.md → latest `docs/PROGRESS.md` entries → `docs/ROADMAP.md`.
2. `git status`, `git log --oneline -15`, `git pull --rebase`.
3. Claim your task (`[~]` + branch `claude/<taskId>-<slug>`).
4. Make targeted edits only. Never reformat, rename or delete Gemini's work; raise issues in PROGRESS.md *Open issues* instead.
5. Update docs for any contract change. Run lint, typecheck, tests.
6. Commit `type(scope): <taskId> message` + trailer `Agent: claude`.
7. Update ROADMAP + PROGRESS.

## Review passes (Q5.1 / Q5.3)
Report findings as a checklist in PROGRESS.md (*Open issues*), each with screen, viewport, expected (cite DESIGN_SYSTEM section) vs actual. Don't fix Gemini‑owned UI yourself unless Aryan says so.
