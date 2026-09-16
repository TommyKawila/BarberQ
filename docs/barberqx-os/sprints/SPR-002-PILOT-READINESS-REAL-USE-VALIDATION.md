# SPR-002 — Pilot Readiness & Real-Use Validation

| | |
|---|---|
| Date opened | 2026-09-16 |
| State | **READY_FOR_ENGINEERING** |
| Type | Normal delivery Sprint |
| Phase | Pre-Pilot / Pilot Readiness |
| Product owner | Product / R&D |
| Founder approval | **Approved — 2026-09-16** |
| UX handoff | [UX-002 — Pilot Readiness & Real-Use Validation](../handoffs/UX-002-PILOT-READINESS-REAL-USE-VALIDATION.md) — **Product-approved** |
| Product review | **APPROVED — 2026-09-16** |
| Source / rationale type | Explicit Founder-approved operational requirement + Roadmap NOW + locked SPR-001 baseline |
| Source / rationale | Founder-approved SPR-002 concept; [`03-PRODUCT-ROADMAP.md`](../03-PRODUCT-ROADMAP.md) Pilot-readiness priorities; [`CURRENT-STATE.md`](../CURRENT-STATE.md) validation targets; [`SPR-001`](./SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) locked baseline |
| Next allowed transition | `IMPLEMENTED` after authorized Engineering validation is complete and `RPT-002-ENG` exists; zero application-code change is a valid outcome |
| Engineering authorized now? | **Yes — validation preparation / inspection / testing / diagnosis only** |
| Feature/code implementation authorized now? | **No — non-P0 code change requires Product classification + explicit authorization first** |
| Engineering report | [RPT-002-ENG](../reports/RPT-002-ENG.md) — validation prep only; Shop #1 unnamed |
| P0? | No — unless a qualifying production/security incident is discovered during validation |

> This Sprint owns delivery state under [`WORKFLOW.md`](../WORKFLOW.md). Product has accepted UX-002. `READY_FOR_ENGINEERING` in **this validation Sprint** authorizes technical validation work only: inspect, test, prepare the controlled validation environment, support the approved Shop #1 checks, diagnose findings, and report evidence. It does **not** authorize speculative fixes, feature development, onboarding/booking redesign, protected-architecture changes, or SPR-003. Any non-P0 code fix must return to Product for classification and explicit authorization before code changes begin.

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
- Engineering validating technical behavior after the Product gate.

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

UX-002 defines the approved observable thresholds using the existing product, without pre-designing solutions.

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

Engineering may diagnose a verified readiness defect, but diagnosis does not itself authorize implementation.

Before any **non-P0** code is changed, Product must classify the finding as one of:

- restore already-approved existing behavior within SPR-002 — may be authorized only by an explicit later Product decision on that defect;
- new Product scope requiring a separate Product/Founder decision;
- observation/friction/feature request — record only, no implementation.

A qualifying P0 follows the emergency path in WORKFLOW.

No code change is assumed at Sprint start.

---

## 17. UX-002 scope and Product review

[UX-002 — Pilot Readiness & Real-Use Validation](../handoffs/UX-002-PILOT-READINESS-REAL-USE-VALIDATION.md) is a **validation handoff only** and is **Product-approved**.

Product verified that UX-002:

1. stays strictly inside SPR-002 scope;
2. does not pre-design fixes or create speculative backlog;
3. observes the existing customer sequence **barber → date → time → confirm**;
4. validates existing owner operation only;
5. requires real physical-device LINE in-app validation before Shop #1 go-live;
6. preserves the Shop #1 Activation Gate;
7. keeps ≤15-minute setup and ≤60-second booking as measurement targets only;
8. correctly distinguishes **P0 / Activation Blocker / Usability Friction / Feature Request**;
9. returns activation blockers, protected-boundary changes, repeated meaningful friction, sender-truth issues, and scope-expanding responses to Product;
10. preserves booking/auth/LIFF/tenant/concurrency/LINE and merchant-first KEEP boundaries;
11. provides sufficient lightweight manual evidence capture without CRM/evidence software;
12. does not implicitly authorize feature or code implementation.

### UX-002 validated task scope

Customer tasks:

- enter from shop LINE context;
- verify shop identity;
- LINE/LIFF login and return;
- select barber/date/time;
- confirm booking;
- validate Booking Success;
- validate sender-neutral optional Add Friend state;
- validate My Bookings;
- validate cancellation where permitted.

Owner tasks:

- access correct shop;
- verify team and hours/availability;
- find today's queue;
- identify booking/barber;
- use existing availability controls needed for Pilot operation;
- confirm the real/test booking appears;
- perform normal operation without developer intervention.

UX-002 remains a supporting artifact. This Sprint owns delivery state.

---

## 18. Engineering validation scope — authorized now

Engineering / Cursor may now begin **validation preparation and technical validation support only**.

### Authorized work

Engineering may:

