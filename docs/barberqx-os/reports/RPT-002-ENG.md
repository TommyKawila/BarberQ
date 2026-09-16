# RPT-002-ENG — SPR-002 Pilot Readiness & Real-Use Validation

| | |
|---|---|
| Linked Sprint | [SPR-002](../sprints/SPR-002-PILOT-READINESS-REAL-USE-VALIDATION.md) |
| Linked UX | [UX-002](../handoffs/UX-002-PILOT-READINESS-REAL-USE-VALIDATION.md) |
| Locked baseline | [SPR-001](../sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) **LOCKED** |
| Date | 2026-09-16 |
| Author | Engineering / Cursor |
| Pass type | **Validation preparation only** |
| Sprint state after this report | **READY_FOR_ENGINEERING** (not advanced) |
| Application code changed | **No** |

## 1. Validation commit / build / environment

| | |
|---|---|
| Git commit | `156baae4a0fc0d5ec9d9976d6fd4453b15e59af9` |
| Message | `product: approve UX-002 and authorize validation` |
| Branch | `main` (fast-forwarded to `origin/main`) |
| Node/app | Next.js 16.3.4 production `next build` on this commit |
| Local prototype / LINE mock as Shop #1 proof | **Not used.** Required LIFF and Supabase keys are present, so local runtime is not LINE-mock and not memory-store. That still is **not** physical-device LINE in-app evidence. |

Working tree during this pass:

- Unrelated marketing WIP was stashed and **not** included (`SalesPage.tsx`, `MarketingFooter.tsx`, mockups).
- Untracked `public/marketing/barberqx/after-organized-workflow-old.png` was left uncommitted.
- No application source was edited for SPR-002.

## 2. Files changed

This Engineering pass expects **zero application-code change**.

- this report
- narrow note on [SPR-002](../sprints/SPR-002-PILOT-READINESS-REAL-USE-VALIDATION.md) that validation prep started and this report exists — **state remains READY_FOR_ENGINEERING**

No booking, auth, LIFF, tenant, schema, or UI implementation files were modified.

## 3. Automated baseline

Run on commit `156baae`. Failures were **not** auto-fixed.

| Command | Result | Classification |
|---|---|---|
| `npm run lint` | Fail — 27 errors, 8 warnings | **Pre-existing unrelated** (locked SPR-001 baseline). Same `react-hooks/set-state-in-effect` / unused-import class. No new SPR-002 lint regression was introduced because no app code changed. |
| `npm run typecheck` | Pass | — |
| `npm run test:security` | Pass (157) | — |
| `npm run test:shop` | Pass (50) | — |
| `npm run test:booking` | Pass (26) | — |
| `npm run test:onboarding` | Pass (44) | — |
| `npm run build` | Pass | — |

Lint files (unchanged from locked baseline; not fixed in this Sprint):

- `scripts/clone-shop.js`
- `src/app/(app)/bookings/page.tsx`
- `src/app/(app)/owner/join/page.client.tsx`
- `src/app/(app)/pilot/page.tsx`
- `src/app/(operator)/superadmin/page.tsx`
- `src/app/(operator)/superadmin/trial-leads/page.tsx`
- `src/app/admin/my-schedule/page.tsx`
- `src/app/admin/setup/line-support/page.tsx`
- `src/app/admin/staff/[id]/page.tsx`
- `src/app/admin/staff/page.tsx`
- `src/app/admin/stats/page.tsx`
- `src/app/api/[shop]/settings/route.ts`
- `src/components/admin/QuickBlockGrid.tsx`
- `src/components/barber/BarberAvatar.tsx`
- `src/components/customer/BookingApp.tsx`
- `src/components/superadmin/LineSupportInbox.tsx`
- `src/components/superadmin/ShopCard.tsx`
- `src/components/superadmin/trial-leads/TrialLeadDetail.tsx`
- `src/components/superadmin/trial-leads/TrialLeadsCrm.tsx`
- `src/lib/admin/use-admin-line-auth.ts`
- `src/lib/data/memory-store.ts`
- `src/lib/line/use-line-auth.ts`
- `src/lib/owner/use-owner-claim.ts`
- `src/lib/services/stats-service.ts`

