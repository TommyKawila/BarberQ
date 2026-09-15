# SPR-001 — Pilot Truth & Positioning Alignment

| | |
|---|---|
| Date opened | 2026-09-15 |
| State | **LOCKED** |
| Type | Normal delivery Sprint |
| Phase | Pre-Pilot / Pilot Readiness |
| Product owner | Product / R&D |
| Founder approval | **Approved — 2026-09-15** |
| UX handoff | [UX-001 — Pilot Truth & Positioning Alignment](../handoffs/UX-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) — **Product-approved** |
| Product review | **APPROVED — 2026-09-15** |
| Source / rationale type | Product Decisions + explicit Founder-approved operational requirement |
| Source / rationale | BarberQx Alignment Plan v1 (Marketing + Product + UX/UI audits), Founder approval, [PD-009](../04-PRODUCT-DECISIONS.md#pd-009), [PD-010](../04-PRODUCT-DECISIONS.md#pd-010), [PD-011](../04-PRODUCT-DECISIONS.md#pd-011) |
| Next allowed transition | None — Sprint complete |
| Engineering authorized now? | Complete — Sprint locked |
| Engineering report | [RPT-001-ENG](../reports/RPT-001-ENG.md) |
| QA report | [RPT-001-QA](../reports/RPT-001-QA.md) |
| P0? | No |

> This Sprint owns delivery state under [`WORKFLOW.md`](../WORKFLOW.md). QA passed the approved SPR-001 scope and Product completed the final `PASS` → `LOCKED` review on 2026-09-16. The delivered behavior is now the locked baseline for this Sprint. Do not create SPR-002 as part of this lock decision.

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

SPR-001 is accepted for Engineering against the linked UX-001 and the criteria below. Engineering must not reinterpret these criteria as permission to widen scope.

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
12. Implementation does not introduce new tenant-specific LINE messaging architecture or sender behavior.
13. Before brand-specific sender copy such as “รับข้อความยืนยันจาก BarberQx ผ่าน LINE” is shipped, Engineering must verify from deployment/LINE configuration that the configured global Add Friend destination and push-message channel are in fact the BarberQx platform OA/channel. Do not expose tokens/secrets in the report. If that identity cannot be verified, or the Add Friend URL and push channel do not represent the same intended BarberQx platform sender, stop that part of implementation and return `NEEDS_PRODUCT_REVIEW`; do not change LINE architecture inside SPR-001.

### Pilot operation / evidence

14. The qualified-Pilot operating rule in §5.5 is usable by Founder/operator without inventing additional criteria per lead.
15. The lightweight evidence protocol in §5.6 is defined and usable before the first Pilot shop activates. No new CRM/evidence database is required by this Sprint.
16. Customer feedback or feature requests are recorded as evidence/requests, not automatically converted into build scope.

### Protected baseline

17. Proposed implementation does not change booking transaction/concurrency logic, tenant isolation, customer booking ownership, owner/barber authorization, or production LINE token verification behavior.
18. The existing customer booking sequence remains intact.
19. Merchant/shop identity remains primary on customer-facing booking surfaces.
20. Existing CTA destinations remain unchanged unless the approved UX explicitly requires otherwise; UX-001 does not authorize a destination change.

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

**Completed for this gate.**

Product reviewed [UX-001](../handoffs/UX-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) and accepts its KEEP / CHANGE / REMOVE decisions as the minimal UX/copy solution for SPR-001, subject to the sender-identity verification guardrail in §8.13.

UX-001 preserves:

- current mobile hierarchy and booking flow;
- shop-first brand hierarchy;
- booking/auth/LIFF/tenant architecture;
- existing CTA destination;
- no-reminder truth;
- no new product capability.

Engineering must implement the approved handoff, not redesign it. Material deviation returns to Product/UX review.

---

## 11. Engineering risk

### Expected risk: Low–Medium

Most approved work is content/information-hierarchy alignment on existing surfaces.

### Known verification risk

The repository shows that booking-confirmation push uses a global platform LINE channel token and the Add Friend UI uses a global configured LINE OA URL rather than per-shop credentials. The repository does not itself encode the deployed OA display identity. Therefore brand-specific sender wording is authorized only after the configuration check in §8.13.

### Risk escalation condition

Risk becomes **High / Product review required** if truthful LINE representation would require changing:

- tenant-specific messaging architecture;
- LIFF / LINE authentication;
- shop identity ownership;
- booking confirmation sender behavior;
- tenant resolution or customer identity.

Those changes are not authorized in SPR-001.

---

## 12. Do-not-touch constraints

Protect throughout implementation:

- booking transaction and slot-concurrency behavior;
- double-booking protection;
- tenant/shop isolation;
- shop-scoped data access;
- customer booking ownership;
- owner/barber role authorization;
- Super Admin separation;
- LINE identity/auth verification;
- LIFF return/auth behavior unless a separately verified defect is escalated;
- actual booking-confirmation sender behavior;
- LINE channel/token architecture and per-tenant messaging model;
- barber availability and schedule logic;
- existing booking create/cancel reliability;
- shop-first customer branding;
- working Sales Page/mobile behavior not implicated by UX-001;
- CTA destinations;
- Trial Lead statuses, fields, persistence model, filters, notes workflow, and API/data contract;
- database schema and migrations;
- environment-variable semantics and secret handling.

Do not refactor protected code merely because SPR-001 touches nearby UI/copy. If Engineering believes a protected boundary must change, stop and return to Product instead of implementing that change.

---

## 13. Dependencies

Resolved:

- Founder approved Assisted 30-Day Pilot → [PD-009](../04-PRODUCT-DECISIONS.md#pd-009)
- Founder approved current-architecture LINE truth guardrail → [PD-010](../04-PRODUCT-DECISIONS.md#pd-010)
- Founder kept 10-barber packaging as unvalidated hypothesis → [PD-011](../04-PRODUCT-DECISIONS.md#pd-011)
- 599 THB/month remains working price hypothesis → [PD-005](../04-PRODUCT-DECISIONS.md#pd-005)
- reminder claim prohibition remains active → [PD-006](../04-PRODUCT-DECISIONS.md#pd-006)
- UX-001 created with UX recommendation `UX_APPROVED`
- Product review accepted UX-001 on 2026-09-15

Engineering precondition:

- verify the deployed global LINE Add Friend destination / push channel identity before shipping copy that names BarberQx as the actual LINE sender, per §8.13.

---

## 14. Unresolved Product decisions

**No unresolved Product decision blocks the locked SPR-001 result.**

The following remain hypotheses/questions, not Sprint-001 blockers and not build authorization:

- whether 599 THB/month converts after Pilot;
- whether 10 barbers is the right future package boundary;
- whether the preferred ICP should remain approximately 2–8 barbers after evidence;
- whether shops need configurable booking horizon;
- whether shops need configurable cancellation policy;
- whether variable service duration is required;
- whether pre-appointment reminders solve a repeated material no-show problem;
- whether complex Stats deserve current navigation prominence.

Sender identity remains unverified from deployment configuration. The locked implementation therefore uses the approved sender-neutral fallback and does not ship brand-specific BarberQx sender wording. This does not authorize sender/architecture changes.

---

## 15. Product review of UX-001

### Result

**APPROVED — READY_FOR_ENGINEERING**

Product verified that UX-001:

1. stays inside SPR-001 scope;
2. respects PD-009 Assisted 30-Day Pilot;
3. respects PD-010 merchant-first LINE entry and truthful platform/system sender representation;
4. respects PD-011 by removing the public 10-barber package promise rather than strengthening it;
5. introduces no reminder, no-show, pricing-validation, social-proof, booking-feature, CRM, analytics, or LINE-architecture scope;
6. preserves booking/auth/LIFF/tenant/security boundaries;
7. proposes the smallest necessary changes: copy, terminology, information hierarchy, and existing-surface alignment only.

Repository verification also supports UX-001's statement that BarberQx does not ask shops for LINE OA passwords/credentials: the existing LINE OA install-request validation rejects password/credential/token/secret fields. This is not permission to add credential handling.

### State transition record

- `READY_FOR_UX` → UX recommendation `UX_APPROVED` via UX-001
- UX-001 → **Product-approved**
- `UX_APPROVED` → **READY_FOR_ENGINEERING** via Product review on 2026-09-15
- `READY_FOR_ENGINEERING` → **IMPLEMENTED** via Engineering + [RPT-001-ENG](../reports/RPT-001-ENG.md) on 2026-09-15 (sender-neutral Add Friend fallback after Product resolved the LINE sender blocker)
- `IMPLEMENTED` → **READY_FOR_QA** via Engineering verification on 2026-09-15
- `READY_FOR_QA` → **IMPLEMENTED** via QA FAIL on 2026-09-16 (public FAQ 5 named BarberQx LINE OA while sender identity is unverified)
- `IMPLEMENTED` → **READY_FOR_QA** via Engineering FAQ 5 sender-neutral fix + updated [RPT-001-ENG](../reports/RPT-001-ENG.md) on 2026-09-16
- `READY_FOR_QA` → **PASS** via QA re-review + [RPT-001-QA](../reports/RPT-001-QA.md) on 2026-09-16
- `PASS` → **LOCKED** via Product final review on 2026-09-16

QA has marked **PASS** and Product has completed the final lock review.

---

## 16. Exact Engineering scope

Engineering / Cursor was authorized to make the **smallest implementation necessary** to realize UX-001 on existing surfaces.

### 16.1 Sales Page / marketing copy

- replace scoped open Free Trial wording with Assisted 30-Day Pilot wording;
- align primary/final CTA labels and nearby expectation copy while preserving existing destinations;
- state assisted qualification/setup expectations truthfully;
- preserve 599 THB/month/shop as the post-Pilot continuation price to test without implying validated willingness-to-pay;
- remove visible public “up to 10 barbers” plan/package promise;
- remove/rewrite unsupported adoption/social-proof wording;
- strengthen barber-specific differentiation only with shipped mechanisms already named in UX-001;
- preserve existing layout/components unless minimal content fit requires a local spacing/text-wrap adjustment.

### 16.2 `/trial` application surface

- change visible Free Trial terminology to Pilot application terminology;
- add approved assisted-qualification/setup expectation before submit and in success state;
- keep existing form submission route, validation, rate limiting, storage, lead fields, and data model unchanged;
- do not create accounts or self-service activation behavior;
- preserve credential-safety behavior and do not request/store LINE OA passwords, tokens, or secrets.

### 16.3 Booking success / My Bookings LINE copy

- change Add Friend/system-message wording to confirmation-only language approved by UX-001/Product fallback;
- remove reminder/alert/no-show implication;
- preserve booking success details, shop identity, action order, Add Friend behavior, push behavior, and My Bookings behavior;
- brand-specific BarberQx sender wording was not shipped because sender identity remains unverified;
- do not alter sender behavior, push logic, channel tokens, LIFF/auth, or per-shop messaging architecture.

### 16.4 Super Admin / Trial Lead terminology

- change visible user-facing labels from Trial terminology to Pilot terminology where specified by UX-001;
- keep internal statuses, fields, filters, notes, persistence, API contracts, and workflow unchanged;
- no CRM expansion.

### 16.5 Localization and claim locks

- keep Thai and English/localized variants semantically aligned where the existing surface supports both locales;
- update/add focused copy/UX tests only where needed to lock the approved Pilot, price, reminder, social-proof, and sender-truth rules;
- do not turn copy tests into new Product behavior.

No other implementation was authorized.

---

## 17. Required tests and checks

Engineering reported exact commands and results in `RPT-001-ENG`; QA independently reviewed the approved scope in `RPT-001-QA`.

### Automated baseline

Required baseline:

- `npm run lint`
- `npm run typecheck`
- `npm run test:security`
- `npm run test:booking`
- `npm run test:onboarding`
- `npm run build`

QA accepted the reported result: typecheck, security, booking, onboarding, focused claim-lock tests, and build pass. Lint continues to fail only on pre-existing unrelated findings, with no new SPR-001 lint finding attributed by QA.

### Required claim/copy checks

Locked result verifies on scoped surfaces that:

- open self-service Free Trial claims are gone;
- Assisted 30-Day Pilot expectation is consistent;
- `/trial` does not imply instant account/system access;
- 599 THB/month/shop is framed as post-Pilot continuation price, not validated pricing;
- public “up to 10 barbers” package promise is absent;
- unsupported adoption/social-proof wording is absent;
- reminder / pre-appointment alert / no-show-reduction claims are absent;
- LINE confirmation/Add Friend wording does not imply the shop OA is the sender;
- unverified sender identity uses sender-neutral wording rather than BarberQx-as-sender claims.

### Responsive/manual checks

QA accepted responsive review at:

- 375px
- 390px
- 430px
- desktop

Scoped public/customer surfaces preserve the approved hierarchy, CTA destinations, merchant-first branding, and interaction/accessibility behavior.

### Protected-boundary regression check

QA confirmed the locked implementation did **not** change:

- booking transaction/concurrency code;
- auth/LIFF/customer identity code;
- tenant/shop-scoping logic;
- booking create/cancel behavior;
- LINE push sender behavior/channel architecture;
- database schema/migrations;
- Trial Lead API/data model/status workflow.

---

## 18. State

**LOCKED**

QA re-reviewed commit `31d35d091dafc7f84e345145195d8f1f40e7a1a6` and marked SPR-001 **PASS** in [RPT-001-QA](../reports/RPT-001-QA.md). Product reviewed that PASS on 2026-09-16 and completed `PASS` → `LOCKED` under [`WORKFLOW.md`](../WORKFLOW.md).

Sender identity remains **unverified** from deployment configuration. Brand-specific BarberQx sender wording was not shipped. The approved sender-neutral fallback is the locked truth for this Sprint unless a later Product Decision explicitly revisits sender representation.

No SPR-002 was created by this lock action.
