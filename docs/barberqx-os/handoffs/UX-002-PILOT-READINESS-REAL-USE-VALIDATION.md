# UX-002 — Pilot Readiness & Real-Use Validation

| | |
|---|---|
| Linked Sprint | [SPR-002 — Pilot Readiness & Real-Use Validation](../sprints/SPR-002-PILOT-READINESS-REAL-USE-VALIDATION.md) |
| State at handoff | `READY_FOR_UX` |
| Type | Validation handoff only |
| UX recommendation | **UX_APPROVED** |
| Date | 2026-09-16 |

> This handoff defines how to observe the existing product with Shop #1. It does not authorize design changes, Product scope, Cursor instructions, Engineering work, or any Sprint-state transition.

## 1. Purpose and UX outcome

Validate that Shop #1 can safely use the existing BarberQx flow from the shop's LINE OA entry to a real customer booking and owner queue operation.

The bounded UX outcome is evidence, not a redesign:

- a customer can complete the current sequence: **barber → date → time → confirm**;
- the correct shop remains clear and primary;
- the owner can find and operate the resulting booking with existing controls;
- LINE/LIFF and mobile behavior are usable in the real in-app context;
- observations are classified before anyone proposes a solution.

The **≤15-minute owner setup** and **≤60-second first booking** values are measurement targets only. Record actual elapsed time and cause of delay; a missed target alone is not an automatic failure.

## 2. KEEP — protected baseline

Preserve without redesign or implementation during validation:

- the current booking sequence and booking-success flow;
- tenant isolation, shop-scoped data, booking ownership, and role authorization;
- existing concurrency/double-booking behavior;
- current auth, LINE identity, LIFF entry, and return behavior;
- the current cancellation policy and availability/schedule model;
- merchant/shop identity as primary on customer-facing surfaces;
- shop LINE OA as the customer entry point;
- sender-neutral LINE/Add Friend wording while sender identity remains unverified;
- no reminder, pre-appointment, or no-show-reduction implication;
- the locked Assisted 30-Day Pilot and working post-Pilot continuation-price truth;
- existing CTA destinations and current owner task model.

Validation may inspect these behaviors. It does not authorize changing them.

## 3. Customer validation tasks

| Task | Expected existing behavior | What to observe | PASS condition | Activation-blocking failure | Non-blocking friction | Evidence to record |
|---|---|---|---|---|---|---|
| Enter from shop LINE OA | Intended shop LINE OA entry opens BarberQx in the shop’s context. | Entry/link opens; shop identity appears before a customer makes a booking. | Correct shop opens and is recognisable. | Entry is unavailable, opens the wrong shop, or cannot start booking. | Customer pauses to understand where the link leads. | Entry source, URL/path if visible, screenshot, device and LINE context. |
| Confirm correct shop context | Merchant identity is primary. | Customer can identify the shop and is not led to believe BarberQx is the merchant. | Correct merchant identity is clear. | Wrong merchant/tenant context or materially misleading identity. | Customer asks once which shop they are booking with. | Screenshot and exact question/words used. |
| LINE/LIFF login and return | Existing login/identity flow allows return to the intended shop booking flow. | Entry, login prompt, return, and retained context. | Customer reaches booking with correct identity/context. | Login/return blocks the approved flow or returns to wrong context. | Extra explanation needed for a normal LINE prompt. | Device/OS, LINE version if available, screen recording/screenshots, exact step. |
| Select barber | Customer can choose an available barber in the current UI. | Discoverability, selected state, and whether a barber choice is understood. | Customer selects the intended barber without operator intervention. | Cannot select a required barber or booking proceeds with a materially wrong barber. | Hesitation or one-off terminology question. | Selected barber, elapsed time, customer comments. |
| Select date and time | Customer can select an available date and slot. | Date/time discoverability, availability clarity, and unavailable/taken-slot behavior as implemented. | Intended available slot is selected; unavailable/taken slot does not become a conflicting booking. | No usable slot selection, wrong slot, or conflicting successful booking. | Slow scanning or uncertainty about available times. | Chosen date/time, screenshots, any error/recovery text. |
| Confirm booking | Customer can review and submit the current booking. | Summary clarity, CTA reachability, submit response. | Booking is intentionally confirmed once. | Confirm CTA is blocked, form cannot submit, or incorrect booking is created. | Customer rereads confirmation once. | Completion time, screenshots, exact actual result. |
| Booking Success | Success shows the correct booking details. | Shop, barber, date, and time match the intended booking. | Details are correct and customer understands booking succeeded. | Success is missing, false, or shows material wrong booking details. | Customer asks what happens next. | Screenshot and detail comparison. |
| Add Friend / LINE prompt | Optional Add Friend wording is sender-neutral; booking does not depend on it. | No claim that shop OA or BarberQx will send unless verified. | Optional state is truthful, non-blocking, and not required for success. | Incorrect sender claim creates material false expectation or prompt blocks booking. | Customer asks whether they must add a friend. | Exact copy, screenshot, customer interpretation. |
| My Bookings | The new booking appears for the same customer. | Access, list/detail correctness, shop/barber/date/time. | Customer finds the booking with correct details. | Booking is absent, belongs to another identity/shop, or is materially incorrect. | Customer needs one cue to find the page. | Screenshot, customer identity/context, details checked. |
| Cancellation where permitted | Current policy allows the currently permitted cancellation behavior only. | Discoverability, result, and owner/customer state consistency. | Permitted cancellation completes and resulting state is accurate. | A permitted cancellation cannot complete, affects wrong booking, or creates incorrect state. | Policy is understood only after one explanation. | Policy state, before/after screenshots, owner result. |