No suspected defect or P0 candidate was raised from automated suites. Booking tests still cover shop isolation, double-booking conflict, and sender-neutral Add Friend copy.

## 4. Config / environment readiness (no secrets)

Presence-only check of local `.env.local`. Values were not copied into this report.

| Key | Status | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | SET | Combined with service role → `getStore()` uses Supabase, not memory store |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | SET | |
| `SUPABASE_SERVICE_ROLE_KEY` | SET | |
| `NEXT_PUBLIC_LIFF_ID` | SET | `useLineAuth` mock mode is **off** (`mockMode = !liffId`) |
| `NEXT_PUBLIC_APP_URL` | SET | HTTPS, non-loopback (host not printed) |
| `SUPERADMIN_TOKEN` | SET | Operator auth present; not used as Shop #1 proof |
| `NEXT_PUBLIC_LINE_OA_ADD_URL` | SET | Optional Add Friend URL present. **Not** treated as verified BarberQx sender identity |
| `LINE_CHANNEL_ACCESS_TOKEN` | SET | Present. **Not** treated as sender-identity proof |
| `NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL` | MISSING | Optional setup-help CTA; not required for the approved booking path |

Sender identity remains **unverified** from repository/config (SPR-001 lock / PD-010). Customer Add Friend copy stays sender-neutral. Env names and token presence were not used to claim BarberQx or shop OA as the message sender.

Inspection only (no modification):

- LIFF login stores a same-origin return path (`src/lib/line/liff-return.ts`).
- Customer booking is `/{shopSlug}` then `/{shopSlug}/bookings`.
- Cancellation is permitted only **≥60 minutes** before start (`CANCEL_LEAD_MINUTES`).
- Owner “ready” helper: claimed shop + ≥1 bookable barber + at least one open hours day (`deriveShopActivation`). First booking is tracked but not required for `ready`.

**Production-like local config is present enough to run controlled validation after Shop #1 is named.** It does **not** replace the required physical-device LINE in-app booking.

## 5. Shop #1 qualification / evidence readiness

**Not ready.**

Founder confirmed Shop #1 tenant is **not identified**. `/phinxstudio` is a seed/demo tenant and was **not** used as Shop #1 (SPR-002 §5.A.1).

Qualification evidence, 599 THB/month acknowledgement, intended shop LINE OA booking entry, owner access, team/hours, and Today-queue checks were **not executed**.

## 6. Setup / activation

**Not executed.** No elapsed setup time. Measurement targets ≤15 minutes remain targets only.

## 7. Physical-device LINE in-app test

**Not executed.** Cursor desktop browser is not LINE in-app.

Founder will run this on a real phone **after** naming Shop #1. Engineering will script the checklist, observe/diagnose, and record evidence. Mock/LIFF-desktop is not a substitute.

| Field | This pass |
|---|---|
| Device | — |
| OS | — |
| Viewport | — |
| Inside LINE | no (not run) |
| Result | not run |
| Elapsed booking time | — |
| Assistance required | — |

## 8. Customer booking path

