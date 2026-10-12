---
name: verify-barberq
description: "Verify BarberQx (BarberQ) changes with this repo's real scripts and feature paths: lint, typecheck, unit tests, build, founder QA, and LINE LIFF / queue / booking / admin flows."
disable-model-invocation: true
---

# Verify BarberQx

Prove BarberQx changes with the **commands and surfaces that exist in this repo**. Adapted from [poteto/verification-skill-example](https://github.com/poteto/verification-skill-example) (Atlas / Harbor Labs sample shape) for this Next.js LINE LIFF barbershop queue/booking app.

Do not invent a CDP desktop driver. BarberQx is a web app: verify with `npm` scripts, Founder QA CLI, and browser paths documented below.

## Stack snapshot (keep current)

| Layer | This repo |
|-------|-----------|
| App | Next.js 16 App Router, React 19, TypeScript |
| UI | Tailwind CSS 4 |
| Auth / client | LINE LIFF (`@line/liff`), shop-scoped staff sessions |
| Data | Supabase JS (Postgres + Storage) or in-memory store when Supabase env is unset |
| Time | `date-fns` / `date-fns-tz` (shop timezone Bangkok) |
| Product | Multi-tenant shops at `/{shopSlug}`; admin under `/{shopSlug}/admin`; platform at `/superadmin`, `/pilot`, `/owner/join`, `/manager/join`, `/trial` |

Read `package.json`, `README.md`, `.env.example`, and `docs/qa-setup.md` before expanding this skill.

## Pick a flow

1. Match the change to one or more files under [`references/features/`](references/features/).
2. Run the **baseline** commands that CI runs (below).
3. Run the **feature-scoped** tests / QA / browser checks from those feature files.
4. Capture evidence a skeptical reviewer accepts (test output, `qa:verify` report, screenshots of LIFF/admin when UI changed).

## Baseline (CI parity)

GitHub Actions (`.github/workflows/ci.yml`) runs:

```bash
npm ci
npx next typegen          # generates .next/types before tsc
npm run typecheck
npm run lint              # currently non-blocking in CI (known baseline)
npm run test:security
npm run test:shop
npm run test:booking
npm run test:onboarding
```

Production build needs placeholder env (same as CI — never real secrets):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key \
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key \
NEXT_PUBLIC_LIFF_ID=0000000000-placeholder \
NEXT_PUBLIC_APP_URL=https://example.com \
SUPERADMIN_TOKEN=ci-placeholder-superadmin-token \
npm run build
```

Local prototype (memory store): omit Supabase keys, run `npm run dev`, open http://localhost:3000. Seed shop slug example: `phinxstudio`.

## Script map

| Script | Use when |
|--------|----------|
| `npm run lint` | Any TS/TSX change; note CI does not fail on lint yet |
| `npm run typecheck` | Any TypeScript / route / props change (run `npx next typegen` first if `.next/types` missing) |
| `npm run test:booking` | Customer booking flow / UX |
| `npm run test:shop` | Hours, slots, shop setup, cover, team queue UX, board visibility |
| `npm run test:security` | Auth, env hardening, owner/manager claim, invites, superadmin unlink, trial CRM |
| `npm run test:onboarding` | Activation, setup team/hours/link UX, LINE OA install |
| `npm run build` | Env gates, production bundle |
| `npm run qa:verify` | Founder QA env health (`BARBERQ_ENV=founder_qa` + real QA Supabase) |
| `npm run qa:reset` | Destructive QA fixture reset (founder_qa only) |
| `npm run qa:reset:owner-claim` | Reset shop to pending owner-claim for QA |

## Proof bar

- Prefer the same paths customers and staff use: LIFF booking, admin board, invite claim, superadmin — not only unit tests when the change is UI/API integration.
- Unit tests count when they cover the module under change (`src/lib/**/*.test.ts` via the `test:*` scripts).
- Mocks are fine only behind the same boundary production uses when a dependency is missing (e.g. memory store without Supabase; `pushText` no-ops without `LINE_CHANNEL_ACCESS_TOKEN`).
- Do not put production keys or customer PII in chat, PR, or skills.
- Lint may warn; typecheck + the four `test:*` scripts + build must pass before claiming green (match CI).

## Driving conventions

- Shop-scoped APIs: prefer `/api/[shop]/…` over legacy unscoped `/api/bookings` etc.
- Customer identity is LINE. Owner/barber are shop staff rows. Super Admin is `SUPERADMIN_TOKEN`, not a shop role.
- Brand: on customer pages merchant wins; BarberQx is a small platform signature (`docs/BRAND.md`, `README_FOR_CURSOR.txt`).
- Thai UX copy and Bangkok timezone matter for booking/hours proofs.

## Feature map

Behavior inventory: [`references/features/`](references/features/). Each file uses: `Sub-features`, `How to get to it (user POV)`, `Verifying with repo commands`, `Gotchas`.

For a broad sweep, walk [`references/features/README.md`](references/features/README.md) top to bottom.
