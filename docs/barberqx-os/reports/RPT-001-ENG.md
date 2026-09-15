# RPT-001-ENG — SPR-001 Pilot Truth & Positioning Alignment

| | |
|---|---|
| Linked Sprint | [SPR-001](../sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) |
| Linked UX | [UX-001](../handoffs/UX-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) |
| Date | 2026-09-16 |
| Author | Engineering / Cursor |
| Sprint state after this report | **READY_FOR_QA** |

## LINE sender verification

**Status: unverified** from deployment configuration.

Engineering did **not** treat env key names, local `.env.local` presence, test fixtures, or `@barberqx` examples as proof that:

- `NEXT_PUBLIC_LINE_OA_ADD_URL` is the BarberQx platform OA, **and**
- `LINE_CHANNEL_ACCESS_TOKEN` belongs to that same BarberQx platform sender.

No LINE APIs were called. No tokens/secrets are recorded here. No LINE architecture, push behavior, channel tokens, LIFF/auth, or Add Friend visibility logic was changed.

Product/R&D resolved the previous `NEEDS_PRODUCT_REVIEW` blocker by approving the **sender-neutral fallback**. UX-001 §C now has VERIFIED vs UNVERIFIED branches. Shipped customer Add Friend copy is the UNVERIFIED branch only.

QA FAIL on 2026-09-16: public FAQ 5 still named BarberQx LINE OA as confirmation sender. Engineering replaced only `marketing.faq.5.a` TH/EN with sender-neutral wording. FAQ layout, LINE architecture, and other copy were not changed.

## Files changed

- [`src/lib/i18n/dictionary.ts`](../../../src/lib/i18n/dictionary.ts) — TH/EN visible copy (Pilot + sender-neutral Add Friend + FAQ 5 sender-neutral)
- [`src/components/marketing/SalesHero.tsx`](../../../src/components/marketing/SalesHero.tsx) — one `ctaExpect` paragraph under Hero CTAs
- [`src/components/marketing/TrialForm.tsx`](../../../src/components/marketing/TrialForm.tsx) — one `priceExpect` paragraph
- [`src/lib/marketing/layout.test.ts`](../../../src/lib/marketing/layout.test.ts) — visible-copy claim locks, including unverified LINE sender
- [`src/lib/booking/booking-success-ux.test.ts`](../../../src/lib/booking/booking-success-ux.test.ts) — exact fallback match + sender/reminder/shop-OA claim locks
- [`docs/barberqx-os/handoffs/UX-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md`](../handoffs/UX-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) — narrow §C / AC 8 amendment only
- [`docs/barberqx-os/sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md`](../sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) — WORKFLOW state
- this report

Working-tree files that were already dirty and were **not** part of SPR-001: `SalesPage.tsx`, `MarketingFooter.tsx`, marketing mockups, untracked `after-organized-workflow-old.png`. Dictionary keys still consumed by the committed Sales Page were kept (or restored with SPR-001-safe values) so that page does not lose copy when the WIP layout is not shipped.

## Exact fallback copy implemented (unverified sender)

Booking Success — TH

- Heading: `เพิ่มเพื่อนใน LINE`
- Body: `หากต้องการ คุณสามารถเพิ่มเพื่อนผ่านลิงก์นี้ได้ โดยไม่กระทบสถานะการจอง`
- CTA: `เพิ่มเพื่อนใน LINE`
- Hint: `ไม่บังคับ • คิวของคุณยืนยันแล้ว`

Booking Success — EN

- Heading: `Add on LINE`
- Body: `If you'd like, you can add this LINE account. This does not affect your booking status.`
- CTA: `Add on LINE`
- Hint: `Optional • Your booking is confirmed`

My Bookings — TH

- Secondary CTA: `เพิ่มเพื่อนใน LINE`
- Supporting text: `ไม่บังคับ • การจองของคุณยืนยันแล้ว`

My Bookings — EN

- Secondary CTA: `Add on LINE`
- Supporting text: `Optional • Your booking is confirmed`

Unused dictionary key `booking.addBarberqFriendHint` was neutralized to the same supporting text so it cannot reintroduce a sender/reminder claim.

This copy does **not** claim BarberQx as sender, the shop as sender, a guaranteed confirmation message, reminders, alerts, pre-appointment notifications, or no-show reduction.

Verified-sender BarberQx wording in UX-001 §C was **not** shipped.

## Other copy changed (already in this Sprint)

### Sales

- Primary/nav/pricing/final CTAs: Assisted 30-Day Pilot. Destinations still `/trial`.
- Hero outcome preserved: ให้ลูกค้าจองคิว / ร้านคุณเอง / ผ่าน LINE.
- Expectation near Hero CTA: team will contact to qualify and help set up.
- Pricing: ฿599 / month / shop kept as post-Pilot continuation price to test; public “up to ~10 barbers” removed; Free Trial labels removed.
- FAQ 3: multi-barber + per-barber queue control; no 10-barber package.
- FAQ 5 (QA fix, 2026-09-16): sender-neutral. Does not name BarberQx or the shop as LINE sender; does not promise confirmation delivery or reminders.
  - TH: `หลังจอง คิวของคุณถูกบันทึกในระบบแล้ว ข้อความเพิ่มเติมใน LINE เป็นทางเลือก และไม่กระทบสถานะการจอง`
  - EN: `After you book, your queue is saved in the system. Any extra LINE message is optional and does not affect your booking status.`
