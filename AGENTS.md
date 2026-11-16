<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent working rules

Standing rules for coding agents in this repo. For how / plan / review / verify flows, use the skills under `.cursor/skills/` (`how`, `plan`, `review`, `verify-barberq`) instead of restating them here. `CLAUDE.md` only points at this file.

## 1. Fix repeated mistakes with checks, not prose

When an agent or reviewer finds a recurring mistake, prefer a test, lint rule, type check, or CI check that catches it. Add a written rule only if an automated check is not practical.

Example: pricing / trial terms in code and copy must come from one source-of-truth config, and a test should assert copy matches that config (do not hardcode divergent values).

## 2. Stay mergeable

Before asking for review or marking ready: rebase on latest `main` and resolve conflicts. If the branch is behind `main` or conflicted, fix that before reporting. If it cannot be fixed in the current run, say so in the PR body as `behind main by N`.

## 3. Migrations and env changes are gated

- Any PR with a DB migration must include a precheck SQL (pattern: `docs/sql/0052-precheck.sql`) and state whether it has been applied on QA.
- Agents never apply migrations to production; that needs the owner's explicit approval.
- Repo migration files must match what is on QA — no QA-only schema drift. See `docs/qa-setup.md` and `supabase/migrations/`.

## 4. PR body must include product reason + verification + approvals

Every PR body states:

1. User-facing / product reason for the change (not “CI passes”).
2. What was verified and how (`PASS` / `FAIL`).
3. What still needs owner approval.

Verification commands and feature paths: `.cursor/skills/verify-barberq/SKILL.md`.

## 5. Hard stops

- Never merge PRs.
- Never touch production data or secrets.
- Never send LINE messages or real payments from agent runs.