## 4. Owner validation tasks

| Task | Expected existing behavior | What to observe | PASS condition | Activation-blocking failure | Non-blocking friction | Evidence to record |
|---|---|---|---|---|---|---|
| Access correct shop | Owner reaches the intended tenant/shop. | Shop identity, account role, and access boundary. | Correct owner sees only the correct shop. | Wrong tenant access, inability to access intended shop, or authorization anomaly. | One-off navigation uncertainty. | Account/role used, screenshot, exact route. |
| Verify team and hours | Existing settings/setup surfaces allow Pilot-relevant team and hours to be checked or configured. | Active barber list, names, and hours/availability required for booking. | Pilot booking configuration is correct and understandable. | Required team/hours cannot be made correct for the Pilot. | Founder explanation or shop-specific preparation required. | Before/after state, assistance, elapsed setup time. |
| Find today’s queue | Existing owner UI shows today’s operational bookings. | Discoverability and whether current-day bookings are understandable. | Owner finds today’s queue without developer intervention. | Owner cannot locate/use the queue needed for operation. | Extra time or one explanation needed. | Elapsed time, screenshot, exact path. |
| Identify booking barber | Booking makes barber ownership identifiable. | Owner identifies the barber for the test booking. | Owner names the correct barber and booking. | Barber identity is absent or materially incorrect. | Owner needs one orientation cue. | Booking reference and owner response. |
| Manage existing availability | Existing controls can represent the required temporary/open-close availability behavior. | Meaning of controls and resulting customer availability. | Owner applies the existing control and sees expected availability result. | Required existing availability task is unusable or produces incorrect availability. | Label/terminology hesitation. | Before/after state, customer-side check, assistance. |
| Confirm new booking appears | Completed customer booking is visible in the correct queue/shop. | Timing, details, shop/barber/date/time accuracy. | Owner sees the correct new booking. | Booking fails to appear or appears with wrong material details. | Owner needs refresh/navigation guidance once. | Customer/owner screenshots and timestamps. |
| Operate without developer intervention | Assisted Pilot may include Founder/operator support, not developer operation. | Whether owner can complete necessary Pilot tasks; record assistance. | Tasks work with no developer intervention. | A developer must intervene for normal core operation. | Founder/operator assistance or one-off explanation. | Assistance type, task, reason, workaround. |

## 5. LINE, mobile, and responsive validation

Complete at least one end-to-end customer booking on a **real physical mobile device in the LINE in-app browser / intended LINE context** before Shop #1 goes live.

Validate:

- LINE OA entry, LIFF/login, and return behavior;
- correct shop context and merchant-first identity;
- barber, date, time, confirmation, success, My Bookings, and permitted cancellation;
- keyboard does not hide required inputs or primary CTAs;
- form controls and CTAs are usable without horizontal overflow, clipping, or accidental activation;
- optional Add Friend/LINE state remains sender-neutral and non-blocking;
- no reminder or no-show claim appears.

Check the relevant customer and owner-critical states at:

