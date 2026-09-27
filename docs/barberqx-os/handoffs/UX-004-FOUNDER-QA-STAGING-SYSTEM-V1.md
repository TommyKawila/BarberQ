# UX-004 — Founder QA / Staging System v1

| | |
|---|---|
| Linked Sprint | [SPR-004 — Founder QA / Staging System v1](../sprints/SPR-004-FOUNDER-QA-STAGING-SYSTEM-V1.md) |
| Product Decision | [PD-013 — Isolated Founder QA Environment](../04-PRODUCT-DECISIONS.md#pd-013) |
| UX recommendation | **UX_APPROVED** |
| Product review | **APPROVED — 2026-09-27** |
| Scope type | Minimal procedural/operator UX only |
| Engineering authorization | Controlled by SPR-004 state; this handoff does not independently authorize implementation |

> UX-004 defines only the Founder/operator interaction contract for QA commands and the manual FQA checklist. It introduces no customer-facing UX, no admin redesign, no QA dashboard, no auth shortcut, and no change to Product role behavior.

---

## 1. UX objective

Make the approved Founder QA / Staging workflow understandable and repeatable for one Founder without creating a new Product surface.

The intended operating sequence remains:

`qa:verify → qa:reset → automated checks → FQA manual checks → real Pilot validation`

For Owner-claim testing, the reset path must be explicitly separate:

`qa:verify → qa:reset:owner-claim → real Owner LINE claim → verify`

Founder QA does not replace real Pilot validation.

---

## 2. No Product UI expansion

UX-004 confirms:

- no customer-facing UX change;
- no admin redesign;
- no `/__qa` dashboard;
- no graphical reset UI;
- no role switcher;
- no login-as;
- no impersonation;
- no manual LINE ID entry;
- no auth bypass;
- no QA-only customer/admin shortcut.

Existing BarberQx customer/admin UX remains the system under test.

---

## 3. Identity model

Founder QA uses three distinct Founder-controlled real LINE identities:

### Founder Owner

Used for:

- real Owner authentication;
- Owner Manager-management;
- Owner-only authorization checks;
- FQA-00 Owner-claim scenario.

### Founder Manager

Used for:

- Manager invite claim;
- Manager operational access;
- Owner-boundary denial checks;
- revocation/reinvite scenarios.

### Founder Customer

Used for:

- customer booking;
- My Bookings;
- cancellation;
- pure customer-role validation.

All real-auth steps use the existing real LINE/LIFF authentication path.

The checklist must refer to identities by safe role label only:

- Founder Owner
- Founder Manager
- Founder Customer

Do not place raw LINE user IDs in checklist evidence.

---

## 4. Operator CLI contract

The three approved commands are:

- `npm run qa:verify`
- `npm run qa:reset`
- `npm run qa:reset:owner-claim`

They are CLI/operator tools, not Product UI.

### 4.1 qa:verify

Messages should clearly communicate:

- Founder QA environment detected or rejected;
- safe canonical tenant identity;
- fixture/readiness pass/fail;
- whether real LINE/LIFF QA configuration is present;
- whether the environment is READY or NOT READY.

Do not print secrets, LINE IDs, bearer tokens, invite tokens, or service credentials.

A failed verify must state that verification failed and no reset was attempted.

### 4.2 qa:reset

Normal daily reset messaging must make clear that it:

- targets only BarberQ Pilot Test;
- preserves the normal Founder Owner relationship;
- clears/restores the approved deterministic QA fixture;
- does not affect the isolation sentinel;
- does not affect Production.

Before mutation, the CLI must show a concise safe target summary and run all approved guards automatically.

No interactive arbitrary target selection is allowed.

### 4.3 qa:reset:owner-claim

This command must be unmistakably different from normal daily reset.

Operator-facing messaging must explicitly say that it:

- prepares the canonical QA tenant for **Owner claim testing**;
- removes/prepares the Owner relationship only inside the approved QA scenario;
- requires the Founder Owner to complete the real LINE claim afterward;
- is not the standard daily reset;
- does not manually assign a LINE identity.

Its name, intro text, and completion guidance must prevent it from being confused with `qa:reset`.

---

## 5. Fail-closed messaging

### Preflight rejection

If any pre-mutation safety guard fails, the CLI must clearly state:

- operation refused;
- the failed safe invariant in non-secret terms;
- **no data was changed**.

Examples include:

- environment is not `founder_qa`;
- Supabase project mismatch;
- Production target detected;
- QA hostname mismatch;
- canonical shop identity mismatch;
- PHINX detected.

### Mutation/post-verification failure

Do **not** claim “no data changed” unless rollback/no-mutation has been positively verified.

If a failure occurs after mutation begins and an all-or-nothing rollback cannot be confirmed, the CLI must instead state:

- reset did not complete successfully;
- environment must not be treated as READY;
- run `qa:verify` / follow the documented recovery procedure;
- do not continue manual FQA until readiness is restored.

This preserves SPR-004's requirement that partial failures never silently look ready.

---

## 6. FQA checklist structure

FQA-00 → FQA-21 remains the canonical Founder checklist.

Each row must explicitly include:

- FQA ID;
- LINE identity to use;
- starting state;
- whether `qa:verify` is required immediately before the scenario;
- action;
- expected result;
- evidence;
- automated / manual / mixed;
- reset requirement.

### Identity labels

Use only:

- Founder Owner;
- Founder Manager;
- Founder Customer;
- System/automated where no LINE identity is used.

### qa:verify column

At minimum:

- first scenario after environment setup/reset: **Required**;
- FQA-00 Owner-claim flow: **Required before owner-claim reset and after claim completion**;
- scenarios that continue from an already verified continuous run may use **Covered by current verified run**;
- any unexpected state or recovery: rerun `qa:verify` before continuing.

The checklist must not encourage repeated destructive reset between every row when a continuous scenario is intended.

---

## 7. FQA identity / verify matrix

| ID | LINE identity | qa:verify requirement | Notes |
|---|---|---|---|
| FQA-00 | Founder Owner | Required before owner-claim reset and after claim | Special Owner-claim cycle |
| FQA-01 | Founder Owner | Required at start of daily run | Owner auth |
| FQA-02 | Founder Owner | Covered by current verified run | Manager-management zero state |
| FQA-03 | Founder Owner | Covered by current verified run | Create invite |
| FQA-04 | Founder Manager | Covered by current verified run | Real LINE claim |
| FQA-05 | Founder Manager | Covered by current verified run | Correct tenant |
| FQA-06 | Founder Manager | Covered by current verified run | Owner-boundary denial |
| FQA-07 | Founder Manager | Covered by current verified run | Ordinary Barber operation |
| FQA-08 | Founder Manager | Covered by current verified run | Sentinel denial |
| FQA-09 | Founder Customer | Covered by current verified run | Manager absent from selection |
| FQA-10 | Founder Customer | Covered by current verified run | Customer booking |
| FQA-11 | Founder Owner or Founder Manager | Covered by current verified run | Today visibility |
| FQA-12 | Founder Customer | Covered by current verified run | My Bookings |
| FQA-13 | Founder Customer | Covered by current verified run | Cancellation |
| FQA-14 | System/automated | Required automated environment/test prerequisites | Double-booking protection |
| FQA-15 | Founder Owner | Covered by current verified run | Revoke Manager |
| FQA-16 | Founder Manager | Covered by current verified run | Refresh/re-login denied |
| FQA-17 | Founder Owner + Founder Manager | Covered by current verified run | Fresh re-invite |
| FQA-18 | Relevant current role(s) | Covered by current verified run | 375px |
| FQA-19 | Relevant current role(s) | Covered by current verified run | 390px |
| FQA-20 | Relevant current role(s) | Covered by current verified run | 430px |
| FQA-21 | Relevant current role(s) | Covered by current verified run | Desktop smoke |

If a scenario reveals unexpected fixture state, stop the continuous run and rerun verification rather than treating the prior READY result as permanent.

---

## 8. Evidence format

Evidence remains lightweight.

For each FQA item record only what is needed to prove the expected result, such as:

- PASS / FAIL;
- date/time;
- environment/build/commit reference;
- device/browser/viewport where relevant;
- short observation;
- screenshot where visual/manual proof matters;
- safe automated test result/reference.

Do not record:

- LINE IDs;
- access/bearer tokens;
- invite tokens;
- service-role keys;
- LINE channel secrets;
- customer Production data.

For automated-only checks, command/test result is sufficient unless failure diagnosis requires additional safe evidence.

For manual LINE/mobile checks, screenshot + concise note is preferred.

---

## 9. Responsive/manual checkpoints

The approved manual viewport checkpoints remain:

- 375px;
- 390px;
- 430px;
- desktop/reference admin viewport.

Founder should validate critical existing Product paths, not redesign them.

Check for:

- blocking horizontal overflow;
- clipped actions/content;
- inaccessible CTA/control;
- keyboard obstruction;
- broken LINE in-app return/navigation;
- unreadable role/shop context;
- destructive action confusion.

A visual issue discovered during FQA is evidence/defect input; UX-004 itself does not pre-authorize a redesign.

---

## 10. Production-safety UX rules

Operator UX must reinforce the infrastructure safety model rather than create a bypass.

Requirements:

- show safe environment label before destructive reset;
- show canonical QA tenant name/slug, never arbitrary selectable tenant;
- no Production option;
- no PHINX option;
- no free-form shop/database target;
- no UI or CLI argument that changes the reset target;
- no secrets in output;
- preflight rejection must be obvious and terminal;
- successful completion must occur only after post-reset verification passes.

Do not add “force”, “skip verification”, “unsafe”, or equivalent bypass flags in v1.

---

## 11. Owner-claim reset distinction

Normal daily reset and Owner-claim reset must differ clearly in both naming and message.

### Normal

`qa:reset`

Meaning:

- restore normal QA baseline;
- Owner remains usable;
- zero Manager;
- clean bookings;
- deterministic fixtures.

### Owner claim

`qa:reset:owner-claim`

Meaning:

- special destructive QA scenario;
- prepare existing canonical QA tenant for real Owner claim;
- Founder Owner must claim using real LINE afterward;
- environment is not considered normal daily READY until claim + verification completes.

Do not alias these commands to the same opaque operation without clear scenario behavior.

---

## 12. Relationship to Product validation

Founder QA is a pre-Pilot QA layer.

It does not:

- replace SPR-002 Shop #1 validation;
- replace real PHINX Manager validation under SPR-003;
- establish customer evidence;
- validate willingness to pay;
- prove real-shop usability by itself.

A passing FQA run means the known test environment is technically/operationally ready for the next appropriate real-Pilot validation step.

---

## 13. Protected boundaries

UX-004 must not change or authorize changes to:

- customer booking UX;
- Owner/admin UX;
- Manager permissions;
- Owner permissions;
- Barber model;
- customer identity;
- Manager identity;
- Owner claim Product semantics;
- tenant authorization Product rules;
- booking/concurrency logic;
- LINE/LIFF authentication fundamentals;
- Super Admin;
- SPR-002;
- SPR-003.

No `/__qa` surface is part of v1.

---

## 14. Product-return criteria

Return to Product before implementation if Engineering determines it needs any of the following:

- graphical reset/admin tooling;
- `/__qa`;
- login-as/impersonation;
- manual or synthetic production-equivalent LINE identities;
- Product auth bypass;
- arbitrary tenant reset;
- Production data cloning;
- PHINX-derived fixtures;
- changes to Owner/Manager/Customer authorization semantics;
- changes to Manager permissions;
- customer/admin redesign;
- cross-shop Manager Product support;
- changes to SPR-002 or SPR-003.

---

## 15. UX acceptance summary

UX-004 is sufficient for Engineering when:

- there is no Product UI scope;
- three real LINE test identities are explicit;
- `qa:verify`, `qa:reset`, and `qa:reset:owner-claim` have clear operator contracts;
- Owner-claim reset cannot be confused with daily reset;
- preflight fail-closed errors clearly state no data changed;
- mid/post-mutation failure never falsely claims no mutation;
- FQA-00 → FQA-21 has explicit identity + verification expectations;
- evidence capture is lightweight and secret-safe;
- 375 / 390 / 430 / desktop checkpoints remain;
- Production safety is visible in the operator workflow;
- existing BarberQx Product UX remains untouched.

---

## 16. Recommendation

**UX_APPROVED**

UX-004 matches PD-013 and SPR-004 and introduces no customer/admin Product capability.

It is ready for Product review and, if Product accepts it, transition of SPR-004 to `READY_FOR_ENGINEERING`.
