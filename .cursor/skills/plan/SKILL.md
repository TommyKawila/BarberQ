---
name: plan
description: >-
  Break down medium-to-large tasks into phased plans in docs/plans/. Planning only — does not
  implement. Use for new features, multi-file refactors, or architectural changes — not small
  fixes. Triggers: "plan this", "break this down".
---

# Plan

Produce implementation plans grounded in **this BarberQx repo**. Write plans to `docs/plans/`. **Do NOT implement anything — the plan is the deliverable.**

Adapted from [poteto/brainmaxxing](https://github.com/poteto/brainmaxxing) `plan` for Cursor. No `brain/` vault, hooks, or memory loop — plans are normal repo docs under `docs/plans/`.

**Track progress** with the session todo list (one todo per step below). Mark each in progress when starting and completed when done.

## Step 0 — Triage Complexity

Before the full planning workflow, assess whether this task needs a plan:

**Trivially small (1–2 files, obvious approach):**
Tell the user this task doesn't need a plan and suggest implementing directly without the plan skill. **Stop here — do not implement.**

**Needs planning (proceed to Step 1):**
- The change spans 3+ files or introduces new architecture
- There are multiple valid approaches and the user should weigh in
- The task has unclear scope or cross-cutting concerns
- The user explicitly asks for a plan

## Step 1 — Load Repo Grounding

Read fresh (do not rely on memory):

| Source | Why |
|--------|-----|
| `README.md` | Product map, stack, layout, security/tenancy |
| `docs/BRAND.md` + `README_FOR_CURSOR.txt` | Brand hierarchy (merchant vs BarberQx) when UI is in scope |
| `docs/barberqx-os/CURRENT-STATE.md` | Pilot truth / current product state |
| Relevant sprint/handoff under `docs/barberqx-os/` | If the task maps to a named sprint |
| `docs/audit/P0-audit.md` | Architecture notes when touching booking/auth/data |
| `.cursor/skills/how/SKILL.md` | If the area is unfamiliar — use **how** to explain before planning |
| `.cursor/skills/verify-barberq/SKILL.md` | Verification commands and feature map for the plan's Verification sections |
| `package.json` | Real scripts (`lint`, `typecheck`, `test:*`, `qa:*`, `build`) |
| Next.js docs under `node_modules/next/dist/docs/` | Before planning App Router / Next 16 APIs (see `AGENTS.md`) |

### BarberQx constraints (always apply)

- **Multi-tenant:** shop-scoped data and APIs (`/{shopSlug}`, `/api/[shop]/…`). Prefer shop-scoped routes over legacy unscoped `/api/*`.
- **Roles:** customer = LINE; owner/barber/manager = shop staff; superadmin = `SUPERADMIN_TOKEN` (not a shop role).
- **Data:** Supabase (service role) in production; memory store only when Supabase env is unset (local prototype).
- **Brand:** customer pages → merchant primary; BarberQx = small platform signature. Marketing → BarberQx primary.
- **Timezone / copy:** Bangkok timezone; Thai UX copy where product surfaces already use it.
- **Scope discipline:** do not expand into reminders, no-show automation, CRM, payments, or other out-of-sprint claims unless the user explicitly includes them.

## Step 2 — Define Scope and Constraints

Resolve ambiguity before deep exploration:

- What is in scope vs explicitly out of scope?
- Constraints (dependencies, env, existing patterns, brand, tenancy)?
- What does "done" look like?

Offer concrete options when asking. If the request is already clear, confirm scope boundaries briefly and move on.

## Step 3 — Explore Context with Subagents

**Always** delegate large exploration to subagents (`Task` / explore). Do not dump the whole codebase into the main context.

Spawn explorers to:
- Read existing code in affected areas
- Identify patterns, conventions, and dependencies
- Map architecture relevant to the change
- Find tests, types, migrations, and related infrastructure

Run multiple explorers in parallel for independent areas. For a narrow unfamiliar subsystem, invoke the **how** skill first, then continue planning.

## Step 4 — Gather Domain Skills

Check `.cursor/skills/` for skills that match the plan's domain. **Invoke matched skills** — incorporate their guidance into the plan.

In this repo, at minimum:

| Domain | Skill |
|--------|-------|
| "How does X work?" before planning | `how` |
| Verification / QA commands | `verify-barberq` |

List applicable skills by name in the plan overview so implementers invoke them.

Do **not** invent or install one-off skills from the internet for this project unless the user asks.

## Step 5 — Write the Plan

Create plan files under `docs/plans/` (repo docs, not a private vault):

1. Create `docs/plans/NN-slug-name/overview.md` (or a single file for simple plans)
2. Create phase files as needed
3. Update `docs/plans/index.md` with a link to the new plan

Use the next free `NN` from `docs/plans/index.md` (two-digit, zero-padded).

### Phase sizing

- **1 function/type + tests** per phase, or **1 bug fix** — not "one file" or "one component"
- **Max 2–3 files touched** per phase when possible
- **Prefer 8–10 small phases** over 3–4 large ones
- If a phase lists >5 test cases or >3 functions, split it

For small plans, a single file at `docs/plans/NN-plan-name.md` is fine.

For plans with 3+ phases, use a directory:

```
docs/plans/01-example/
├── overview.md
├── phase-1-scaffold.md
├── phase-2-domain.md
├── phase-3-ui.md
└── testing.md
```

### Overview file

Must include:
- **Context** — problem and why
- **Scope** — included / explicitly excluded
- **Constraints** — stack, tenancy, brand, env, patterns to preserve
- **Applicable skills** — e.g. `how`, `verify-barberq`
- **Phases** — ordered links to phase files
- **Verification** — repo-level commands from `verify-barberq` / CI

### Phase files

Each phase file must include:
- Back-link to the overview
- **Goal**
- **Changes** — files affected and what changes (high level)
- **Data structures** — key types/schemas named; one-line sketch only
- **Verification** — static + runtime for this phase (Step 6)

**Keep plans high-level.** Describe *what* and *why*, not code-level *how*. No large code snippets or pseudocode.

Order: infrastructure and shared types first, features after. Each phase should be independently shippable when possible.

**Skill changes:** If a phase creates/updates a skill under `.cursor/skills/`, say so explicitly and keep scope to skill/docs only unless the user asked for app code.

### Redesign check

For changes touching existing code: if building from scratch with this requirement, what would we build? Prefer holistic redesign over bolted-on patches when the cost is justified.

### Alternatives check

For architectural decisions, briefly sketch 2–3 approaches in Constraints. State which was chosen and why.

## Step 6 — Verification Strategy

Every phase **must** have verification. Ground it in **verify-barberq** — do not invent scripts.

### Static (CI parity)

```bash
npx next typegen   # if .next/types missing
npm run typecheck
npm run lint       # non-blocking in CI today; still run
npm run test:security
npm run test:shop
npm run test:booking
npm run test:onboarding
```

Pick the `test:*` scripts that match the phase (see `.cursor/skills/verify-barberq/SKILL.md` and `references/features/`).

### Runtime / proof

- Manual path: LIFF booking, admin board, invite claim, superadmin, etc. as relevant
- Automated tests to add under `src/lib/**/*.test.ts` wired into existing `test:*` scripts
- Edge cases
- UI: screenshot when customer/admin visuals change
- Founder QA when touching QA fixtures: `npm run qa:verify` (requires `BARBERQ_ENV=founder_qa` + real QA Supabase — see `docs/qa-setup.md`)

"It compiles" is not verification. Each phase must say how to **prove** it works.

## Step 7 — Update Plans Index

Update `docs/plans/index.md` with a markdown link to the new plan's overview.

## Step 8 — Present to User

Summarize: phases, scope boundaries, applicable skills, verification approach. Ask the user to review the files under `docs/plans/`.

**Stop here.** Do not begin implementation. The user decides when and how to execute the plan.
