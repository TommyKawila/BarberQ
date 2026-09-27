# RPT-004-ENG — SPR-004 Founder QA / Staging System v1

| | |
|---|---|
| Linked Sprint | [SPR-004](../sprints/SPR-004-FOUNDER-QA-STAGING-SYSTEM-V1.md) |
| Linked UX | [UX-004](../handoffs/UX-004-FOUNDER-QA-STAGING-SYSTEM-V1.md) |
| Date | 2026-09-27 |
| Author | Engineering / Cursor |
| Sprint state after this report | **READY_FOR_QA** |
| Live `qa:verify` READY | **NO** |

## 1. Implementation summary

Fail-closed CLI tooling lets the Founder reset and verify an isolated Founder QA tenant without targeting Production or PHINX. `qa:verify` is read-only and was implemented and tested before `qa:reset`. External Vercel/Supabase/LINE projects are not created in this delivery.

## 2. Files changed

- `src/lib/founder-qa/*` (manifest, env, verify, reset, CLI, tests)
- `supabase/founder-qa/bootstrap.sql` (QA-project-only; not numbered)
- `package.json` scripts `qa:verify`, `qa:reset`, `qa:reset:owner-claim`
- `.env.example` `BARBERQ_ENV` comment
- `docs/barberqx-os/runbooks/FQA-00-21-FOUNDER-QA.md`
- this report

`scripts/clone-shop.js` was not extended. SPR-002 / SPR-003 artifacts were not modified. No `/__qa`.

## 3. Environment model

`BARBERQ_ENV` = `local` | `founder_qa` | `production`. Parsed only by Founder QA CLI. It does not grant authentication, authorization, or role privileges. Production runtime hardening (`NODE_ENV === "production"` → no memory store, no LINE mock) is unchanged.

## 4. QA manifest/constants

Checked-in in `src/lib/founder-qa/manifest.ts`:

- Canonical shop UUID / `BarberQ Pilot Test` / `barberqpilottest`
- Sentinel UUID / `BarberQ Isolation Sentinel` / `barberqisolationsentinel`
- Johnny / Peter / Jack UUIDs
- Fixture version `fqa-fixtures-v1`
- QA project ref + hostname placeholders (`unprovisioned-founder-qa`, `unprovisioned-founder-qa.example.invalid`)
- Production denylist ref `lbnlsdkpajvczndodvjn` and hostname `barber-q-pi.vercel.app`
- PHINX id/slug/name denylist

Allowlist UUIDs are independent of runtime env. Replacing QA placeholders later must not reuse Production identities.

## 5. qa:verify

`npm run qa:verify` SELECTs only, then `evaluateVerify`. Covers env, project, Production rejection, hostname, canonical tenant, sentinel, manager schema, fixture version, Owner baseline, Johnny/Peter/Jack, Managers/invites/appointments, hours, connectivity, LIFF, not-memory, not-mock. Non-zero on failure. Secret-safe copy. Today this command cannot PASS against a real Founder QA project because that project does not exist.

## 6. qa:reset

`npm run qa:reset` prints the UX-004 target banner, re-observes live env, requires all guards, mutates only the canonical UUID, then post-verifies daily invariants. Extra argv (`--shop`, URLs) is rejected. Guard failure: refused + **No data was changed.** Mid-mutation failure: **Founder QA environment: NOT READY** (does not claim no mutation).

## 7. qa:reset:owner-claim

Distinct banner. Same guards. Resulting BC: pending shop, Owner LINE unlinked (not rewritten to a Founder ID), Managers/invites/appointments cleared, Johnny/Peter/Jack restored. Invite token is written to the existing `shops.invite_token` column and never printed. Operator copies the invite once from Super Admin on the QA host.

## 8. Canonical tenant fixtures

B0: active `barberqpilottest`, linked Owner preserved by daily reset, Johnny/Peter/Jack bookable/active/unlinked, `FOUNDER_QA_HOURS`, zero Managers/invites/appointments.

## 9. Isolation sentinel

`barberqisolationsentinel` is inserted by bootstrap SQL and excluded from reset writes. Used for Shop A → Shop B denial. No multi-shop Manager Product behavior.

## 10. Production rejection

Guards fail if `BARBERQ_ENV` is not `founder_qa`, if the live Supabase ref or hostname matches the checked-in Production denylist, or if they do not equal the checked-in QA allowlist.

## 11. PHINX rejection

Guards fail on PHINX UUID, slug `phinxstudio`, or name `PHINX STUDIO`.

## 12. Reset safety invariants

Canonical UUID+slug+name must all match. No arbitrary tenant target. Sentinel and Owner LINE preserved on daily reset. Post-reset verify required for PASS.

## 13. Secret-safe logging

Output formatters reject secret-like strings. Invite tokens, LINE IDs, and service keys are not printed.

## 14. Tests added

- `src/lib/founder-qa/verify.test.ts`
- `src/lib/founder-qa/reset.test.ts`

Included in `npm run test:security`.

## 15. Regression results

Regression results (2026-09-27):

- `npm run typecheck` — pass
- `npm run test:security` — 217 pass / 0 fail (includes 29 new Founder QA tests)
- `npm run test:shop` — 50 pass
- `npm run test:booking` — 26 pass
- `npm run test:onboarding` — 44 pass
- `npm run build` — pass (no `/__qa` route)
- `npm run lint` — 40 problems (31 errors, 9 warnings); pre-existing `react-hooks/set-state-in-effect` baseline. Unrelated files were not fixed.

## 16. FQA runbook readiness

[FQA-00-21-FOUNDER-QA.md](../runbooks/FQA-00-21-FOUNDER-QA.md) contains FQA-00 → FQA-21, sequences, evidence template, and provisioning steps. Live execution waits on MANUAL PROVISIONING.

## 17. Manual infrastructure provisioning still required

YES. Create QA Vercel + QA Supabase + dedicated LIFF; apply `0001`–`0025` + `supabase/founder-qa/bootstrap.sql`; set `BARBERQ_ENV=founder_qa`; replace manifest placeholders; bind three Founder LINE identities.

## 18. Real LINE/LIFF requirements

Founder QA must use real LIFF (`NEXT_PUBLIC_LIFF_ID` set). No mock auth, no role switcher, no impersonation.

## 19. Exact QA verification instructions

1. Confirm this report and that `qa:verify` / `qa:reset` exist.
2. Do not PASS live FQA until provisioning in §17 is done and `qa:verify` prints PASS against the QA project.
3. Then run the daily and Owner-claim sequences in the runbook.
4. Reuse `test:security` / shop / booking / onboarding; do not treat mocks as real-auth evidence.

## 20. Known limitations / deviations

- QA project ref/hostname are unprovisioned placeholders; live verify is NOT READY.
- Bootstrap SQL is not in the numbered Production migration chain (intentional).
- Owner-claim uses existing `shops` pending + `invite_token` columns; Super Admin remains the token-copy surface.
- No `/__qa`, no Product UX changes, no SPR-002/SPR-003 changes.

Do not PASS or LOCK this Sprint from this report.
