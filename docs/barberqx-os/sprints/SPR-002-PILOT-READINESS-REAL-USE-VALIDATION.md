# SPR-002 — Pilot Readiness & Real-Use Validation

| | |
|---|---|
| Date opened | 2026-09-16 |
| State | **READY_FOR_UX** |
| Type | Normal delivery Sprint |
| Phase | Pre-Pilot / Pilot Readiness |
| Product owner | Product / R&D |
| Founder approval | **Approved — 2026-09-16** |
| Source / rationale type | Explicit Founder-approved operational requirement + Roadmap NOW + locked SPR-001 baseline |
| Source / rationale | Founder-approved SPR-002 concept; [`03-PRODUCT-ROADMAP.md`](../03-PRODUCT-ROADMAP.md) Pilot-readiness priorities; [`CURRENT-STATE.md`](../CURRENT-STATE.md) validation targets; [`SPR-001`](./SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) locked baseline |
| Next allowed transition | `UX_APPROVED` after linked `UX-002` defines the bounded validation handoff |
| Engineering authorized now? | **No** |
| Feature/code implementation authorized now? | **No** |
| P0? | No — unless a qualifying production/security incident is discovered during validation |

> This Sprint owns delivery state under [`WORKFLOW.md`](../WORKFLOW.md). `READY_FOR_UX` authorizes **validation-handoff work only**. It does not authorize Cursor / Engineering implementation, speculative fixes, feature development, architecture changes, or SPR-003.

---

## 1. Objective

Validate that the **existing BarberQx product** is operationally ready for a qualified Pilot shop to go live with real customers, using manual operating procedures and evidence capture wherever possible.

The primary question is:

> **Can a qualified barber shop be assisted from setup → shop LINE OA entry → first real customer booking → owner queue operation without a critical product, mobile, LINE, tenancy, security, or usability failure?**

This is a validation Sprint, not a feature Sprint.

No Product code change is assumed at Sprint start.

---

## 2. Product truth and baseline

### Locked baseline

[`SPR-001 — Pilot Truth & Positioning Alignment`](./SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) is **LOCKED** and is the starting baseline for SPR-002.

Preserve its delivered truth:

- acquisition is an **Assisted 30-Day Pilot**, not open self-service Free Trial;
- `/trial` represents application → contact/qualification → assisted setup;
- 599 THB/month/shop is the working post-Pilot continuation price to test, not validated willingness-to-pay;
- no public 10-barber package promise;
- no unsupported adoption/social-proof claim;
- LINE sender identity remains unverified from repository/config alone and customer-facing fallback is sender-neutral;
- no reminder / pre-appointment / no-show-reduction claims;
- booking/auth/LIFF/tenant/concurrency/security boundaries remain protected.

### Validation targets, not proven outcomes

From [`CURRENT-STATE.md`](../CURRENT-STATE.md):

- owner setup ≤15 minutes;
- first customer booking ≤60 seconds;
- approximately 5 initial Pilot shops;
- 3–4 continuing at 599 THB/month would be a strong early commercial signal, not PMF.

The ≤15-minute setup and ≤60-second booking values are **targets to measure**, not automatic Sprint-fail thresholds and not validated claims.

### Customer evidence status

