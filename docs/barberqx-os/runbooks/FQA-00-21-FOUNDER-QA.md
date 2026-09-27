# FQA-00 → FQA-21 — Founder QA runbook

Linked Sprint: [SPR-004](../sprints/SPR-004-FOUNDER-QA-STAGING-SYSTEM-V1.md)
Linked UX: [UX-004](../handoffs/UX-004-FOUNDER-QA-STAGING-SYSTEM-V1.md)

Code: **IMPLEMENTED**. Isolated Vercel + Supabase + LINE/LIFF project: **MANUAL PROVISIONING REQUIRED**.
`npm run qa:verify` is not READY against a live Founder QA environment until that infra exists and the checked-in manifest placeholders are replaced.

Do not record LINE user IDs, invite tokens, service-role keys, access tokens, or production personal data.

## Commands

| Command | Mutates? | Baseline |
|---|---|---|
| `npm run qa:verify` | No | Read-only readiness |
| `npm run qa:reset` | Canonical tenant only | B0 daily |
| `npm run qa:reset:owner-claim` | Canonical tenant only | BC Owner-claim |

Requires `BARBERQ_ENV=founder_qa` plus a live target that matches the checked-in QA project ref and hostname in `src/lib/founder-qa/manifest.ts`.

## Sequences

Daily:

`qa:verify` → `qa:reset` → `qa:verify` → automated suites → FQA-01 … FQA-21

Owner-claim:

`qa:verify` → `qa:reset:owner-claim` → `qa:verify` → FQA-00 → `qa:reset`

## LINE identity labels

Use Founder-controlled real LINE identities only. No login-as, impersonation, or manual LINE ID entry.

| Label | Use |
|---|---|
| Founder Owner | Owner claim and Owner admin |
| Founder Manager | Manager invite claim and Manager admin |
| Founder Customer | Customer booking / My Bookings |

## Baselines

| ID | Meaning |
|---|---|
| BC | Pending unclaimed canonical shop; no active Owner; Johnny/Peter/Jack present |
| B0 | Active Owner; zero Managers/invites; Johnny/Peter/Jack; zero appointments |
| B1 | B0 + Manager claimed |
| B2 | B1 + one Founder Customer booking |
| B3 | B2 + Manager revoked |

## Matrix

