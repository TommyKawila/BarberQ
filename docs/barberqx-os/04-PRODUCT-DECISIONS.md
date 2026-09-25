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

## PD-009

| | |
|---|---|
| Date | 2026-09-15 |
| Status | Accepted |
| Decision | Initial acquisition uses an **Assisted 30-Day Pilot**, not an open self-service Free Trial. |
| Reason | The immediate goal is to qualify approximately five real barber shops, assist setup, observe real usage, and validate willingness to continue at 599 THB/month. An open free trial would mix low-intent signups with the validation cohort and weaken interpretation of Pilot results. |
| Evidence / source | Explicit Founder approval following BarberQx Alignment Plan v1, synthesized from Marketing, Product, and UX/UI Alignment Audits. This is an operating decision, not customer evidence. |
| Product implication | Public acquisition, `/trial`, CTA expectations, lead handling, and assisted onboarding must describe one coherent Pilot program. Do not present BarberQx as an open self-service 30-day trial during this validation phase. |
| Revisit condition | After the first qualified Pilot cohort produces enough evidence to reconsider acquisition motion. |

## PD-010

| | |
|---|---|
| Date | 2026-09-15 |
| Status | Accepted |
| Decision | Customers enter booking from the **shop's own LINE OA**; BarberQx provides the booking platform; shop branding remains primary; any BarberQx/system confirmation messaging must be represented according to the actual sender. Do not imply that a message comes from the shop's own OA unless that is actually implemented. |
| Reason | LINE-first adoption and merchant-first trust require the product and marketing to distinguish the shop relationship from platform/system messaging truthfully. |
| Evidence / source | Explicit Founder approval plus repository inspection during Product Alignment Audit. Current architecture is the truth for Sprint 1; this decision does not authorize new tenant-specific LINE messaging architecture. |
| Product implication | Sprint 1 may align UX/copy with current messaging behavior, but must not redesign LINE auth, LIFF identity, tenant messaging architecture, or shop ownership boundaries. PD-006 still prohibits pre-appointment reminder claims. |
| Revisit condition | A later Founder/Product decision explicitly approves a different messaging architecture based on validated need. |

## PD-011

| | |
|---|---|
| Date | 2026-09-15 |
| Status | Accepted |
| Decision | “Up to 10 barbers” is an **unvalidated commercial/package hypothesis** during Pilot and must not be strengthened into a public product promise. |
| Reason | The initial ICP is approximately 2–8 barbers and there is no customer evidence yet establishing 10 barbers as a meaningful or validated package boundary. |
| Evidence / source | Explicit Founder approval; [PD-003](#pd-003); current Pilot-stage evidence rules. |
| Product implication | Keep any underlying implementation limit separate from positioning. Public acquisition should not use the 10-barber cap as proof, differentiation, or validated packaging until Product/Founder revisit it. |
| Revisit condition | Pilot usage and commercial evidence justify a deliberate packaging decision. |


## PD-012

| | |
|---|---|
| Date | 2026-09-25 |
| Status | Accepted |
| Decision | BarberQx supports a first-class, tenant-scoped **Manager** role distinct from Owner and Barber. Manager authenticates with their own verified LINE identity, does not live in the barbers model, does not appear in customer barber selection, and may perform approved day-to-day shop administration. Owner remains the highest shop authority and controls Manager invitation/revocation. Multiple Managers per shop are allowed. Initial delivery does not support one Manager identity across multiple shops. |
| Reason | Real Shop #1 preparation exposed that shop ownership and daily BarberQx operation may belong to different people. The legitimate Owner remains responsible for the tenant but may need a trusted employee to operate the system during the Pilot. Modeling that employee as a fake/non-bookable barber, sharing Owner credentials, or manually assigning LINE IDs would violate Product and security boundaries. |
| Evidence / source | PHINX STUDIO Shop #1 operational requirement observed during SPR-002 preparation; explicit Founder approval on 2026-09-25. This is one-shop operational evidence supporting delivery planning, not proof that every shop requires Managers or that broad RBAC is needed. |
| Product implication | Manager delivery must use a shop-bound, role-bound, expiring, one-time invite claimed through verified LINE authentication. Manager authorization must be tenant-scoped and revocable. Manager cannot promote themselves or another Manager to Owner. Existing Owner claim, Barber/customer behavior, booking/concurrency behavior, tenant isolation, and Super Admin separation remain protected. Do not manually enter LINE user IDs. Do not build cross-shop Manager access or broad permission-builder/RBAC scope in the initial delivery. |
| Revisit condition | Pilot evidence shows a need for cross-shop management, granular permissions, additional non-barber roles, ownership delegation/transfer, or a unified Owner/Manager membership model. |

---

## Constraints (not tickets)

- Each shop is a tenant at `/{shopSlug}`. Data and admin actions are shop-scoped.
- Customer identity is LINE. Owner and barber roles are shop staff records. Super Admin is a separate token, not a shop owner.
- Prefer shop-scoped APIs (`/api/[shop]/…`) when changing APIs; this does not by itself schedule a migration.
- Do not casually change booking logic, LINE/LIFF, auth, tenant isolation, or CTA destinations.
- Do not put Product OS rules in `AGENTS.md` / `CLAUDE.md`.
- How to run and test: [`../../README.md`](../../README.md).
- Marketing copy alignment: [`../../src/lib/i18n/dictionary.ts`](../../src/lib/i18n/dictionary.ts), [`../../src/lib/marketing/layout.test.ts`](../../src/lib/marketing/layout.test.ts).
