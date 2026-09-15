# RPT-001-QA — SPR-001 Pilot Truth & Positioning Alignment

| | |
|---|---|
| Linked Sprint | [SPR-001](../sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) |
| Linked UX | [UX-001](../handoffs/UX-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) |
| Engineering report | [RPT-001-ENG](./RPT-001-ENG.md) |
| Reviewed main commit | `9575ecbe9ce527a4477a75bd672f78224c2ec962` |
| Date | 2026-09-15 |
| QA decision | **FAIL — RETURN TO IMPLEMENTED** |

## 1. Decision

SPR-001 does **not** pass QA yet.

Most approved scope is implemented correctly and Engineering stayed inside the protected technical boundaries. However, one public FAQ answer ships a brand-specific LINE sender claim even though sender identity is explicitly unverified. This contradicts SPR-001 / UX-001 Product Truth and also contradicts the Engineering report statement that verified-sender BarberQx wording was not shipped.

Per `WORKFLOW.md`, QA rejects the Sprint from `READY_FOR_QA` back to `IMPLEMENTED` until the scoped defect below is corrected and re-verified.

## 2. Blocking defect

### QA-001 — Public FAQ names BarberQx as LINE sender while sender identity is unverified

**Surface:** Sales Page FAQ, item 5, TH + EN.

**Current user-visible values in `src/lib/i18n/dictionary.ts`:**

TH:

> ระบบรองรับข้อความยืนยันการจองผ่าน BarberQx LINE OA ตามการตั้งค่าที่ใช้งานอยู่

EN:

> The system can send booking confirmation messages through the BarberQx LINE OA, based on the settings in use.

The Sales Page renders `marketing.faq.${n}.a`, so these are public user-visible claims.

**Why this fails approved scope:**

- SPR-001 §5.3 requires BarberQx/system messaging to be represented according to the actual sender.
- SPR-001 AC 8 / AC 13 and UX-001 AC 8 require brand-specific sender wording only when sender identity is verified; sender identity is currently unverified.
- UX-001 explicitly approves a sender-neutral fallback for the unverified state.
- PD-010 prohibits misrepresenting platform/system sender identity.
- RPT-001-ENG states that the verified-sender BarberQx wording was not shipped, which is not true while this FAQ answer is live.

**Required fix, without scope expansion:**

- Revisit only the Sales Page FAQ sender answer(s) in TH/EN and make them sender-neutral / Product-truth-safe for the unverified sender state.
- Do **not** change LINE architecture, sender behavior, tokens, LIFF/auth, booking logic, CTA destinations, or FAQ layout.
- Do **not** invent reminder/alert/no-show language.

**Files/surfaces Engineering must revisit:**

- `src/lib/i18n/dictionary.ts` — `marketing.faq.5.a` TH/EN only, plus any equivalent visible marketing sender claim discovered in the same scoped check.
- `src/lib/marketing/layout.test.ts` — extend the visible marketing claim lock so the unverified-sender state cannot regress into a public BarberQx/shop LINE sender claim.
- `docs/barberqx-os/reports/RPT-001-ENG.md` — correct/re-verify the statement that brand-specific BarberQx sender wording is not shipped after the fix.

No other redesign is requested.

## 3. Acceptance / review matrix

