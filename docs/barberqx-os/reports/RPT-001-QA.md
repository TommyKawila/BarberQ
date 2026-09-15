# RPT-001-QA — SPR-001 Pilot Truth & Positioning Alignment

| | |
|---|---|
| Linked Sprint | [SPR-001](../sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) |
| Linked UX | [UX-001](../handoffs/UX-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) |
| Engineering report | [RPT-001-ENG](./RPT-001-ENG.md) |
| Initial reviewed commit | `9575ecbe9ce527a4477a75bd672f78224c2ec962` |
| Re-QA reviewed commit | `31d35d091dafc7f84e345145195d8f1f40e7a1a6` |
| Date | 2026-09-16 |
| QA decision | **PASS** |

## 1. Decision

SPR-001 **passes QA**.

The previous blocker, QA-001, is resolved. Public Sales FAQ item 5 is now sender-neutral in Thai and English while deployed LINE sender identity remains unverified. The fix did not expand scope or modify protected booking, LINE/auth/LIFF, tenant, security, data-model, or CTA-destination boundaries.

This PASS is against the approved SPR-001 + UX-001 scope only. No new feature or Product Decision is introduced by QA.

## 2. QA-001 re-verification

### Public FAQ item 5

TH:

> หลังจอง คิวของคุณถูกบันทึกในระบบแล้ว ข้อความเพิ่มเติมใน LINE เป็นทางเลือก และไม่กระทบสถานะการจอง

EN:

> After you book, your queue is saved in the system. Any extra LINE message is optional and does not affect your booking status.

Result: **PASS**.

The copy:

- does not name BarberQx as the LINE sender;
- does not name the shop / shop OA as the LINE sender;
- does not promise a LINE confirmation message;
- does not claim reminders, alerts, pre-appointment messages, or no-show reduction;
- preserves the confirmed booking state independently from optional LINE messaging.

### Visible marketing sender claim lock

`src/lib/marketing/layout.test.ts` now locks public `marketing.*` values against:

- `BarberQx LINE OA` sender claims;
- confirmation-through-BarberQx sender claims;
- shop-OA-as-sender claims;
- regression of the exact approved FAQ 5 TH/EN copy.

Result: **PASS**.

### Scope of the QA fix

Compared QA report commit `3b54aaf684c4907b328243c24cb6a6214ab7745a` to re-QA commit `31d35d091dafc7f84e345145195d8f1f40e7a1a6`.

Changed files are limited to:

- `src/lib/i18n/dictionary.ts`
- `src/lib/marketing/layout.test.ts`
- `docs/barberqx-os/reports/RPT-001-ENG.md`
- `docs/barberqx-os/sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md`

No protected implementation boundary file was added to the fix.

## 3. Final acceptance matrix

| Review item | QA result | Notes |
|---|---|---|
| 1. Assisted 30-Day Pilot framing | PASS | Public acquisition uses Pilot framing rather than open self-service Free Trial framing. |
| 2. `/trial`: application → contact/qualification → assisted setup | PASS | Submission is explicitly not instant account creation or activation. |
| 3. ฿599 as post-Pilot working continuation price / unvalidated pricing | PASS | 599 is presented as the continuation price after Pilot, not validated willingness-to-pay. |
| 4. No public “up to 10 barbers” promise | PASS | Public package promise removed; underlying hypothesis is not promoted as Product truth. |
| 5. No unsupported adoption/social-proof claim | PASS | Unsupported “why shops choose BarberQx” style proof is removed/reframed. |
| 6. Customer self-books → shop still controls queue | PASS | Existing mechanisms only; causal story is understandable. |
| 7. Sender-neutral LINE fallback for unverified sender | PASS | Booking Success and My Bookings retain the approved exact sender-neutral fallback. |
| 8. No BarberQx-as-sender claim unless verified | PASS | FAQ 5 fixed; public marketing claim lock added. |
| 9. No shop-OA sender implication | PASS | Shop OA is booking entry context, not represented as platform-message sender. |
| 10. No reminder / alert / pre-appointment / no-show claim | PASS | No prohibited claims found in scoped surfaces. |
| 11. Merchant/shop identity remains primary | PASS | Customer-facing booking hierarchy remains shop-first. |
| 12. Super Admin changes visible-label-only | PASS | Pilot terminology changed without CRM/data-model/workflow expansion. |
| 13. Booking/auth/LIFF/tenant/concurrency/security boundaries unchanged | PASS | Reviewed implementation and QA fix do not touch protected logic. |
| 14. CTA destinations unchanged | PASS | Existing `/trial` destination flow is preserved through existing link components. |
| 15. TH/EN localization correct | PASS | Pilot, pricing, Add Friend, and FAQ sender-neutral truth are semantically aligned. |
| 16. Claim-lock tests enforce user-visible claims only | PASS | Locks operate on visible dictionary values and exact visible fallback values; new sender lock remains scoped to public marketing values. |
| 17. Responsive behavior at 375 / 390 / 430 / desktop | PASS | Engineering reports no horizontal overflow on changed public surfaces; QA fix is copy/test only and introduces no layout change. |
| 18. Accessibility and interaction hierarchy | PASS | Existing semantic forms, focus/touch behavior, booking action order, and text-based expectations remain intact. |
| 19. Engineering report matches actual implementation | PASS | RPT-001-ENG now records QA-001, exact FAQ fix, unverified sender status, and unchanged LINE architecture. |
| 20. Pre-existing lint failures were not introduced by SPR-001 | PASS | Reported lint failures remain unrelated/pre-existing; no new lint issue is attributed to the SPR-001 fix. |

## 4. Test evidence reviewed

Engineering reports:

- `npm run typecheck` — PASS
- `npm run test:booking` — PASS (26)
- `npm run test:security` — PASS (157)
- `npm run test:onboarding` — PASS (44)
- focused `layout.test.ts` — PASS (12)
- `npm run build` — PASS
- `npm run lint` — still fails only on previously identified unrelated issues; no new SPR-001 lint finding reported

These results are consistent with the narrow fix in commit `31d35d091dafc7f84e345145195d8f1f40e7a1a6`.

## 5. Protected-scope conclusion

SPR-001 remained an alignment Sprint. Engineering did not use QA-001 as permission to change:

- booking transaction / slot concurrency;
- double-booking protection;
- tenant/shop isolation;
- customer booking ownership;
- owner/barber authorization;
- LINE token or sender architecture;
- LINE auth / LIFF behavior;
- booking create/cancel behavior;
- database schema/migrations;
- Trial Lead API/data contract/status workflow;
- CTA destinations.

## 6. Final QA state

**PASS**

Required transition:

`READY_FOR_QA` → **PASS**

Per `WORKFLOW.md`, Product owns the next transition `PASS` → `LOCKED`, including any `CURRENT-STATE` update required by the workflow.

Do not create SPR-002 as part of this QA decision.
