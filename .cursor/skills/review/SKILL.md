---
name: review
description: >-
  Stack-grounded review of code changes, PRs, or plans for BarberQx. Use when asked to review,
  critique, or assess quality — "review", "review this", "code review", "check this".
---

# Review

Thorough review grounded in **this BarberQx repo**. **Do NOT make changes — the review is the deliverable.**

Adapted from [poteto/brainmaxxing](https://github.com/poteto/brainmaxxing) `review` for Cursor. No `brain/` vault, hooks, or memory loop. Judgments use this repo's stack, product docs, and skills (`how`, `verify-barberq`).

**Track progress** with the session todo list (one todo per step below). Mark each in progress when starting and completed when done.

## Step 1 — Load Repo Grounding

Read fresh (do not rely on memory):

| Source | Why |
|--------|-----|
| `README.md` | Stack, layout, tenancy / security expectations |
| `docs/BRAND.md` + `README_FOR_CURSOR.txt` | Brand rules when UI/marketing changed |
| `docs/barberqx-os/CURRENT-STATE.md` + relevant sprint/handoff | Product truth / authorized scope |
| `docs/audit/P0-audit.md` | Known architecture hazards (booking overlap, roles, data layer) |
| `.cursor/skills/verify-barberq/SKILL.md` | **Required** — verification commands and feature map |
| `.cursor/skills/how/SKILL.md` | When the changed subsystem is unfamiliar — explain before judging |
| `package.json` + `.github/workflows/ci.yml` | What CI actually runs |
| Plan under `docs/plans/` if reviewing against a plan | Scope discipline |

### BarberQx review lenses

- Shop-scoped APIs and data isolation (no cross-tenant leaks)
- LINE customer identity vs shop staff roles vs `SUPERADMIN_TOKEN`
- Prefer `/api/[shop]/…` over legacy unscoped routes for new work
- Memory store is local prototype only; production paths need Supabase + env gates
- Brand hierarchy on customer vs marketing vs admin surfaces
- Do not accept silent scope creep (reminders, no-show automation, CRM, payments, etc.) unless the change/plan explicitly includes it

## Step 2 — Determine Scope

Infer what to review from context — user message, recent diffs, PR, or `docs/plans/…`. If genuinely ambiguous, ask.

Auto-detect review mode from change size:
- **BIG CHANGE** (50+ lines changed, 3+ files, or new architecture) — all sections, at most 4 top issues per section
- **SMALL CHANGE** (under those thresholds) — one issue per section

## Step 3 — Gather Context

For **SMALL CHANGE**, read files directly in the main context.

For **BIG CHANGE**, delegate exploration to subagents (`Task` / explore):
- Read the code or plan under review
- Identify dependencies, callers, and downstream effects
- Map relevant types, tests, migrations, and infrastructure

If the area is unfamiliar, run **how** (explain mode) first, then continue the review.

Run multiple explorers in parallel for independent areas.

## Step 4 — Gather Domain Skills + Run Verification

1. Check `.cursor/skills/` for domain matches. **Invoke** `verify-barberq` for every review that touches app code, tests, or QA paths.
2. From `verify-barberq`, match the change to `references/features/*.md` and run the **baseline** plus **feature-scoped** commands that apply.

### Minimum command bar (CI parity)

```bash
npx next typegen   # if .next/types missing
npm run typecheck
npm run lint
npm run test:security
npm run test:shop
npm run test:booking
npm run test:onboarding
```

Run only the `test:*` scripts needed for a tiny change, but for BIG CHANGE / PR review run the full set (and build with CI placeholder env when claiming production-readiness — see verify-barberq).

Founder QA when relevant: `npm run qa:verify` (`BARBERQ_ENV=founder_qa` + QA Supabase; see `docs/qa-setup.md`).

Record pass/fail evidence in the review. Missing tests for new behavior is a **high** severity issue.

Do not invent CDP desktop drivers or scripts that are not in this repo.

## Step 5 — Assessment Pipeline

Work through sections in order.

### 1. Scope Check

If reviewing against a plan phase under `docs/plans/`:
- Read the assigned phase
- Run `git diff --stat` and `git log --oneline` for relevant commits
- Flag files changed outside the phase's stated scope as scope violations

If no plan applies, skip this subsection — still flag product-OS out-of-scope creep.

### 2. Architecture
- System design and component boundaries (App Router routes, `src/lib/services`, `src/lib/data`)
- Coupling and dependency direction
- Data flow / bottlenecks
- Security: auth, shop scoping, API boundaries, uploads, tokens

### 3. Code Quality
- Module organization
- DRY — be aggressive
- Error handling and missing edge cases
- Over- / under-engineering; redesign-from-first-principles when bolted-on
- Technical debt hotspots

### 4. Tests
- Gaps vs `test:security` / `test:shop` / `test:booking` / `test:onboarding`
- Assertion strength (outcomes, not implementation trivia)
- Untested failure modes
- New behavior must have new tests wired into an existing `test:*` script

### 5. Performance
- N+1 / repeated Supabase calls
- Unnecessary client waterfalls in App Router
- Heavy client bundles on LIFF booking paths
- Slow or high-complexity paths on board / slots

### Stack / product compliance

For each changed file, check against Step 1 grounding. Common violations:
- Cross-tenant data or unscoped API for new shop features
- Merchant/BarberQx brand hierarchy broken
- Missing verification (prove-it-works via verify-barberq)
- Unnecessarily added complexity
- Scope beyond the sprint/handoff

## Step 6 — Issue Format

**NUMBER** each issue (1, 2, 3…). For every issue:

- Describe the problem concretely with file and line references
- Severity: **high** (blocks acceptance), **medium** (worth fixing; multiple may block), **low** (style/minor)
- Present 2–3 options with **LETTERS** (A, B, C), including "do nothing" where reasonable
- For each option: effort, risk, impact on other code, maintenance burden
- Recommend an option and why (mapped to repo constraints / verify-barberq proof)
- Ask whether the user agrees or wants a different direction

### Severity Guide

- **high**: Incorrect behavior, missing tests for new behavior, tenancy/auth leak, scope violation on core files, brand-critical customer UI break, verify-barberq baseline failing
- **medium**: Worth fixing alone not blocking; multiple mediums may trigger **Revise**
- **low**: Style, docs, minor improvements — note, don't block

When asking the user to choose, label options with issue NUMBER and option LETTER. Recommended option first.

## Step 7 — Verdict

After all issues:

- **Accept**: Checks pass, scope clean, tests present and passing (verify-barberq evidence)
- **Accept with notes**: Low-severity only; list optional follow-ups
- **Revise**: High-severity issues (or enough mediums). Cite file, context, and which constraint/proof failed

## Interaction Rules

- Do not assume timeline or scale priorities
- Do not make changes — present findings and wait for direction
- Present all sections together, then ask for feedback once at the end
- If something can be tested, note the exact `npm run …` / feature path from verify-barberq in the issue