| FQA ID | Role | LINE identity | Starting baseline | qa:verify first? | Action | Expected result | Evidence | Type | Reset requirement |
|---|---|---|---|---|---|---|---|---|---|
| FQA-00 | Owner | Founder Owner | BC | Required before owner-claim reset and after claim | Claim canonical shop via real Owner invite + LINE | QA tenant claimed; verified Owner; shop active | screenshot + safe verify | Manual + automated | `qa:reset:owner-claim` |
| FQA-01 | Owner | Founder Owner | B0 | Required after environment setup/reset | Authenticate to QA admin | Owner reaches `barberqpilottest` only | screenshot / role+shop | Manual | B0 via `qa:reset` |
| FQA-02 | Owner | Founder Owner | B0 | No if continuous after FQA-01 | Open Manager management | Zero state + invite control | screenshot | Manual | none |
| FQA-03 | Owner | Founder Owner | B0 | No | Create Manager invite | One current-shop Manager invite | UI + invariant | Mixed | none |
| FQA-04 | Manager | Founder Manager | pending invite | No | Open invite + Manager LINE | Membership created; invite consumed | screenshot + invariant | Manual + automated | none |
| FQA-05 | Manager | Founder Manager | B1 | No | Enter admin | Assigned only to canonical QA tenant | screenshot + tenant check | Mixed | none |
| FQA-06 | Manager | Founder Manager | B1 | No | Attempt Owner identity/security mutation | Server 403; Owner unchanged | 403/test evidence | Automated + optional manual | none |
| FQA-07 | Manager | Founder Manager | B1 | No | Operate ordinary Barber state | Succeeds only inside QA shop | screenshot + state | Mixed | none |
| FQA-08 | Manager | Founder Manager | B1 | No | Attempt sentinel-tenant access/mutation | Denied; sentinel unchanged | isolation test | Automated | none |
| FQA-09 | Customer | Founder Customer | B1 | No | Open booking Barber selection | Manager absent; Johnny/Peter/Jack only | screenshot + query | Mixed | none |
| FQA-10 | Customer | Founder Customer | B1 | No | Book available slot via real LINE | Correct booking created | success screenshot/state | Manual + automated | none |
| FQA-11 | Owner/Manager | Founder Owner or Manager | B2 | No | Open Today | Booking visible under correct Barber/time | screenshot | Manual | none |
| FQA-12 | Customer | Founder Customer | B2 | No | Open My Bookings | Customer's booking visible | screenshot + state | Manual + automated | none |
| FQA-13 | Customer | Founder Customer | B2 | No | Cancel permitted booking | Cancelled everywhere | screenshot + state | Mixed | none |
| FQA-14 | Customer/system | Founder Customer | known slot | No | Attempt conflicting booking | Duplicate prevented | automated result | Automated | scenario cleanup |
| FQA-15 | Owner | Founder Owner | B1/B2 | No | Revoke Manager | Membership revoked; shop/booking preserved | screenshot + invariant | Mixed | none |
| FQA-16 | Manager | Founder Manager | B3 | No | Refresh / real LINE re-login | Manager admin denied | screenshot + auth | Manual + automated | none |
| FQA-17 | Owner + Manager | Founder Owner then Manager | B3 | No | Fresh invite + claim | New Manager access; old not reactivated | screenshot + invariant | Mixed | none |
| FQA-18 | Founder | any current role | operational | No | Critical paths at 375px | No blocking overflow/CTA issue | screenshots | Manual | none |
| FQA-19 | Founder | any current role | operational | No | Critical paths at 390px | Same | screenshots | Manual | none |
| FQA-20 | Founder | any current role | operational | No | Critical paths at 430px | Same | screenshots | Manual | none |
| FQA-21 | Founder | any current role | operational | No | Desktop critical-flow smoke | Critical flows usable | screenshots | Manual | none |

Rerun `qa:verify` on unexpected state before continuing. Do not reset between every row of a continuous daily scenario.

## Evidence template

Copy one block per FQA ID. Leave secret fields blank forever.

- FQA ID:
- date/time:
- role / identity label: (Founder Owner / Manager / Customer only)
- environment: founder_qa
- starting baseline:
- action:
- expected:
- actual:
- PASS / FAIL:
- screenshot/video reference:
- notes:
- reset required:

Forbidden in evidence: LINE user IDs, invite tokens, service secrets, access tokens, production personal data.

## MANUAL PROVISIONING REQUIRED

1. Create a dedicated Founder QA Vercel project and a dedicated QA Supabase project. Do not reuse Production service-role credentials.
2. Apply numbered migrations `0001`–`0025` on the QA project only.
3. Apply [`supabase/founder-qa/bootstrap.sql`](../../../supabase/founder-qa/bootstrap.sql) on the QA project only.
4. Configure production-equivalent env on the QA deploy: real Supabase URL/key, dedicated `NEXT_PUBLIC_LIFF_ID`, `NEXT_PUBLIC_APP_URL` = QA hostname, `BARBERQ_ENV=founder_qa`. No memory store. No LINE mock.
5. Replace `qaSupabaseProjectRef` and `qaAppHostname` in [`src/lib/founder-qa/manifest.ts`](../../../src/lib/founder-qa/manifest.ts) with the real QA identities. Leave Production/PHINX denylist unchanged.
6. Bind three Founder LINE identities (Owner, Manager, Customer) to the QA LIFF channel.
7. After FQA-00, use `qa:reset` for daily B0. Copy Owner invite once from Super Admin on the QA host only — never paste tokens into git, chat, or this runbook.