| Review item | QA result | Notes |
|---|---|---|
| 1. Assisted 30-Day Pilot framing | PASS | Public CTAs / Pilot copy use Pilot framing; no open Free Trial framing found in scoped visible marketing values. |
| 2. `/trial`: application → contact/qualification → assisted setup, not instant access | PASS | Pre-submit and post-submit copy explicitly says the team will contact the shop and submission does not create/activate an account. |
| 3. ฿599 as post-Pilot working continuation price / unvalidated pricing | PASS | Public copy frames 599 as the price after Pilot if continuing; Product OS still labels willingness-to-pay unvalidated. |
| 4. No public “up to 10 barbers” promise | PASS | Scoped public pricing/FAQ removed the 10-barber package promise; claim lock covers visible marketing values. |
| 5. No unsupported adoption/social proof | PASS | “Why barbershops choose BarberQx” style claim removed/reframed; no customer evidence invented. |
| 6. Customer self-books → shop still controls queue | PASS | Sales copy explicitly states customer self-booking with shop queue control. |
| 7. Sender-neutral LINE fallback for unverified sender | PASS on Booking Success / My Bookings | Exact approved TH/EN fallback is implemented for those customer surfaces. |
| 8. No BarberQx-as-sender claim unless verified | **FAIL** | Public FAQ item 5 names `BarberQx LINE OA` while sender identity is unverified. |
| 9. No shop-OA sender implication | PASS | Approved Add Friend fallback does not name the shop as sender; shop LINE OA is represented as booking entry. |
| 10. No reminder / alert / pre-appointment / no-show claim | PASS | Scoped Add Friend copy is confirmation-neutral; no prohibited reminder/no-show marketing claim found. |
| 11. Merchant/shop identity remains primary | PASS | Booking Success and My Bookings keep shop details/context above optional Add Friend UI; branding hierarchy was not redesigned. |
| 12. Super Admin visible-label-only | PASS | Commit changes user-visible Pilot labels through localization; no Super Admin behavior/data-model files changed. |
| 13. Booking/auth/LIFF/tenant/concurrency/security boundaries unchanged | PASS | Commit diff is limited to docs, copy/presentation, and focused claim tests; no protected booking/auth/LIFF/tenant/security implementation files changed. |
| 14. CTA destinations unchanged | PASS | Hero/marketing continue to use `MarketingTrialLink`; no destination change was introduced. |
| 15. TH/EN localization correct | PASS except blocking sender-truth wording | Pilot, trial, pricing, and approved Add Friend fallback are aligned across TH/EN. FAQ 5 is semantically aligned between locales but factually unsupported. |
| 16. Claim-lock tests enforce user-visible claims only | PASS WITH COVERAGE GAP | Existing locks operate on visible dictionary values / visible Add Friend keys rather than internal route/type names. They do not currently lock the unverified sender rule across public marketing values; extend narrowly for this defect. |
| 17. Responsive 375 / 390 / 430 / desktop | PASS based on implementation + Engineering verification | No responsive layout code was materially redesigned by SPR-001; Engineering reports scoped checks with no horizontal overflow. |
| 18. Accessibility / interaction hierarchy | PASS | Existing semantic forms, labels, focus/touch behavior, and booking interaction order are preserved; new expectation copy is text. |
| 19. Engineering report matches implementation | **FAIL on sender statement** | Report says verified-sender BarberQx wording was not shipped, but public FAQ item 5 names BarberQx LINE OA. Other reported scope/boundary claims match the commit. |
| 20. Pre-existing lint failures not introduced by SPR-001 | PASS | Engineering reports only pre-existing unrelated lint findings; reviewed commit does not touch the unrelated lint-failure areas. |

## 4. Protected-scope verification

Compared parent `0fa7d95750d80cad5000fa4af71121befc2fd2a7` to reviewed main commit `9575ecbe9ce527a4477a75bd672f78224c2ec962`.

Changed implementation files are limited to:

- `src/components/marketing/SalesHero.tsx`
- `src/components/marketing/TrialForm.tsx`
- `src/lib/i18n/dictionary.ts`
- `src/lib/marketing/layout.test.ts`
- `src/lib/booking/booking-success-ux.test.ts`

plus SPR/UX/report documents.

No booking transaction/concurrency, auth, LIFF, tenant isolation, LINE token/sender architecture, database schema/migrations, CTA destination implementation, or Trial Lead API/data-contract files are changed by the reviewed commit.

## 5. Re-QA instructions

Engineering should make only the narrow fixes listed in QA-001, rerun the required SPR-001 checks, update `RPT-001-ENG`, and return SPR-001 to `READY_FOR_QA`.

QA should then re-check:

1. Sales FAQ item 5 in TH + EN;
2. visible marketing sender-truth claim lock;
3. exact approved Booking Success / My Bookings fallback remains unchanged;
4. Engineering report accurately describes shipped sender wording;
5. no protected boundary files were added to the fix.

Do not create SPR-002. Do not redesign any surface.