- Barber section: how BarberQx helps manage the queue; customer self-books / shop still controls the queue.

### `/trial`

- Application hierarchy: apply → contact/qualify → assisted setup.
- Submitting does not create an account or turn the system on.
- Continuation price line added.
- POST `/api/trial-leads`, validation, rate limit, statuses, and schema unchanged.

### Super Admin

Visible labels only: Trial Leads → Pilot Applications; Trial Lead → Pilot Applicant; trial form → Pilot application; ทดลองใช้ → Pilot 30 วัน. Routes, statuses, filters, notes, APIs, and data model unchanged.

## Intentionally not changed

- `NEXT_PUBLIC_LINE_OA_ADD_URL` behavior
- `LINE_CHANNEL_ACCESS_TOKEN`
- Push-message behavior / sender architecture
- LINE / LIFF / auth
- Add Friend visibility logic (`shouldShowLineReminder`; My Bookings still hides the card in LINE mock mode)
- Tenant architecture
- Booking transaction/concurrency, create/cancel
- Database schema / migrations
- CTA destinations
- Trial Lead API/data contract
- Booking success / My Bookings layout and interaction
- SPR-001 §5.5/§5.6 as software (operator protocol remains in the Sprint doc)
- Canonical OS `00–04` / `CURRENT-STATE.md`

## Tests

| Command | Result |
|---|---|
| `npm run typecheck` | Pass |
| `npm run test:security` | Pass (157) |
| `npm run test:booking` | Pass (26) |
| `npm run test:onboarding` | Pass (44) |
| `npm run build` | Pass |
| `npm run lint` | Fail — pre-existing `react-hooks/set-state-in-effect` and unused-import issues in unrelated files. No new lint findings on SPR-001 files. |

Claim-lock tests target **visible dictionary values** used by Add Friend/system-message UI and public marketing values, not `/trial` routes, `TrialLead` types, `/api/trial-leads`, CRM helpers, or filenames. A dedicated marketing lock forbids `BarberQx LINE OA` and shop-OA-as-sender claims on `marketing.*` values.

## Responsive / manual checks

Sales + `/trial` at 375 / 390 / 430 / desktop (1280):

- No horizontal overflow (`scrollWidth` == `clientWidth`)
- Hero outcome readable; Pilot CTA hierarchy clear
- Hero/pricing/final primary CTAs remain ≥48px and full-width where they already were
- Nav compact CTA remains existing `min-h-11` (not redesigned)
- FAQ 3 answer has no 10-barber package
- FAQ 5 shows sender-neutral wording (no BarberQx LINE OA / shop-OA-as-sender)

`/trial` pre-submit copy verified in browser. Automated click-submit did not reach the React success state in this session; success copy is in the dictionary and was not redesigned. Lead persistence tests still pass.

Booking success / My Bookings Add Friend cards: live LIFF login blocked the full customer booking path in this browser (`/phinxstudio` stays on LINE loading when `NEXT_PUBLIC_LIFF_ID` is set). Fallback copy was checked in the live app chrome at 375 / 390 / 430 / desktop using the shipped card markup and dictionary strings; no horizontal overflow; CTA remained ≥48px on booking success; shop-first layout was not modified. My Bookings Add Friend remains hidden in LINE mock mode by existing visibility logic.

## How to verify (QA)

1. Sales: Assisted 30-Day Pilot CTAs; no Free Trial / 10-barber package / social-proof claims; ฿599 framed as post-Pilot continuation.
2. Sales FAQ 5: sender-neutral wording above; no BarberQx LINE OA or shop-OA-as-sender claim.
3. `/trial`: application → contact/qualify → assisted setup; submit does not create an account.
4. Booking success Add Friend (when URL is set and user is not already a friend): exact sender-neutral fallback above; shop details remain above the optional card; no BarberQx/shop-as-sender, reminder, alert, or no-show claim.
5. My Bookings Add Friend (same visibility as before): secondary CTA + supporting text as above.
6. Super Admin: visible Pilot Applications labels only; CRM behavior unchanged.
7. Confirm no change to LINE tokens, push, LIFF, booking create/cancel, or Add Friend visibility.

QA owns **PASS**. Engineering does not mark PASS.

## Risks

- Sender identity remains unverified; verified-sender BarberQx wording is recorded in UX-001 but not live.
- Pre-existing lint failures remain outside this Sprint.
- Unrelated dirty marketing files in the working tree must not be mixed into a SPR-001 commit.

## Remaining blockers

None for Engineering. Sprint is **READY_FOR_QA**.
