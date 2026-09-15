# Product decision log

Change a decision only with an explicit update to its record. Tenancy and security lines below are **constraints**, not implementation tickets.

Insights and feature requests do not independently authorize engineering work ([PD-008](#pd-008)).

---

## PD-001

| | |
|---|---|
| Date | 2026-09-15 |
| Status | Accepted |
| Decision | BarberQx is LINE-first. |
| Reason | Customers already use the shop LINE OA; booking should start there rather than a separate consumer app. |
| Evidence / source | Currently implemented / verified product behavior (LIFF booking). Not commercial proof of adoption. |
| Product implication | Booking and identity stay LINE-based unless this decision is revisited. |
| Revisit condition | Evidence that LINE-first blocks qualified shops or customers. |

## PD-002

| | |
|---|---|
| Date | 2026-09-15 |
| Status | Accepted |
| Decision | The shop owner is the paying buyer. |
| Reason | The owner buys the system; barbers/staff operate it; the customer is the end user. |
| Evidence / source | Product design and positioning. Not a closed-won revenue dataset. |
| Product implication | Pricing, sales, and messaging target the owner. Do not treat barbers as paying buyers. |
| Revisit condition | A different economic buyer is observed in Pilot. |

## PD-003

| | |
|---|---|
| Date | 2026-09-15 |
| Status | Accepted |
| Decision | Initial focus is independent multi-barber shops (approximately 2–8 barbers). |
| Reason | ICP where customers book ahead and often choose a barber; coordination workload is more likely. |
| Evidence / source | Positioning hypothesis ([HYP-002](./02-CUSTOMER-INSIGHTS.md)). Not structured customer evidence. |
| Product implication | Early sales and Pilot qualification prefer this segment over walk-in-only, solo, chain, or multi-branch. |
| Revisit condition | Pilot evidence shows a better first segment. |

## PD-004

| | |
|---|---|
| Date | 2026-09-15 |
| Status | Accepted |
| Decision | BarberQx will not position as an all-in-one salon system during early validation. |
| Reason | Scope is queue booking plus shop operations around the queue. Feature-count leadership is not the strategy. |
| Evidence / source | Founder/product scope decision. |
| Product implication | Do not market or build POS, inventory, payroll, accounting, marketplace, large CRM, or AI chatbot platform as the product. |
| Revisit condition | After Pilot evidence, an explicit decision to expand category. |

## PD-005

| | |
|---|---|
| Date | 2026-09-15 |
| Status | Hypothesis |
| Decision | 599 THB/month/shop is the working price to test. |
| Reason | Simple one-price offer for a shop tenant. |
| Evidence / source | [HYP-004](./02-CUSTOMER-INSIGHTS.md). **Not validated pricing truth.** |
| Product implication | Sales and Pilot may quote 599; do not state it as proven willingness to pay. |
| Revisit condition | Pilot conversion data at 599, or a decision to test another price. |

## PD-006

| | |
|---|---|
| Date | 2026-09-15 |
| Status | Accepted |
| Decision | Pre-appointment reminder claims are prohibited until the capability actually exists. |
| Reason | Scheduled pre-appointment reminders are not implemented. Marketing must not claim them. |
| Evidence / source | Current product inventory ([CURRENT-STATE.md](./CURRENT-STATE.md)); marketing claim locks. |
| Product implication | No reminder/no-show reduction claims in sales copy. [HYP-005](./02-CUSTOMER-INSIGHTS.md) stays a hypothesis, not a shipped feature. |
| Revisit condition | The capability ships **and** Product approves claims against evidence. |

## PD-007

| | |
|---|---|
| Date | 2026-09-15 |
| Status | Accepted |
| Decision | Customer-facing booking prioritizes merchant/shop branding; BarberQx remains the platform signature. |
| Reason | BarberQx is the platform, not the shop. |
| Evidence / source | [`../BRAND.md`](../BRAND.md). |
| Product implication | Do not make BarberQx visually compete with shop identity on customer surfaces. |
| Revisit condition | Brand system revision. |

## PD-008

| | |
|---|---|
| Date | 2026-09-15 |
| Status | Accepted |
| Decision | Customer insights and feature requests do not independently authorize engineering work. They require Product/Founder approval before roadmap/sprint entry. |
| Reason | Prevent feature creep before Pilot evidence. |
| Evidence / source | Operating rule for this Product OS. |
| Product implication | Engineering/Cursor must not treat INS-*, HYP-*, or informal requests as implementation tickets. |
| Revisit condition | A later operating-model change, recorded as a new PD. |

---

## Constraints (not tickets)

- Each shop is a tenant at `/{shopSlug}`. Data and admin actions are shop-scoped.
- Customer identity is LINE. Owner and barber roles are shop staff records. Super Admin is a separate token, not a shop owner.
- Prefer shop-scoped APIs (`/api/[shop]/…`) when changing APIs; this does not by itself schedule a migration.
- Do not casually change booking logic, LINE/LIFF, auth, tenant isolation, or CTA destinations.
- Do not put Product OS rules in `AGENTS.md` / `CLAUDE.md`.
- How to run and test: [`../../README.md`](../../README.md).
- Marketing copy alignment: [`../../src/lib/i18n/dictionary.ts`](../../src/lib/i18n/dictionary.ts), [`../../src/lib/marketing/layout.test.ts`](../../src/lib/marketing/layout.test.ts).