- inspect the repository and current deployment/configuration needed to understand the approved validation path, without exposing secrets;
- confirm the current build/commit/environment that will be used for Shop #1 validation;
- run existing automated tests and build/lint/type checks;
- verify existing production-like configuration needed for LINE/LIFF, shop routing, Supabase, and the current booking path without altering protected architecture;
- prepare a controlled test shop / existing safe validation context using current supported mechanisms;
- support Founder/operator in executing the approved manual validation checklist;
- inspect logs/state needed to diagnose an actual observed failure;
- reproduce and classify a suspected technical defect;
- document whether behavior matches the current approved implementation truth;
- collect technical evidence for Product/QA;
- create/update `RPT-002-ENG` with validation evidence and exact results.

### Not authorized now

Engineering may **not**:

- change application code to address a non-P0 defect without a later explicit Product authorization;
- implement a feature;
- redesign onboarding, booking, owner surfaces, navigation, or copy;
- add reminders, variable duration, configuration options, CRM, analytics, or other candidate scope;
- change schema/migrations;
- change booking/concurrency/auth/LIFF/tenant/LINE sender architecture;
- refactor protected code because it is nearby;
- turn usability friction or feature requests into implementation work;
- create SPR-003.

A valid Engineering outcome is:

> **Existing implementation validated; no Product code change required.**

In this Sprint, `READY_FOR_ENGINEERING` means **ready for technical validation**, not blanket implementation permission.

---

## 19. Required Engineering checks before Shop #1 activation

Engineering must verify and record the following before the Activation Gate can pass.

### 19.1 Automated baseline

Run at minimum on the validation commit/environment:

- `npm run lint`
- `npm run typecheck`
- `npm run test:security`
- `npm run test:shop`
- `npm run test:booking`
- `npm run test:onboarding`
- `npm run build`

Report exact commands and results in `RPT-002-ENG`.

Do not weaken or remove tests to obtain a pass.

If `npm run lint` still fails only for known pre-existing, unrelated findings from the locked baseline, record the exact findings and confirm no new SPR-002-relevant lint regression. A new or relevant lint failure must be classified; it must not be silently ignored.

### 19.2 Environment / production-like readiness

Without printing or committing secrets, verify:

- the validation build/commit is identified;
- required production-like app/Supabase/LINE/LIFF configuration for the approved path is present enough to run the controlled validation;
- the intended Shop #1 tenant/shop context is identified;
- shop LINE OA/intended entry points to the correct current booking context;
- no environment change is used to invent sender identity or bypass SPR-001 sender-neutral truth;
- validation does not rely on local prototype/LINE mock as proof of physical-device LINE readiness.

### 19.3 Shop setup / owner readiness

Using current supported behavior, verify with Founder/operator evidence that:

- owner accesses the correct shop tenant;
- shop identity is correct;
- team/barber state required for Pilot is correct;
- hours/availability required for Pilot are correct;
- intended LINE OA booking entry is usable;
- owner can find today's queue;
- owner can identify the booking/barber;
- owner can use the existing availability controls required for Pilot operation;
- owner sees the controlled booking correctly.

### 19.4 Real customer booking path

On at least one **real physical mobile device inside LINE / intended LINE in-app context**, verify:

- shop LINE OA/intended entry → correct shop context;
- LINE/LIFF login/return → correct identity/context;
- barber → date → time → confirm succeeds using existing behavior;
- Booking Success details are correct;
- optional Add Friend/LINE copy is sender-neutral and non-blocking while sender identity remains unverified;
- My Bookings contains the correct booking;
- controlled cancellation works where current policy permits;
- owner sees the resulting booking in the correct shop/queue.

Record setup elapsed time and first-booking elapsed time where practical. The ≤15-minute and ≤60-second values remain measurement targets only.

### 19.5 Responsive / interaction checks

Check critical current customer and owner states at:

- 375px;
- 390px;
- 430px;
- desktop/reference owner viewport.

Verify no activation-blocking:

- horizontal overflow/clipping;
- keyboard obstruction of required inputs/primary CTA;
- inaccessible critical control;
- wrong shop/merchant identity;
- blocked confirmation or return action.

### 19.6 Integrity / protected-behavior checks

Use existing automated tests plus controlled validation evidence to confirm no observed:

- tenant leakage;
- wrong-shop/wrong-customer state;
- authorization anomaly;
- conflicting successful double booking;
- incorrect successful booking for unavailable/taken slot;
- data-integrity issue;
- booking outage;
- critical LINE/auth failure.

Do not alter protected behavior merely to perform these checks.

---

## 20. Finding and defect-handling rules

Engineering must classify findings by behavior/evidence, not by desired solution.

### A. No defect found

If the approved checks complete with no Activation Blocker or P0 issue:

1. make **no application-code change**;
2. complete the manual evidence record with Founder/operator;
3. record automated and production-like/manual results in `RPT-002-ENG`;
4. record actual setup/booking measurements without converting them into claims;
5. state explicitly that existing implementation required no Product code change;
6. once all Engineering validation obligations are complete, Engineering may transition the Sprint `READY_FOR_ENGINEERING → IMPLEMENTED`, then `IMPLEMENTED → READY_FOR_QA` with the report/how-to-verify package.

For this validation Sprint, `IMPLEMENTED` may mean **the approved validation work is completed with zero application-code change**.