- **375px**
- **390px**
- **430px**
- **desktop/reference owner viewport**

A second physical device/OS is useful when available, but is not required for Shop #1 activation unless the first device exposes a device-specific concern.

## 6. Observation protocol

For every observed task, record:

- date/time and shop;
- participant role (customer, owner, Founder/operator);
- device, OS, viewport, and whether inside LINE;
- task and expected existing behavior;
- actual behavior and completion outcome;
- elapsed time where practical;
- assistance required: none / Founder-operator / developer;
- classification;
- screenshot or screen recording where safe;
- exact words used by participant;
- workaround used, if any.

Do not infer a feature or solution from a single observation.

## 7. Failure classification

| Classification | Meaning | Required action |
|---|---|---|
| **P0** | Security vulnerability, tenant leakage, booking outage, double-booking regression, production data-integrity issue, or LINE/auth failure that prevents the approved flow. | Stop affected validation and use the P0/emergency workflow. No unrelated work is authorized. |
| **Activation Blocker** | A non-P0 issue prevents safe Shop #1 activation or normal core operation: customer cannot complete required booking, owner cannot operate the required queue task, correct shop cannot be accessed, or critical mobile interaction is unusable. | Stop activation and return to Product as **NEEDS_PRODUCT_REVIEW**. |
| **Usability Friction / Observe** | Hesitation, one-off terminology confusion, optional-task uncertainty, or extra explanation that does not prevent safe operation. | Record evidence. Do not propose or implement a fix. |
| **Feature Request / Record Only** | Request for a new capability or configuration: reminders, variable duration, horizon/cancellation configuration, CRM, analytics, etc. | Record only. It does not create scope, a backlog item, or an Engineering task. |

## 8. Product-return criteria

Return an observation to Product without designing a solution when:

- it is an Activation Blocker;
- a response would require a new capability, new configuration, or a policy decision;
- a response would touch booking, auth/LIFF, LINE sender/tenant architecture, tenant isolation, concurrency, cancellation, or availability model;
- the same friction repeats across meaningful real-use observations and could justify a Product decision;
- truthful shop/LINE/sender expectations cannot be preserved with the current behavior;
- the proposed response would broaden SPR-002 beyond validation.

Use evidence and the classification above. Observation is not Product fact, and Product review is not Engineering authorization.

## 9. Shop #1 Activation Gate — UX verification

Shop #1 may go live only when the following are evidenced:

1. The shop meets the approved Pilot qualification criteria and acknowledges the Assisted 30-Day Pilot / working continuation-price truth.
2. A lightweight manual evidence record exists before activation.
3. The owner accesses the correct tenant and verifies shop identity, team, and hours/availability needed for Pilot booking.
4. The shop has a working LINE OA/intended booking entry.
5. At least one end-to-end real physical-device LINE in-app booking completes: correct shop → barber → date → time → confirm.
6. Booking Success shows the correct shop, barber, date, and time.
7. The customer sees the booking in My Bookings.
8. Controlled cancellation is checked where the existing policy permits it.
9. The owner sees the correct booking and barber in the correct operational queue and can use the existing availability controls required for Pilot operation.
10. Add Friend/LINE wording stays sender-neutral, optional, and non-blocking.
11. No P0 or Activation Blocker is observed.
12. Setup and first-booking times are captured as measurements, not pass/fail claims.

If any activation-blocking item fails, normal customer go-live stops and the finding returns to Product.

## 10. Lightweight manual evidence template

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

Reason / evidence reference:

## 11. Explicit out of scope

This handoff does not authorize:

- redesigning customer, owner, onboarding, sales, or mobile screens;
- speculative UX fixes, feature backlog creation, or hypothetical solutions;
- reminders, no-show automation, services, variable durations, configurable policies, CRM, analytics, Stats, navigation, payments, POS, marketplace, AI, or multi-branch scope;
- changes to booking/auth/LIFF/tenant/LINE sender/concurrency/cancellation/availability architecture;
- code changes, database changes, or Cursor implementation instructions;
- a Product Decision change, SPR-003, or moving SPR-002 to `READY_FOR_ENGINEERING`.

## 12. Recommendation

**UX_APPROVED**

UX-002 is complete as a bounded validation handoff. The next decision remains with Product under the normal workflow; no design or implementation has been authorized by this artifact.