**Not executed** (depends on named Shop #1 + LINE in-app).

Deferred path: shop LINE OA → correct shop context → LIFF login/return → barber → date → time → confirm → Booking Success → My Bookings → cancel if `canCancelAt`.

## 9. My Bookings / cancellation

**Not executed.** Existing policy: cancel only when status is confirmed and start is ≥60 minutes away.

## 10. Owner tasks

**Not executed.** Deferred: correct tenant, team/hours, Today queue, barber association, availability controls, new booking visible, no developer intervention for normal operation.

## 11. Responsive / mobile

**Not executed** (375 / 390 / 430 / desktop). No Shop #1 customer/owner critical states were exercised in this pass.

## 12. Integrity / protected boundaries

Automated evidence only (no live Shop #1 traffic):

- `test:booking` conflict + cross-shop rejection + list isolation: pass
- `test:security` auth/tenant/env hardening: pass
- `test:shop` shop-scoped staff/board/hours: pass
- `test:onboarding` activation/LINE OA install credential rejection: pass

No live tenant-leakage, double-booking, outage, or LINE/auth P0 was observed because the Activation Gate was not started.

## 13. Findings (exactly one class each)

| ID | Classification | Observation |
|---|---|---|
| VAL-002-01 | **Activation Blocker** | Shop #1 tenant, qualification evidence, and intended shop LINE OA booking entry are not identified. Physical-device LINE in-app booking, owner gate, and responsive checks are therefore incomplete. Founder will run the phone path after naming the shop. `/phinxstudio` must not be substituted. |

No P0. No Usability Friction (no live users). No Feature Request (none collected).

Lint failure: **pre-existing unrelated**, not a finding against Shop #1.

## 14. Blockers / Product-return items

**NEEDS_PRODUCT / Founder input to continue validation (not a code change):**

1. Name the production Shop #1 slug/tenant (real operating shop, not demo).
2. Confirm intended shop LINE OA booking entry points at that tenant.
3. Complete UX-002 qualification + 599 acknowledgement on the manual evidence template below.
4. Founder-run physical LINE in-app booking with Engineering recording.

Until those exist, **do not** move SPR-002 to `IMPLEMENTED`. **Do not** activate Shop #1 for normal customer use.

## 15. Intentional non-changes

Not modified:

- booking transaction / concurrency / double-booking protection
- tenant/shop isolation and shop-scoped access
- customer booking ownership
- owner/barber authorization
- LINE identity/auth and LIFF return behavior
- booking create/cancel semantics
- LINE sender/channel architecture and tenant-specific messaging
- database schema / migrations
- CTA destinations
- Pilot lead API / data model / statuses
- merchant-first identity hierarchy
- Product Decisions
- SPR-003 (not created)

## 16. Application code changed?

**No.** No Product/P0 authorization was used to change product code. Valid outcome for this pass: existing implementation was **not** fully validated for Shop #1 go-live; automated/config prep completed.

## 17. How QA should verify (after a later complete pass)

Do **not** PASS this incomplete report.

When Shop #1 is named and the Activation Gate is completed, QA should:

1. Confirm this report was updated with commit SHA, device/LINE context, and classification of every finding.
2. Confirm application code still unchanged unless a later Product/P0 authorization is cited.
3. Re-check Sales/Add Friend sender-neutral truth from locked SPR-001.
4. Re-run the automated commands above.
5. Review Founder physical-device evidence: correct shop, booking details, My Bookings, permitted cancellation, owner queue, no P0/Activation Blocker.

QA owns **PASS**. Engineering does not mark PASS.

---

## Appendix A — UX-002 evidence template (Founder; unfilled)

### Shop baseline

- Shop name / contact:
- Date:
- Operator:
- Active barbers:
- Current booking channels:
- Do customers choose a barber?:
- Current manual availability/booking workflow:
- Qualification notes:
- Assisted 30-Day Pilot and 599 THB/month continuation-price acknowledgement:

### Setup and owner operation

- Setup started / ended / elapsed:
- Correct shop access confirmed:
- Team confirmed:
- Hours/availability confirmed:
- LINE OA entry/link confirmed:
- Today’s queue found:
- Test booking barber identified:
- Availability control checked:
- Assistance required (none / Founder-operator / developer):
- Notes:

### Customer physical-device test

- Device / OS / viewport:
- Inside LINE in-app browser:
- LINE/LIFF entry and return:
- Correct shop context:
- Barber selected:
- Date/time selected:
- Booking confirmed:
- Booking Success details verified:
- Add Friend state and customer interpretation:
- My Bookings verified:
- Cancellation checked where permitted:
- First-booking elapsed time:
- Screenshots/recording reference:

### Findings

| Observation | Actual behavior | Classification | Evidence | Activation decision / follow-up owner |
|---|---|---|---|---|

### Activation decision

- [ ] PASS — Shop #1 may go live
- [ ] STOP — NEEDS_PRODUCT_REVIEW
- [ ] P0 INCIDENT

Reason / evidence reference: **STOP this pass — Shop #1 unnamed (VAL-002-01).**