### B. Non-P0 defect / Activation Blocker

If a real non-P0 defect prevents safe activation:

1. **STOP Shop #1 normal go-live** for the affected path;
2. capture exact reproduction steps, environment/commit, screenshots/log evidence where safe, expected vs actual behavior, and user impact;
3. classify the finding as `NEEDS_PRODUCT_REVIEW`;
4. diagnose enough to identify likely affected area, but **do not change application code**;
5. return the defect to Product for classification and explicit authorization;
6. do not move Sprint to `IMPLEMENTED` while an unresolved Activation Blocker remains.

Product may later decide that the defect is:

- a minimal restoration of already-approved behavior that can be explicitly authorized inside SPR-002;
- new Product scope requiring a separate Founder/Product decision;
- non-blocking friction/evidence only.

Engineering must not make that Product decision itself.

### C. P0 / security / tenant / auth / double-booking / data-integrity issue

If the finding meets the P0 criteria in WORKFLOW:

1. stop affected validation/go-live;
2. immediately use the P0 emergency workflow;
3. Product / Engineering triage the incident;
4. immediate remediation may proceed under the P0 rules when necessary to protect security, data integrity, or booking availability;
5. do not use P0 as permission for unrelated feature or architecture work;
6. create/update the required implementation evidence/report;
7. require QA and Product post-review before the durable result is locked.

### D. Usability Friction / Observe

If the user hesitates, needs one explanation, expresses a terminology preference, or experiences non-blocking optional-task confusion:

- record the observation;
- record frequency/repetition when more evidence appears;
- do not change code/design;
- return to Product only when repeated meaningful evidence meets UX-002 Product-return criteria.

### E. Feature Request / Record Only

For reminders, variable duration, booking horizon, cancellation configuration, CRM, analytics, navigation, or any new capability request:

- record the request and evidence;
- do not create implementation scope;
- do not add it to SPR-002 delivery work;
- follow PD-008 / INS review before any later roadmap decision.

---

## 21. Required Engineering report

Engineering must create:

`docs/barberqx-os/reports/RPT-002-ENG.md`

The report must link:

- this `SPR-002`;
- Product-approved `UX-002`;
- the locked `SPR-001` baseline where relevant.

At minimum include:

1. validation commit/build/environment identifier;
2. files changed — expected to be **none for application code unless a later Product/P0 authorization exists**;
3. exact automated commands and results;
4. environment/config readiness result without secrets;
5. Shop #1 qualification/evidence-record status (no unnecessary personal data in repo report);
6. setup/activation checks and measured elapsed time;
7. real physical-device LINE in-app test context and result;
8. customer booking-path results;
9. My Bookings/cancellation result;
10. owner task results;
11. responsive/mobile results;
12. integrity/protected-boundary result;
13. finding classification: none / P0 / Activation Blocker / Usability Friction / Feature Request;
14. exact blockers and Product-return items, if any;
15. intentional non-changes to protected boundaries;
16. whether any application code changed and the exact Product/P0 authorization if it did;
17. how QA should verify the Sprint result.

Do not store secrets, unnecessary customer PII, or sensitive LINE credentials in the report.

---

## 22. Product review decision

### Result

**APPROVED — READY_FOR_ENGINEERING**

Product accepts UX-002 as the smallest adequate validation handoff for SPR-002.

It preserves the North Star customer flow and owner queue outcome, the locked SPR-001 truth, PD-008 evidence discipline, PD-010 LINE truth, manual-first Pilot operation, and all protected technical boundaries.

No Product Decision inconsistency was found. `04-PRODUCT-DECISIONS.md` is unchanged.

### State transition record

- Founder + Product created SPR-002 at `READY_FOR_UX` on 2026-09-16.
- UX created UX-002 with recommendation `UX_APPROVED`.
- Product reviewed UX-002 and recorded it **Product-approved** on 2026-09-16.
- Product transitions SPR-002 from the UX gate to **READY_FOR_ENGINEERING** for validation preparation / technical validation support only.
- Engineering started validation prep on 2026-09-16 at commit `156baae`. Automated baseline + config inspection recorded in [RPT-002-ENG](../reports/RPT-002-ENG.md). Shop #1 is unnamed (`VAL-002-01` Activation Blocker). State stays **READY_FOR_ENGINEERING**.

### Cursor authorization

Cursor / Engineering may now begin the validation work defined in §§18–21.

This authorization does **not** include any non-P0 application-code fix.

---

## 23. State

**READY_FOR_ENGINEERING**

Engineering / Cursor ran validation prep (automated suites + config presence) and created `RPT-002-ENG`. Application code was not changed.

Shop #1 Activation Gate has **not** started. Founder will name the tenant and run the physical LINE in-app path before Engineering may complete this Sprint.

**No feature implementation is authorized. No non-P0 code fix is authorized without a later explicit Product classification and authorization.**

Do not mark `IMPLEMENTED`, `READY_FOR_QA`, or `PASS`. Do not create SPR-003.

STOP. Remain **READY_FOR_ENGINEERING** until Shop #1 is identified.