No Product-reviewed customer evidence is assumed by this Sprint. Observations, confusion, requests, or desired features discovered during validation must be recorded first and may later become `INS-*` drafts under [`02-CUSTOMER-INSIGHTS.md`](../02-CUSTOMER-INSIGHTS.md). They do not authorize implementation by themselves ([PD-008](../04-PRODUCT-DECISIONS.md#pd-008)).

---

## 3. Users affected

- qualified Pilot shop owner / buyer;
- owner-barber or shop staff operating the queue;
- real customer booking from the shop's LINE OA;
- Founder / operator assisting setup and observing readiness;
- UX observing tasks/states;
- Engineering validating technical behavior only after the Product gate.

---

## 4. Exact problem to solve

BarberQx has a locked, QA-passed Product/positioning baseline, but real-shop readiness is not yet established by structured operational evidence.

Before Shop #1 is exposed to normal customer use, Product must validate that:

1. the shop can be set up correctly without a critical blocker;
2. the shop's LINE OA opens the correct BarberQx shop context;
3. a real customer can complete the existing booking path in a real LINE in-app mobile session;
4. the owner can see and operate the resulting booking using existing owner surfaces;
5. the current product preserves tenant/security/booking correctness under this real-use path;
6. observed friction can be separated from actual readiness defects and speculative feature requests.

The default response to uncertainty is **observe and record**, not build.

---

## 5. Shop #1 Activation Gate

**Shop #1 must pass this Activation Gate before normal customer use begins.**

### A. Qualification readiness

The shop must satisfy the approved Pilot operating criteria from SPR-001:

1. real operating barber shop, not a demo/test shop;
2. accepts at least some advance bookings;
3. LINE / LINE OA is a meaningful customer communication or booking channel;
4. has a real manual coordination problem around checking/replying about booking availability;
5. agrees to assisted setup and to use BarberQx with real customers during the 30-day Pilot;
6. understands before activation that 599 THB/month/shop is the working continuation price to test after Pilot and that Day 30 is a continue-or-stop decision.

Preferred but not mandatory signals remain approximately 2–8 barbers, customers selecting a specific barber, and owner/owner-barber experiencing booking interruptions.

### B. Evidence readiness

Before activation:

- a manual Pilot evidence record exists;
- baseline shop/workflow information is captured;
- setup timing can be recorded;
- first real booking timing can be recorded;
- blockers and assistance can be recorded without requiring new software.

### C. Shop setup readiness

Using existing product behavior:

- owner can access/claim the correct shop tenant;
- shop identity is correct;
- required shop profile/contact information is usable;
- active barber/team configuration is correct;
- current hours/availability needed for booking are correct;
- the shop has a usable LINE OA booking entry/link/button configuration;
- no shop is activated on the wrong tenant or wrong merchant identity.

### D. Real customer-path readiness

Before normal customer use:

- use at least one **real physical mobile device**;
- enter through the shop's own LINE OA / intended LINE entry;
- real LINE/LIFF customer identity completes correctly;
- correct shop context is shown;
- existing flow completes: **barber → date → time → confirm**;
- success state shows correct shop/barber/date/time;
- optional LINE/Add Friend representation remains sender-neutral while sender identity is unverified;
- booking appears in the correct owner's operational queue;
- customer can view the booking in My Bookings;
- controlled cancellation is checked where the existing cancellation policy permits it.

### E. Integrity readiness

No activation if validation exposes:

- tenant leakage / wrong-shop data;
- customer identity mismatch;
- owner/barber authorization failure;
- double-booking regression;
- incorrect successful booking for an unavailable/taken slot;
- data-integrity issue;
- booking outage;
- critical LINE/auth failure preventing the approved flow.

### Activation decision

**PASS — Shop #1 may go live** only when all critical Activation Gate items are satisfied.

**STOP — NEEDS_PRODUCT_REVIEW** if a non-P0 readiness blocker prevents safe activation.

**P0 INCIDENT** if the issue meets the emergency criteria in §13.

---

## 6. Manual evidence protocol

Prefer manual/lightweight evidence capture. Do **not** build a Pilot CRM, research database, analytics expansion, or new evidence product in this Sprint.

### Before activation

Capture at minimum:

- shop name / contact;
- number of active barbers;
- primary booking channel(s);
- whether customers commonly choose a barber;
- estimated booking/availability questions per day or week;
- who currently checks/responds to availability;
- current manual booking workflow summary;
- qualification notes;
- explicit acknowledgement of the 599 THB/month post-Pilot test price.

### Activation

Capture:

- assisted setup start and end / elapsed time;
- where Founder/operator assistance was required;
- ready-for-customer-booking date/time;
- first real customer booking date/time;
- approximate first-booking completion time where practical;
- material setup or activation blocker, if any;
- physical device / LINE in-app context used for the readiness check.

### Early real use

Capture observations such as:

- customer completed booking without coaching / required help / failed;
- owner saw the booking correctly;
- owner could operate the required queue task;
- repeated confusion or terminology issue;
- technical failure;
- feature request;
- workaround used;
- whether the observation occurred once or repeatedly.

### Commercial checkpoints remain outside Sprint-completion proof

The Pilot should still preserve:

- Day 14 value signal;
- Day 21 continuation / willingness-to-pay signal;
- Day 30 continue at 599 THB/month or stop.

These commercial outcomes belong to the Pilot and later evidence review. They are **not** required to complete SPR-002 readiness validation.

### Evidence discipline

- Observation ≠ Product fact.
- Feature request ≠ Sprint scope.
- Potential implication ≠ engineering ticket.
- Reusable observations may later become `INS-*` drafts and require Product review before influencing roadmap priority.

---

## 7. Setup and activation validation activities

Validate the current owner setup path rather than redesigning it.

Observe and record whether the owner can:

1. claim/access the intended shop;
2. understand the correct shop identity;
3. set or confirm shop profile/contact information needed for Pilot;
4. establish the active barber/team configuration;
5. establish booking hours/availability needed for normal use;
6. identify the shop's booking entry/link for LINE OA;
7. complete one controlled booking before go-live;
8. see that booking from the owner side;
9. understand when the shop is ready to accept normal customer bookings.

Record elapsed setup time.

If setup exceeds the ≤15-minute target, capture where time was spent and whether the cause was:

- operator explanation;
- shop-specific preparation;
- one-off confusion;
- repeated usability friction;
- technical defect.

Do not automatically create an onboarding feature/change because the target was missed once.

---

## 8. Customer real-booking validation

Validate the existing customer path on a real shop context.

### Required tasks

1. enter from the shop's LINE OA / intended shop LINE entry;
2. confirm merchant/shop identity;
3. authenticate through existing LINE/LIFF identity flow;
4. select a barber;
5. select a date;
6. select an available time;
7. confirm the booking;
8. verify success details;
9. verify My Bookings contains the correct booking;
10. where permitted, verify controlled cancellation behavior;
11. verify owner sees the resulting booking in the correct shop/queue.

### Timing

Measure first-customer-booking duration where practical.

The ≤60-second target is a validation target, not an automatic Sprint failure. If exceeded, record the cause before proposing any UX or Product change.

### Reliability observation

Use existing behavior to confirm that an unavailable/taken slot does not silently become a conflicting successful booking. Do not change concurrency logic as part of the validation itself.

---

## 9. Owner task validation

Observe whether a real Pilot owner can complete the following existing operational tasks without developer intervention:

- find today's queue;
- identify which barber a booking belongs to;
- confirm that a newly created booking appears correctly;
- inspect the team's booking availability;
- use the existing controls to open/close booking availability for a barber where that behavior already exists;
- understand enough of the current schedule/hours state to operate the shop's bookings;
- access settings/setup help when needed.

Founder/operator assistance is allowed because this is an Assisted Pilot. Record where assistance was needed.

Do not pre-authorize Team, Schedule, Stats, navigation, or onboarding redesign because of one observation.

---

## 10. LINE in-app and responsive/mobile validation

### Real LINE requirement

Before Shop #1 go-live, complete at least one end-to-end customer booking on a **real physical mobile device inside LINE / the intended LINE in-app context**.

Validate:

- LINE/LIFF entry and return behavior;
- correct shop context;
- merchant/shop identity remains primary;
- customer can complete the current form/booking interaction;
- no critical keyboard/input/CTA obstruction;
- no blocked login/return/confirm action;
- optional Add Friend/extra LINE copy remains sender-neutral while sender identity is unverified;
- no reminder/pre-appointment/no-show implication appears.

### Responsive checks

Check affected/current critical flows at:

- 375px;
- 390px;
- 430px;
- desktop/reference owner viewport.

A second physical OS/device is useful if readily available but is not a mandatory Founder gate for Shop #1 unless the first device exposes a device-specific concern requiring comparison.

---

## 11. Success criteria

SPR-002 readiness validation is successful when all of the following are true:

1. the Activation Gate exists and is actually used for Shop #1;
2. Shop #1 satisfies the approved operational qualification rule;
3. a manual evidence record exists before activation;
4. assisted setup completes without a critical readiness blocker;
5. setup elapsed time is measured;
6. the shop's intended LINE OA entry opens the correct shop tenant/context;
7. at least one real physical-device LINE in-app customer booking succeeds end-to-end;
8. first-booking completion time is measured where practical;
9. booking success shows correct shop/barber/date/time;
10. the owner sees the resulting booking in the correct operational queue;
11. My Bookings works for that customer;
12. controlled cancellation is verified where the current policy permits it;
13. no P0 security/tenant/auth/double-booking/data-integrity failure is observed;
14. no prohibited sender/reminder/no-show claim reappears;
15. customer/owner confusion and requests are captured as observations instead of automatically becoming scope;
16. Product has enough evidence to state only the bounded readiness conclusion: **Shop #1 can safely enter the Assisted Pilot using the existing product**.

SPR-002 success does **not** prove PMF, validated pricing, reminder need, variable-duration need, or quantified reduction in booking workload.

---

## 12. Usability failure thresholds for UX-002

UX-002 must define observable thresholds using the existing product, without pre-designing solutions.

At minimum distinguish:

### Activation-blocking usability failure

Examples:

- customer cannot discover/complete a required step without operator intervention;
- owner cannot locate or operate a core queue task needed for Pilot use;
- critical control is inaccessible/unusable in the real LINE/mobile context;
- current UI creates a materially wrong shop, booking, or sender expectation that prevents safe use.

Action: `NEEDS_PRODUCT_REVIEW` before Shop #1 normal go-live.

### Non-blocking friction / observation

Examples:

- hesitation;
- terminology preference;
- extra explanation needed once;
- optional task confusion;
- request for more convenience or configuration.

Action: record evidence first. Do not design/build automatically.

### Technical/P0 failure

Use §13 and WORKFLOW emergency path.

---

## 13. Failure and escalation criteria

### P0 — emergency workflow

If validation discovers any of the following, use the P0 path in [`WORKFLOW.md`](../WORKFLOW.md):

- security vulnerability;
- tenant isolation failure;
- double-booking regression;
- booking outage;
- LINE/auth failure that prevents the approved booking flow;
- production data-integrity issue;
- equivalent critical production incident.

P0 remediation does not authorize unrelated feature work.

### Non-P0 activation blocker

Examples:

- owner cannot claim/access the correct shop;
- real customer cannot complete the approved booking path;
- wrong shop/customer context appears without a confirmed security incident classification;
- owner cannot see a valid newly created booking;
- critical mobile/LINE interaction is unusable;
- booking create/cancel produces an incorrect state that does not meet P0 criteria.

Action:

**STOP Shop #1 activation → `NEEDS_PRODUCT_REVIEW`.**

Product must classify the issue before any implementation is authorized.

### Observe / no build authorization

Examples:

- reminder request;
- no-show concern without validated repeated evidence;
- variable service duration request;
- different booking-horizon preference;
- configurable cancellation preference;
- more analytics/Stats request;
- navigation preference;
- broader CRM request;
- one-off terminology preference.

Action: record only. Candidate/Hypothesis status remains unchanged unless later Product/Founder action explicitly promotes it.

---

## 14. Explicitly out of scope

SPR-002 does **not** authorize:

- pre-appointment reminders;
- no-show automation;
- service catalogue / service selection expansion;
- variable service duration;
- configurable booking horizon;
- configurable cancellation policy;
- new CRM / Pilot CRM / evidence database;
- analytics expansion;
- Stats redesign;
- navigation re-architecture;
- payments/subscriptions implementation;
- POS, inventory, accounting, payroll, commission, loyalty;
- marketplace;
- AI chatbot/receptionist;
- enterprise/multi-branch architecture;
- tenant-specific LINE messaging architecture;
- LINE sender architecture changes;
- redesign of the core customer booking flow;
- broad onboarding redesign;
- speculative UX improvements;
- feature implementation based only on a Pilot observation/request;
- claim that 599 THB/month is validated willingness-to-pay;
- claim that ≤15-minute setup or ≤60-second booking has been achieved until actually measured;
- SPR-003 or unrelated cleanup/refactor.

---

## 15. Protected technical boundaries

Carry forward the locked SPR-001 baseline.

Do not change without explicit Product classification/authorization:

- booking transaction logic;
- slot concurrency / double-booking protection;
- tenant/shop isolation;
- shop-scoped data access;
- customer booking ownership;
- owner/barber role authorization;
- Super Admin separation;
- LINE identity/auth verification;
- LIFF return/auth behavior;
- booking create/cancel semantics;
- LINE push sender behavior/channel architecture;
- Add Friend visibility/sender architecture;
- per-tenant LINE messaging model;
- database schema/migrations;
- CTA destinations;
- Pilot/Trial lead API/data model/status workflow;
- merchant-first customer branding.

Validation may inspect these behaviors. It does not authorize changing them.

---

## 16. Manual operation vs Product changes

Default treatment:

| Activity / finding | Default action |
|---|---|
| Pilot qualification | **MANUAL** |
| Evidence record | **MANUAL** |
| Setup timing | **MANUAL** |
| Booking timing | **MANUAL** |
| Founder/operator support notes | **MANUAL** |
| Real LINE/device check | **MANUAL VALIDATION** |
| Owner-task observation | **MANUAL VALIDATION** |
| Feature request | **RECORD ONLY** |
| One-off confusion/preference | **OBSERVE FIRST** |
| Repeated friction | **EVIDENCE → PRODUCT REVIEW** |
| Verified readiness defect | **PRODUCT CLASSIFICATION REQUIRED** |
| Security/tenant/auth/double-booking/data failure | **P0 TRIAGE** |
| New capability request | **OUT OF SCOPE** |

### Verified defect rule

Engineering may later diagnose a verified readiness defect after Product review, but diagnosis does not itself authorize implementation.

Before code is changed, Product must classify the finding as one of:

- restore already-approved existing behavior within SPR-002;
- P0 emergency remediation;
- new Product scope requiring a separate Product/Founder decision.

No code change is assumed at Sprint start.

---

## 17. UX-002 required scope

**UX involvement is required, but UX-002 is a validation handoff only.**

UX-002 must define and hand back:

### Customer tasks to observe

- enter from shop LINE context;
- verify shop identity;
- choose barber/date/time;
- confirm booking;
- understand success state;
- access My Bookings;
- use cancellation where permitted.

### Owner tasks to observe

- access/claim correct shop;
- complete/understand current setup requirements;
- find today's queue;
- identify barber ownership of a booking;
- see a new customer booking;
- inspect/manage existing barber availability controls;
- understand enough schedule/hours state to operate Pilot bookings.

### Mobile / LINE states

- LINE/LIFF entry/loading/auth/return;
- shop context;
- booking form states;
- unavailable/taken slot recovery as currently implemented;
- success state;
- sender-neutral optional LINE/Add Friend state;
- My Bookings;
- cancellation states;
- critical owner mobile states used during Pilot setup/operation.

### Usability failure thresholds

Define observable criteria for:

- activation-blocking usability failure;
- non-blocking friction;
- Product-return condition;
- evidence-only observation.

### KEEP boundaries

UX-002 must explicitly preserve:

- current customer sequence barber → date → time → confirm;
- shop-first merchant identity;
- booking/auth/LIFF/tenant architecture;
- booking concurrency/reliability behavior;
- sender-neutral LINE truth while sender identity is unverified;
- current pricing/Pilot truth from SPR-001;
- current CTA destinations;
- existing owner task model unless a verified blocker is later classified.

### Product-return criteria

UX returns to Product, without designing a solution, when validation indicates:

- activation-blocking usability failure;
- a change would require new capability;
- a change would touch protected architecture/behavior;
- a repeated observation might justify a Product decision;
- sender/LINE truth cannot be preserved with current behavior;
- the proposed response would broaden Sprint scope.

### UX-002 must NOT

- pre-design solutions for hypothetical issues;
- create a backlog of speculative improvements;
- decide Product scope;
- authorize Engineering;
- turn observations into features;
- redesign working surfaces merely for polish.

---

## 18. Engineering role

Engineering involvement is expected **after** the normal UX/Product gate, but the default role is technical validation, not feature development.

Potential authorized Engineering activity after a future `READY_FOR_ENGINEERING` transition may include:

- confirm current build/environment used for validation;
- run existing relevant automated suites;
- support a controlled production-like readiness check;
- inspect/log actual technical failures encountered during approved validation;
- confirm whether observed behavior matches existing implementation truth;
- document verified defects;
- create `RPT-002-ENG` describing what was validated, what changed (if anything was later authorized), and how to verify.

A valid Engineering outcome may be:

> **Existing implementation validated; no Product code change required.**

Engineering is **not authorized now** to:

- implement any feature;
- fix non-P0 findings before Product classification;
- refactor protected code;
- change LINE/auth/LIFF/tenant/concurrency architecture;
- implement speculative UX improvements;
- create SPR-003.

---

## 19. Acceptance criteria for READY_FOR_UX → next gate

SPR-002 remains `READY_FOR_UX` until a linked `UX-002` exists and Product can verify that it:

1. is a validation handoff only;
2. covers the approved customer tasks;
3. covers the approved owner tasks;
4. covers real LINE/mobile states;
5. defines activation-blocking vs non-blocking usability thresholds;
6. preserves all KEEP/protected boundaries;
7. defines Product-return criteria;
8. does not pre-design speculative solutions;
9. does not introduce feature scope;
10. does not authorize Engineering implementation.

Only after UX-002 is accepted may Product consider the next normal workflow gate.

---

## 20. Dependencies

Resolved:

- Founder approved SPR-002 concept on 2026-09-16;
- SPR-001 is LOCKED and is the baseline;
- Roadmap NOW includes Pilot-ready core experience, owner onboarding readiness, customer booking reliability, first qualified Pilot shops, observing real usage, and validating HYP-004;
- PD-001 through PD-011 remain in force;
- reminders, variable duration, booking UX improvements, and onboarding improvements remain candidates/hypotheses unless separately promoted;
- CURRENT-STATE remains Pre-Pilot / Pilot Readiness.

Required next:

- UX reads this Sprint plus North Star, Product Decisions, BRAND, CURRENT-STATE, and relevant current product surfaces;
- UX creates linked `UX-002` as a **validation handoff only**;
- Product reviews UX-002 strictly against this Sprint before any Engineering authorization.

---

## 21. State

**READY_FOR_UX**

UX-002 validation-handoff work is authorized.

**No Product feature implementation or code change is authorized at this state.**

No Cursor/Engineering implementation instructions have been issued.

Do not create SPR-003.

STOP before Engineering.
