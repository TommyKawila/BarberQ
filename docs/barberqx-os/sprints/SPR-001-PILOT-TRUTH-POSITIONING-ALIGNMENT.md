# SPR-001 — Pilot Truth & Positioning Alignment

| | |
|---|---|
| Date opened | 2026-09-15 |
| State | **READY_FOR_UX** |
| Type | Normal delivery Sprint |
| Phase | Pre-Pilot / Pilot Readiness |
| Product owner | Product / R&D |
| Founder approval | **Approved — 2026-09-15** |
| Source / rationale type | Product Decisions + explicit Founder-approved operational requirement |
| Source / rationale | BarberQx Alignment Plan v1 (Marketing + Product + UX/UI audits), Founder approval, [PD-009](../04-PRODUCT-DECISIONS.md#pd-009), [PD-010](../04-PRODUCT-DECISIONS.md#pd-010), [PD-011](../04-PRODUCT-DECISIONS.md#pd-011) |
| Next allowed transition | `UX_APPROVED` after linked `UX-001` satisfies this Sprint |
| Engineering authorized now? | **No** |
| P0? | No |

> This Sprint owns delivery state under [`WORKFLOW.md`](../WORKFLOW.md). `READY_FOR_UX` authorizes UX work only. It does **not** authorize Engineering / Cursor implementation.

---

## 1. Problem

BarberQx core booking behavior is already strongly aligned with the Product OS, but the pre-Pilot acquisition and customer-facing truth are not yet fully coherent.

Three issues must be aligned before the first external Pilot cohort is interpreted as meaningful Product evidence:

1. Public acquisition currently contains Free Trial framing while the approved validation motion is an **Assisted 30-Day Pilot**.
2. LINE-first entry is merchant-owned, but post-booking/system messaging must be represented according to the current architecture and actual sender. BarberQx must not imply that platform/system messages come from the shop's own LINE OA unless that is actually implemented.
3. A qualified Pilot cohort and lightweight evidence-capture protocol must be explicit before approximately five shops enter the Pilot; otherwise lead volume, usage, and willingness-to-pay signals will be difficult to interpret.

This Sprint is an alignment Sprint, not a feature Sprint.

---

## 2. Truth labels

### FACT

- BarberQx is LINE-first and customer booking starts from the shop context.
- The current core customer flow is shop → barber → date → time → confirm.
- Shop branding is primary on customer-facing booking surfaces.
- The product has an existing `/trial` acquisition flow and Super Admin lead-management capability.
- Scheduled pre-appointment reminders are **not implemented**; [PD-006](../04-PRODUCT-DECISIONS.md#pd-006) remains in force.
- Current LINE/auth/LIFF and tenant-scoped behavior are protected implementation boundaries.

### HYPOTHESIS

- 599 THB/month/shop is the working price to test; it is not validated willingness-to-pay ([PD-005](../04-PRODUCT-DECISIONS.md#pd-005)).
- “Up to 10 barbers” is an unvalidated commercial/package hypothesis, not a validated public promise ([PD-011](../04-PRODUCT-DECISIONS.md#pd-011)).
- Independent multi-barber shops, approximately 2–8 barbers, remain the preferred initial ICP; this is still pre-Pilot positioning rather than validated customer evidence ([PD-003](../04-PRODUCT-DECISIONS.md#pd-003)).

### CUSTOMER EVIDENCE

- No Product-reviewed Pilot evidence is assumed by this Sprint.
- Marketing copy, founder belief, competitor behavior, and feature availability do not become customer evidence merely by appearing in this Sprint.

---

## 3. Users affected

- Prospective barber-shop owner / buyer
- Qualified Pilot shop owner
- Customer booking from the shop's LINE OA
- Founder / operator qualifying and supporting Pilot shops

Barbers/staff may be indirectly affected by messaging or Pilot setup expectations, but this Sprint does not redesign their operational product surfaces.

---

## 4. Desired outcome

Before the first qualified Pilot cohort begins, BarberQx should present one coherent truth:

> **BarberQx is an assisted 30-day Pilot for qualified barber shops. Customers start from the shop's LINE OA, use BarberQx to choose a barber/date/time and book, while the shop remains the primary merchant identity. Any BarberQx/system messaging is represented according to the actual sender. After the Pilot, the working continuation price to validate is 599 THB/month/shop.**

The acquisition experience, Pilot expectation, LINE representation, and evidence process must agree with each other without adding new product capability.

---

## 5. Scope

### 5.1 Acquisition / Pilot alignment

UX must align the existing public acquisition journey to [PD-009](../04-PRODUCT-DECISIONS.md#pd-009):

- Replace open self-service **Free Trial** framing with **Assisted 30-Day Pilot** framing where the public journey creates the wrong expectation.
- Make clear that the first cohort is intentionally small (approximately five qualified shops) because setup and observation are assisted.
- Preserve the working continuation price of **599 THB/month/shop** as a price to validate, not proven willingness-to-pay.
- Make the Day-30 decision understandable: continue at the working price or stop.
- Do not create an expectation that a prospect receives unattended/self-service access merely by submitting the lead form.
- Keep the existing lead-capture destination and Super Admin lead-management capability unless a specific UX issue requires a minimal presentation adjustment.

### 5.2 Positioning alignment using existing capability only

Strengthen barber-specific differentiation only with already-implemented truths, such as:

- customer chooses a barber;
- each barber has their own availability/schedule;
- the shop can see and control queue/availability by barber;
- booking begins from the shop's LINE context;
- customer self-booking reduces repeated manual booking coordination.

Make the causal story explicit where useful:

**customer books themselves → shop still sees and controls the queue**.

Do not add or imply features to make the positioning stronger.

### 5.3 LINE product truth representation

UX must align customer-facing wording/states to [PD-010](../04-PRODUCT-DECISIONS.md#pd-010):

- Entry is from the **shop's own LINE OA**.
- BarberQx is the booking platform.
- Shop branding remains primary.
- Any BarberQx/system confirmation or platform messaging must be labeled or represented according to the actual sender.
- Do not imply that platform/system messages are sent from the shop's OA unless repository behavior actually does so.
- Do not introduce tenant-specific LINE messaging architecture in this Sprint.
- Do not alter LINE identity/auth/LIFF behavior merely to make the copy easier.

If truthful UX cannot be achieved without changing LINE architecture or sender behavior, UX must return the issue to Product as `NEEDS_PRODUCT_REVIEW`; it must not expand scope.

### 5.4 Remove unsupported public claims

- Remove or rewrite copy that implies existing adoption/social proof without customer evidence, e.g. wording equivalent to “why barbershops choose BarberQx.”
- Do not claim pre-appointment reminders or automatic no-show reduction.
- Do not present “up to 10 barbers” as validated packaging, differentiation, or a public product promise during this Pilot stage.
- Do not claim 599 THB/month is a validated market price.

### 5.5 Qualified Pilot operating definition

For the first cohort, use the following as an **operational qualification rule**, not validated market truth.

#### Required

A Pilot candidate should:

1. be a real operating barber shop rather than a test/demo shop;
2. currently accept at least some advance bookings;
3. use LINE / LINE OA as a meaningful customer communication or booking channel;
4. have a real manual coordination problem around checking/replying about booking availability;
5. agree to assisted setup and to use BarberQx with real customers during the 30-day Pilot;
6. understand before activation that 599 THB/month/shop is the working continuation price to test after the Pilot, and that Day 30 is a continue-or-stop decision.

#### Preferred, not mandatory gates

- approximately 2–8 barbers;
- customers commonly select/request a specific barber;
- owner or working owner-barber personally experiences booking interruptions/coordination.

A candidate must not be called “validated ICP evidence” merely because it meets these rules.

### 5.6 Lightweight Pilot evidence protocol

Define a manual/lightweight protocol before Shop #1 activates. Do **not** build a research platform or new CRM in this Sprint.

Minimum fields/checkpoints:

#### Before activation

- shop / contact
- number of active barbers
- primary booking channel(s)
- whether customers choose a barber
- estimated booking/availability questions per day or week
- who currently checks/responds to availability
- current manual booking workflow summary
- explicit acknowledgement of the 599 THB/month post-Pilot test price

#### Activation

- assisted setup start/end or elapsed time
- ready-for-customer-booking timestamp/date
- first real customer booking date/time
- material setup blocker, if any

#### During Pilot

- whether customers are completing bookings themselves
- meaningful owner-reported reduction or non-reduction in booking coordination
- repeated confusion/blockers
- repeated feature requests, recorded as requests only — not automatic roadmap items

#### Commercial checkpoints

- Day 14 value signal
- Day 21 continuation / willingness-to-pay signal
- Day 30: continue at 599 THB/month or stop

Any reusable customer observation that Product wants to promote to structured evidence must later follow the `INS-*` review rules in [`WORKFLOW.md`](../WORKFLOW.md).

---

## 6. Surfaces UX must review

UX should inspect only the surfaces necessary to achieve this Sprint:

### Public acquisition

- Sales Page offer/CTA areas affected by Trial vs Pilot truth
- Pilot/setup/pricing/FAQ/final CTA wording where expectations conflict
- existing `/trial` form and submission/success state

### Customer LINE truth

- booking entry/context if wording creates ambiguity
- booking success / confirmation representation
- My Bookings / Add Friend or equivalent post-booking LINE prompts where sender identity could be misunderstood

### Internal operator surface

- existing Trial Lead / Super Admin wording only if needed to keep Pilot terminology coherent
- no CRM expansion

### UX artifact

UX must create a linked `UX-001` under `docs/barberqx-os/handoffs/` only after reading this Sprint, `00-NORTH-STAR.md`, `04-PRODUCT-DECISIONS.md`, `BRAND.md`, and the relevant current repository surfaces.

---

## 7. Explicitly out of scope

The following are **not authorized** by SPR-001:

- new booking features;
- pre-appointment reminders;
- no-show automation;
- service catalogue / service selection;
- variable service duration;
- configurable booking horizon;
- configurable cancellation policy;
- payment/subscription implementation;
- POS, inventory, payroll, commission, loyalty, marketplace, large CRM, AI chatbot, accounting, enterprise multi-branch;
- new founder outreach automation;
- new Pilot CRM / research database;
- analytics expansion;
- Stats redesign or navigation re-architecture;
- new tenant-specific LINE messaging architecture;
- changes to LINE auth / LIFF identity flow unless a verified defect is separately escalated;
- redesign of the working customer booking sequence;
- infrastructure/refactor work unrelated to this Sprint;
- SPR-002 or any later Sprint.

---

## 8. Acceptance criteria

SPR-001 may move from `READY_FOR_UX` only when the linked UX artifact demonstrates a minimal design/content solution satisfying all applicable criteria below.

### Acquisition truth

1. Public acquisition uses one coherent **Assisted 30-Day Pilot** model and does not present the current validation motion as an open self-service Free Trial.
2. Prospect expectations make clear that qualification and assisted setup occur before/around activation; submitting `/trial` is not represented as instant unattended product access.
3. The working post-Pilot price is represented as **599 THB/month/shop** without claiming that willingness-to-pay has been validated.
4. The public journey does not use “up to 10 barbers” as validated packaging, proof, or differentiation.
5. Unsupported adoption/social-proof wording is removed or rewritten without inventing customer evidence.

### Positioning truth

6. Barber-specific differentiation is expressed using existing product mechanisms only: barber selection, per-barber availability/schedule, shop queue control, and LINE-first entry.
7. The value chain **customer self-books → shop still controls the queue** is understandable without generic SaaS jargon.
8. No new capability is implied by positioning copy.

### LINE truth

9. The user journey clearly preserves the shop as the primary merchant identity and BarberQx as the booking platform.
10. No customer-facing wording implies that BarberQx/system messaging comes from the shop's own LINE OA unless that is actually true in the current implementation.
11. No pre-appointment reminder claim appears.
12. UX does not require new tenant-specific LINE messaging architecture to satisfy the design; if it does, the Sprint returns to Product review instead of expanding scope.

### Pilot operation / evidence

13. The qualified-Pilot operating rule in §5.5 is usable by Founder/operator without inventing additional criteria per lead.
14. The lightweight evidence protocol in §5.6 is defined and usable before the first Pilot shop activates.
15. Customer feedback or feature requests are recorded as evidence/requests, not automatically converted into build scope.

### Protected baseline

16. Proposed UX changes do not require changes to booking transaction/concurrency logic, tenant isolation, customer booking ownership, owner/barber authorization, or production LINE token verification.
17. The existing customer booking sequence remains intact unless UX identifies a verified contradiction with this Sprint and returns it to Product.
18. Merchant/shop identity remains primary on customer-facing booking surfaces.

---

## 9. Success metric for this Sprint

This Sprint is successful when alignment is unambiguous, not when traffic increases.

Before external Pilot activation:

- zero contradictory Free Trial vs Assisted Pilot claims on the scoped acquisition path;
- zero unsupported customer-adoption/social-proof claims on the scoped path;
- zero reminder claims;
- zero public positioning that treats the 10-barber hypothesis as validated packaging;
- Founder/operator can apply one qualification rule consistently to Pilot candidates;
- a lightweight evidence record can be opened for every activated Pilot shop;
- customer-facing LINE sender/merchant representation matches the actual current product behavior;
- no protected booking/security/tenant boundary needs to be changed for positioning alignment.

Conversion, activation, and payment outcomes belong to the Pilot itself; they are not Sprint-001 completion criteria.

---

## 10. UX involvement

**Required.**

UX should:

- map the smallest set of affected surfaces/states;
- preserve current mobile hierarchy and working flows where already aligned;
- propose exact content/information-hierarchy changes needed for Pilot truth;
- review changed public surfaces at 375 / 390 / 430 widths;
- preserve shop-first brand hierarchy;
- identify any LINE sender/identity wording that cannot be made truthful without behavior change;
- avoid cosmetic redesign unrelated to conversion, trust, or Product truth;
- produce `UX-001` linked to this Sprint.

UX does **not** decide Product truth, price validation, ICP validation, or new feature scope.

---

## 11. Engineering risk

### Expected risk: Low–Medium

Most approved work should be content/information-hierarchy alignment on existing surfaces.

### Risk escalation condition

Risk becomes **High / Product review required** if UX concludes that truthful LINE representation requires changing:

- tenant-specific messaging architecture;
- LIFF / LINE authentication;
- shop identity ownership;
- booking confirmation sender behavior;
- tenant resolution or customer identity.

Those changes are not authorized in SPR-001.

---

## 12. Do-not-touch constraints

Protect throughout this Sprint and any later implementation review:

- booking transaction and slot-concurrency behavior;
- double-booking protection;
- tenant/shop isolation;
- shop-scoped data access;
- customer booking ownership;
- owner/barber role authorization;
- Super Admin separation;
- LINE identity/auth verification;
- LIFF return/auth behavior unless a separately verified defect is escalated;
- barber availability and schedule logic;
- existing booking create/cancel reliability;
- shop-first customer branding;
- working Sales Page/mobile behavior that is not implicated by this Sprint;
- current CTA destination unless the approved UX demonstrates that terminology/expectation can no longer remain coherent without a scoped change.

Do not refactor protected code merely because SPR-001 touches nearby UI/copy later.

---

## 13. Dependencies

Resolved before opening this Sprint:

- Founder approved Assisted 30-Day Pilot → [PD-009](../04-PRODUCT-DECISIONS.md#pd-009)
- Founder approved current-architecture LINE truth guardrail → [PD-010](../04-PRODUCT-DECISIONS.md#pd-010)
- Founder kept 10-barber packaging as unvalidated hypothesis → [PD-011](../04-PRODUCT-DECISIONS.md#pd-011)
- 599 THB/month remains working price hypothesis → [PD-005](../04-PRODUCT-DECISIONS.md#pd-005)
- reminder claim prohibition remains active → [PD-006](../04-PRODUCT-DECISIONS.md#pd-006)

Required for next transition:

- UX reads current implementation and Product/Brand sources.
- UX creates `UX-001` linked to SPR-001.
- Product reviews UX strictly against this Sprint and Product Decisions.

Only after Product accepts the UX handoff may SPR-001 move to `UX_APPROVED`, and only after the subsequent Product gate may it move to `READY_FOR_ENGINEERING`.

---

## 14. Unresolved Product decisions

**No unresolved Product decision currently blocks `READY_FOR_UX`.**

The following remain hypotheses/questions, not Sprint-001 blockers and not build authorization:

- whether 599 THB/month converts after Pilot;
- whether 10 barbers is the right future package boundary;
- whether the preferred ICP should remain approximately 2–8 barbers after evidence;
- whether shops need configurable booking horizon;
- whether shops need configurable cancellation policy;
- whether variable service duration is required;
- whether pre-appointment reminders solve a repeated material no-show problem;
- whether complex Stats deserve current navigation prominence.

If UX discovers that the current LINE architecture cannot be represented truthfully without behavior change, that becomes a new Product-review question before Engineering; UX must not decide it by expanding this Sprint.

---

## 15. State

**READY_FOR_UX**

STOP before Engineering.
