# SPR-004 — Founder QA / Staging System v1

| | |
|---|---|
| Date opened | 2026-09-27 |
| State | **READY_FOR_ENGINEERING** |
| Type | Normal delivery Sprint — test infrastructure / development workflow |
| Phase | Pre-Pilot / Pilot Readiness |
| Product owner | Product / R&D |
| Founder approval | **Approved — 2026-09-27** |
| Source / rationale type | Product Decision + explicit Founder-approved operational requirement |
| Source / rationale | [PD-013 — Isolated Founder QA Environment](../04-PRODUCT-DECISIONS.md#pd-013), Accepted 2026-09-27; Founder-approved BarberQx Solo-Founder Testing System v1 proposal |
| Relationship to SPR-002 | Separate infrastructure work. Do **not** modify SPR-002 scope or state. Does not replace Shop #1 real Pilot validation. |
| Relationship to SPR-003 | Separate infrastructure work. Do **not** modify SPR-003 scope or state. Does not block ongoing PHINX Manager live validation. |
| UX handoff | [UX-004 — Founder QA / Staging System v1](../handoffs/UX-004-FOUNDER-QA-STAGING-SYSTEM-V1.md) — **UX_APPROVED / Product-approved** |
| Product review | **APPROVED — 2026-09-27** |
| Next allowed transition | `IMPLEMENTED` after Engineering completes only the approved SPR-004 + UX-004 scope and creates `RPT-004-ENG` |
| Engineering authorized now? | **Yes — SPR-004 + Product-approved UX-004 only** |
| Application/code implementation authorized now? | **Yes — only infrastructure/config/QA tooling/tests/docs required by SPR-004; no unrelated Product behavior changes** |
| P0? | No |

> SPR-004 establishes isolated Founder QA / Staging infrastructure so the Founder can repeat real-auth end-to-end validation before involving real Pilot shops. Product has approved UX-004. `READY_FOR_ENGINEERING` authorizes Engineering to implement **only** SPR-004 + UX-004, preserving the required implementation order and fail-closed Production safeguards. It does not authorize unrelated Product behavior changes, `/__qa`, auth shortcuts, Production reset capability, or changes to SPR-002 / SPR-003.

---

## 1. Objective

Create the smallest safe Founder-controlled QA system that allows one Founder to repeatedly validate:

reset test environment
→ Owner flow
→ Manager flow
→ Customer flow
→ booking/admin validation
→ tenant/security validation
→ revoke/reclaim
→ responsive QA
→ reset and repeat

without relying on PHINX or another real Pilot customer as the primary QA environment.

Founder QA exists to catch basic auth, tenant, Manager, booking, My Bookings, admin, mobile, and responsive failures before those flows are exercised by a real Pilot shop.

Founder QA does **not** replace real Pilot validation, Product evidence, willingness-to-pay validation, or Shop #1 activation gates.

---

## 2. Approved environment model

### 2.1 LOCAL

Purpose:

- fast development;
- automated tests;
- local prototype behavior.

Allowed:

- current in-memory store;
- LINE mocks;
- existing automated tests.

LOCAL is not sufficient for final Founder real-auth QA.

### 2.2 FOUNDER QA / STAGING

Dedicated environment with:

- separate deployment from Production;
- separate Supabase project/database;
- dedicated QA LINE/LIFF configuration;
- real LINE authentication path;
- Founder-controlled test identities;
- deterministic synthetic fixture data;
- canonical resettable QA tenant;
- staging-only isolation sentinel tenant;
- no Production customer data;
- production-equivalent tenant/auth/security behavior.

### 2.3 PRODUCTION

Contains:

- PHINX STUDIO;
- future real Pilot shops;
- future real customers.

Production must never be used as resettable Founder QA infrastructure.

Founder QA tooling must never weaken Production auth/security rules.

---

## 3. Approved MVP scope

SPR-004 includes only:

1. separate Founder QA deployment definition;
2. separate QA Supabase project;
3. dedicated QA LINE/LIFF configuration;
4. explicit `BARBERQ_ENV=founder_qa` environment identity;
5. canonical `BarberQ Pilot Test` tenant;
6. staging-only isolation sentinel tenant;
7. synthetic Johnny / Peter / Jack fixtures;
8. Founder Owner / Manager / Customer test identity model;
9. `npm run qa:verify`;
10. fail-closed `npm run qa:reset`;
11. `npm run qa:reset:owner-claim`;
12. deterministic reset logic;
13. reset safety tests;
14. environment verification tests;
15. reusable FQA-00 → FQA-21 manual + automated runbook;
16. extension/reuse of existing automated tests;
17. staging setup and safe operating documentation.

No customer-facing Product capability is authorized.

---

## 4. Existing architecture to reuse

Engineering planning should reuse current BarberQx behavior rather than building parallel QA-only implementations.

Reuse:

- Next.js application;
- existing Supabase schema/migrations;
- current shop-scoped routes/APIs;
- existing Owner claim flow;
- current Manager invite/claim/revoke behavior;
- existing customer booking flow;
- My Bookings;
- existing admin flows;
- existing LINE verification path;
- existing booking/concurrency protections;
- existing `test:security`;
- existing `test:shop`;
- existing `test:booking`;
- existing `test:onboarding`;
- existing typecheck/lint/build checks;
- current environment hardening that disables mock/memory behavior in production runtime.

Founder QA must test the same production implementation against isolated QA infrastructure.

Do not create separate QA copies of Owner, Manager, booking, tenant, or auth logic.

---

## 5. Existing unsafe/legacy pattern not approved for Founder QA

Current `scripts/clone-shop.js` is **not** the approved Founder QA reset strategy.

SPR-004 must not rely on:

- cloning PHINX data;
- copying Production data into QA;
- whichever Supabase target happens to be configured in a generic local env file;
- Production-derived Barber/settings/customer fixtures.

Founder QA v1 uses deterministic synthetic fixtures only.

Do not modify Production/PHINX merely to make staging fixtures easier.

---

## 6. Canonical QA tenant

### Resettable tenant

Name:

**BarberQ Pilot Test**

Slug:

`barberqpilottest`

This is the only tenant that normal `qa:reset` may mutate.

After provisioning, the immutable QA shop UUID must be recorded in a checked-in **non-secret QA manifest/constants file** together with other approved safe QA identifiers.

### Required canonical fixture baseline

Normal daily reset restores:

- same canonical shop ID;
- name = BarberQ Pilot Test;
- slug = `barberqpilottest`;
- valid QA shop operational state;
- one persistent Founder QA Owner identity relationship;
- zero active Managers;
- zero pending/stale Manager invites;
- Johnny;
- Peter;
- Jack;
- known opening hours;
- known availability/schedules;
- approved synthetic shop operational settings;
- zero normal appointments by default;
- no Production-derived customer/shop data.

Scenario-specific appointments are created by tests and cleared on reset.

---

## 7. Isolation sentinel tenant

Founder QA must include a second **synthetic staging-only** tenant for real cross-tenant denial checks.

Purpose:

- verify Manager of the canonical QA tenant cannot read or mutate a second real staging tenant;
- test tenant isolation against an actual tenant rather than only nonexistent routes.

Rules:

- sentinel is synthetic only;
- sentinel is not PHINX;
- sentinel contains no Production customer data;
- sentinel is not the normal Founder operating sandbox;
- normal `qa:reset` must **not** reset the sentinel;
- sentinel does not authorize or imply cross-shop Manager Product capability.

---

## 8. Founder-controlled test identities

Approve three distinct Founder-controlled real LINE identities.

### A. Founder Owner

Used for:

- Owner authentication;
- Owner Manager-management;
- Owner-only security/authorization validation.

### B. Founder Manager

Used for:

- Manager invite/claim;
- Manager admin operation;
- Owner-action denial;
- revoke/reinvite validation.

### C. Founder Customer

Used for:

- customer booking;
- My Bookings;
- cancellation;
- pure customer-only authorization behavior.

All real-auth Founder QA must use the same verified LINE authentication path used by Production.

Explicitly prohibited:

- login-as;
- impersonation;
- auth bypass;
- fake/manual LINE IDs;
- trusted client-side roles;
- manual role assignment through QA UI.

Three identities are required for the complete security matrix so the Customer role remains independent from Owner/Manager membership.

---

## 9. Explicit environment identity

Introduce a server-side environment identity supporting, at minimum, the approved operational distinction:

- local
- founder_qa
- production

Founder QA destructive tooling requires:

`BARBERQ_ENV === "founder_qa"`

Environment identity is **not authentication or authorization**.

It exists only as one independent infrastructure safety guard.

Founder QA must still run the real built/deployed app behavior required to exercise actual Supabase and LINE/LIFF configuration.

Do not weaken existing Production config hardening.

---

## 10. Checked-in safe QA manifest

Before destructive tooling exists, Engineering must define a checked-in, non-secret QA target manifest/constants set containing safe identity information such as:

- expected Founder QA Supabase project ref;
- approved QA deployment hostname;
- canonical QA shop UUID;
- canonical QA shop slug;
- canonical QA shop name;
- isolation sentinel UUID/slug;
- fixture version;
- known Production Supabase project ref/target denylist necessary for hard-fail protection.

Do not put secrets in this manifest.

Do not make the expected QA project identity depend only on another runtime environment variable.

A single environment misconfiguration must not be able to rewrite both the target and the expected allowlist.

---

## 11. qa:verify

Required command:

`npm run qa:verify`

### Purpose

Read-only verification that the current process is connected to the intended Founder QA environment and that the environment is ready.

### Must verify

1. `BARBERQ_ENV === "founder_qa"`;
2. current Supabase project ref exactly equals the checked-in approved QA project ref;
3. current project is not a known Production target;
4. current app URL/hostname matches approved QA deployment;
5. canonical QA shop exists with exact expected UUID/name/slug;
6. isolation sentinel exists with expected identity;
7. required migrations are present/current enough for approved QA scenarios;
8. fixture version/integrity is compatible;
9. expected Owner daily-reset baseline exists;
10. Johnny / Peter / Jack fixture expectations are correct;
11. no unexpected active Manager after daily reset;
12. no stale pending Manager invite after daily reset;
13. appointment baseline is clean after daily reset;
14. expected shop settings/hours/availability are present;
15. Supabase connectivity works;
16. dedicated LINE/LIFF QA configuration is present;
17. Founder QA is not using memory-store fallback;
18. Founder QA is not using LINE mock mode.

### Output restrictions

May report:

- safe environment name;
- fixture version;
- canonical safe shop name/slug;
- pass/fail status;
- counts where non-sensitive.

Must not print:

- service-role keys;
- bearer/access tokens;
- LINE user IDs;
- Manager invite tokens;
- Owner invite tokens;
- LINE channel secrets/tokens.

`qa:verify` must never mutate data.

---

## 12. qa:reset

Required command:

`npm run qa:reset`

### Purpose

Restore only the canonical Founder QA tenant to the deterministic daily baseline.

### Allowed reset scope

Only data belonging to the canonical resettable QA tenant, including as needed:

- Manager memberships;
- Manager invites;
- synthetic appointments;
- synthetic customer booking state;
- ordinary Barber fixtures;
- recurring breaks;
- blocked slots;
- schedules/availability;
- opening hours;
- approved synthetic shop operational settings.

### Preserve

Normal daily reset preserves:

- canonical shop UUID;
- canonical slug;
- environment identity;
- verified Founder Owner relationship;
- required migrations;
- isolation sentinel.

### Reset behavior

Where feasible, reset must be transactional/all-or-nothing.

Partial failure must not silently report the environment ready.

`qa:reset` must execute verification before mutation and post-reset verification after mutation.

---

## 13. qa:reset:owner-claim

Required command:

`npm run qa:reset:owner-claim`

Purpose:

Prepare the canonical QA tenant specifically for testing the full real Owner claim lifecycle.

Allowed resulting baseline:

- canonical same shop identity;
- shop enters the approved unclaimed/pending state needed by the existing Owner claim flow;
- no active Owner relationship for that scenario;
- clean Manager state;
- deterministic ordinary Barbers/settings;
- fresh supported Owner invitation state.

Founder then completes the real Owner claim using the Founder Owner LINE identity through the existing verified LINE path.

The reset must **not manually insert a Founder LINE ID**.

Owner invite secrets/tokens must not be emitted into unsafe logs.

After the Owner-claim scenario, normal `qa:reset` may restore the normal daily Founder Owner baseline only through approved deterministic QA mechanisms.

No Owner Product-flow redesign is authorized.

---

## 14. Critical reset safety invariants

All independent guards below are required.

### Guard 1 — explicit Founder QA environment

Destructive reset requires:

`BARBERQ_ENV === "founder_qa"`

Anything else:

**HARD FAIL before mutation.**

### Guard 2 — hardcoded/checked-in QA Supabase identity

The actual Supabase project ref must exactly equal the checked-in QA project identity.

Do not take the expected value solely from runtime environment variables.

### Guard 3 — explicit Production denylist

If the resolved project/URL matches known Production:

**HARD FAIL regardless of other configuration.**

### Guard 4 — QA hostname

The current configured application URL must match the approved Founder QA hostname.

Production hostname:

**HARD FAIL.**

### Guard 5 — canonical tenant identity

Before mutation verify all of:

- fixed expected QA shop UUID;
- slug = `barberqpilottest`;
- name = `BarberQ Pilot Test`.

Any mismatch:

**HARD FAIL.**

### Guard 6 — no arbitrary targets

Reset commands must not accept arbitrary:

- shop IDs;
- slugs;
- database URLs;
- Supabase targets.

Normal reset knows exactly one allowed target.

### Guard 7 — PHINX rejection

If target resolution identifies:

- `phinxstudio`;
- PHINX STUDIO;
- known PHINX Production tenant identity;
- Production project;

**HARD FAIL.**

### Guard 8 — transaction/all-or-nothing where feasible

Do not leave a silent half-reset fixture.

### Guard 9 — post-reset verification

Reset success requires `qa:verify` equivalent invariants to pass afterward.

### Guard 10 — secret-safe logging

Never print:

- LINE user IDs;
- access tokens;
- invite tokens;
- Supabase secrets;
- service-role keys.

### Safety principle

A **single misconfigured environment variable must never be enough to point destructive QA reset at Production**.

---

## 15. Reset safety tests

Automated tests must prove at minimum:

- Production environment identity rejected;
- unknown environment rejected;
- wrong Supabase project rejected;
- known Production project rejected;
- wrong QA hostname rejected;
- Production hostname rejected;
- wrong canonical shop UUID rejected;
- wrong canonical slug rejected;
- wrong canonical name rejected;
- PHINX rejected;
- arbitrary tenant target unsupported;
- arbitrary database target unsupported;
- failed pre-verification causes zero reset mutation;
- repeated normal reset is idempotent/deterministic;
- post-reset verification catches incomplete reset;
- logs/reporting do not expose forbidden sensitive values.

---

## 16. FQA baseline states

### B0 — Daily Reset

- Founder Owner active;
- zero Manager;
- Johnny/Peter/Jack;
- zero bookings;
- deterministic settings.

### B1 — Manager Active

B0 plus Manager invitation successfully claimed by Founder Manager through real LINE.

### B2 — Customer Booking Exists

B1 plus one known booking by Founder Customer.

### B3 — Manager Revoked

B2 plus Manager revoked.

### BC — Owner Claim Baseline

Canonical tenant prepared by `qa:reset:owner-claim` for real Owner claim.

---

## 17. Founder QA matrix

| ID | Role | Starting state | Action | Expected result | Evidence | Type | Reset requirement |
|---|---|---|---|---|---|---|---|
| FQA-00 | Owner | BC | Claim canonical QA shop through real Owner invite + LINE | Correct QA tenant claimed; verified Owner; active shop | screenshot + safe verify result | Manual + automated invariant | `qa:reset:owner-claim` |
| FQA-01 | Owner | B0 | Authenticate to QA admin with real LINE | Owner reaches `barberqpilottest` only | screenshot / role+shop context | Manual | B0 |
| FQA-02 | Owner | B0 | Open Manager management | Owner sees zero state + invite control | screenshot | Manual | none |
| FQA-03 | Owner | B0 | Create Manager invite | One valid current-shop Manager invite exists | UI + state invariant | Mixed | none |
| FQA-04 | Manager | pending invite | Open invite + authenticate with Manager LINE | Manager membership created; invite consumed | screenshot + invariant | Manual + automated | none |
| FQA-05 | Manager | B1 | Enter admin | Assigned only to canonical QA tenant | screenshot + tenant check | Mixed | none |
| FQA-06 | Manager | B1 | Attempt Owner identity/security mutation | Server denies; Owner unchanged | 403/test evidence | Automated + optional manual | none |
| FQA-07 | Manager | B1 | Operate ordinary Barber state | Approved ordinary-Barber operations succeed only inside QA shop | screenshot + state check | Mixed | none |
| FQA-08 | Manager | B1 | Attempt sentinel-tenant access/mutation | Denied; sentinel data unchanged | isolation test evidence | Automated | none |
| FQA-09 | Customer | B1 | Open booking Barber selection | Manager absent; expected Barbers only | screenshot + automated query check | Mixed | none |
| FQA-10 | Customer | B1 | Book available slot through real LINE | Correct booking created | success screenshot/state | Manual + automated regression | none |
| FQA-11 | Owner/Manager | B2 | Open Today | Booking visible under correct Barber/time | screenshot | Manual | none |
| FQA-12 | Customer | B2 | Open My Bookings | Correct customer's booking visible | screenshot | Manual + automated | none |
| FQA-13 | Customer | B2 | Cancel permitted booking | Correct cancellation state everywhere | screenshot + state check | Mixed | none |
| FQA-14 | Customer/system | known slot | Attempt conflicting booking | Duplicate/conflict prevented | automated result | Automated | scenario cleanup |
| FQA-15 | Owner | B1/B2 | Revoke Manager | Manager membership revoked; shop/booking data preserved | screenshot + invariant | Mixed | none |
| FQA-16 | Manager | B3 | Refresh / real LINE re-login | Protected Manager admin denied | screenshot + auth check | Manual + automated | none |
| FQA-17 | Owner + Manager | B3 | Fresh invite + claim | New valid Manager access created; old state not reactivated | screenshot + invariant | Mixed | none |
| FQA-18 | Founder | operational state | Critical customer/admin paths at 375px | No blocking clipping/overflow/CTA issue | screenshots/checklist | Manual | none |
| FQA-19 | Founder | operational state | Critical paths at 390px | Same | screenshots/checklist | Manual | none |
| FQA-20 | Founder | operational state | Critical paths at 430px | Same | screenshots/checklist | Manual | none |
| FQA-21 | Founder | operational state | Desktop critical-flow smoke | Critical flows usable at reference desktop viewport | screenshots/checklist | Manual | none |

One daily reset should support the bulk of FQA-01 → FQA-21 as a continuous scenario.

FQA-00 is a special Owner-claim cycle run when Owner/auth/LINE behavior requires validation.

---

## 18. Automation boundary

### Keep automated

Automation owns deterministic correctness for:

- environment guards;
- reset targeting;
- reset fixture integrity;
- reset idempotency;
- invite lifecycle;
- Manager authorization;
- role boundaries;
- tenant isolation;
- Manager absence from Barber selection;
- revocation;
- booking concurrency;
- booking/data integrity;
- migration readiness;
- reset verification;
- Production-target rejection.

Extend/reuse existing test suites where appropriate.

Do not build a separate duplicate test platform.

### Keep manual Founder QA

Founder manually validates:

- real LINE/LIFF interaction;
- real Owner authentication;
- real Manager LINE claim;
- real Customer LINE booking;
- mobile tap flow;
- physical-device behavior;
- LINE in-app browser;
- browser redirect/return;
- visual/responsive UX;
- wording/comprehension;
- real role indication;
- invite sharing/opening;
- revoke → refresh → re-login experience.

Mocks must never be represented as proof for these behaviors.

---

## 19. UX-004 scope

UX involvement is **minimal/procedural only**.

UX-004 must confirm:

- no customer-facing UX change;
- no admin redesign;
- no `/__qa` dashboard;
- Founder checklist/evidence format is understandable and executable;
- mobile checkpoints remain 375 / 390 / 430 / desktop;
- existing BarberQx Product UX remains untouched;
- no new auth shortcut, role selector, impersonation, or QA-only customer/admin UI is introduced.

UX-004 should not design new Product screens.

After UX-004 recommendation `UX_APPROVED`, Product must review before SPR-004 can move to `READY_FOR_ENGINEERING`.

---

## 20. Optional internal QA dashboard

`/__qa` is **OUT OF SCOPE for v1**.

Do not build it in SPR-004.

A future internal-only dashboard may be reconsidered only if CLI/checklist friction produces enough evidence.

Any future dashboard must not:

- bypass auth;
- impersonate users;
- expose LINE IDs;
- expose tokens/secrets;
- reset arbitrary tenants;
- provide Production admin shortcuts.

---

## 21. Explicit out of scope

SPR-004 does **not** authorize:

- Production DB cloning;
- PHINX copying;
- real customer data in QA fixtures;
- login-as-user;
- user impersonation;
- auth bypass;
- manual LINE-ID entry;
- fake production-equivalent LINE identity;
- trusted client-side role flags;
- custom RBAC;
- Manager permission changes;
- cross-shop Manager Product support;
- Production reset;
- arbitrary tenant reset;
- generic seed framework;
- broad fixture platform;
- full browser automation platform;
- device farm;
- screenshot-diff system;
- `/__qa` dashboard;
- customer UX redesign;
- admin UX redesign;
- analytics feature work;
- changes to SPR-002;
- changes to SPR-003.

---

## 22. Protected Production boundaries

Must remain intact:

- Production deployment is separate from Founder QA;
- Production Supabase project/data is separate;
- Production service-role credentials are never reused as QA fixture credentials;
- Production LINE/LIFF configuration is not the reset target;
- PHINX is never a resettable QA tenant;
- no Production customer data is copied to staging;
- existing Production memory/mock hardening remains;
- real Production LINE authentication rules remain;
- Owner claim semantics remain unchanged;
- Manager Product permissions remain unchanged;
- customer booking/concurrency behavior remains unchanged;
- tenant isolation remains unchanged;
- Super Admin remains separate;
- no QA route/control may become a Production auth shortcut.

Any reset tooling capable of mutating Production is a blocker/P0-level safety defect.

---

## 23. Required implementation order

If Product later moves SPR-004 to `READY_FOR_ENGINEERING`, Engineering must preserve this order:

### Step 1 — provision isolated infrastructure

- separate QA deployment;
- separate QA Supabase;
- dedicated QA LINE/LIFF config.

### Step 2 — define checked-in safe QA manifest/constants

Before destructive tooling.

### Step 3 — build `qa:verify`

Read-only verification must exist **before** reset tooling.

### Step 4 — provision deterministic synthetic fixtures

- canonical QA tenant;
- isolation sentinel;
- Johnny / Peter / Jack;
- known settings/hours.

### Step 5 — build `qa:reset`

Only after `qa:verify`.

### Step 6 — add reset safety tests

Production/PHINX/wrong-target/idempotency/log-safety checks.

### Step 7 — configure real Founder LINE QA identities

Owner / Manager / Customer.

### Step 8 — execute FQA matrix

FQA-00 → FQA-21 as applicable.

### Step 9 — document operating workflow

Target workflow:

`qa:verify → qa:reset → automated tests → Founder real-device QA → real Pilot validation`

Do not implement destructive reset tooling before `qa:verify` exists.

---

## 24. Acceptance criteria

SPR-004 can pass only when all are true:

1. Founder QA uses a separate deployment from Production.
2. Founder QA uses a separate Supabase project.
3. QA contains no PHINX/customer Production data.
4. QA uses dedicated real LINE/LIFF authentication.
5. existing Production mock/memory hardening remains intact.
6. three distinct Founder-controlled LINE identities can exercise Owner/Manager/Customer roles.
7. canonical QA tenant exists with fixed expected ID/name/slug.
8. isolation sentinel exists.
9. `qa:verify` is read-only.
10. `qa:verify` correctly identifies QA readiness.
11. `qa:verify` rejects unknown/wrong environment.
12. `qa:verify` rejects wrong Supabase project.
13. `qa:verify` rejects Production target.
14. `qa:verify` validates canonical tenant identity.
15. `qa:reset` accepts no arbitrary target.
16. `qa:reset` rejects Production.
17. `qa:reset` rejects PHINX.
18. one environment-variable misconfiguration cannot make reset target Production.
19. reset is deterministic/idempotent.
20. reset clears Manager memberships/invites as specified.
21. reset clears QA appointment state.
22. Johnny/Peter/Jack fixtures restore deterministically.
23. hours/availability/settings restore deterministically.
24. normal reset preserves usable verified Founder Owner relationship.
25. Owner-claim reset profile can exercise real supported Owner claim without manual LINE-ID assignment.
26. Manager invite/claim/revoke/reinvite works through real LINE.
27. pure Customer booking/My Bookings/cancel works through real LINE.
28. Manager denied isolation-sentinel access.
29. Manager absent from customer Barber selection.
30. booking concurrency protections remain passing.
31. responsive 375/390/430/desktop checklist is executable.
32. QA tooling/logs expose no forbidden secrets, LINE IDs, or invite tokens.
33. FQA matrix can be executed without PHINX or another Pilot participant.
34. current automated security/shop/booking/onboarding suites continue to pass.
35. staging setup and operating documentation is complete.

---

## 25. Engineering risk

**Risk level: HIGH for destructive infrastructure targeting; LOW/MEDIUM for Product UI behavior.**

Primary risks:

1. Production service-role credentials accidentally used;
2. Production project accidentally targeted;
3. arbitrary tenant reset capability;
4. PHINX mistaken for QA tenant;
5. reset introduced before verification;
6. Production data copied into staging;
7. mock LINE auth treated as real-auth evidence;
8. secrets/LINE IDs/invite tokens exposed in logs;
9. staging migrations drifting from current app;
10. destructive partial reset leaving false-ready state.

The implementation must favor fail-closed safety over convenience.

---

## 26. Required UX gate

SPR-004 remains `READY_FOR_UX` until linked UX-004 exists and confirms:

1. no customer-facing UX change;
2. no admin redesign;
3. no `/__qa` dashboard;
4. no new auth bypass/impersonation/login-as surface;
5. Founder FQA checklist/evidence format is understandable;
6. physical/mobile checkpoints are 375 / 390 / 430 / desktop;
7. current BarberQx Product UX remains unchanged;
8. no SPR-002/SPR-003 scope is absorbed.

UX-004 is procedural/supporting only.

Only Product may move the Sprint from UX approval to `READY_FOR_ENGINEERING`.

---

## 27. Product review — UX-004

### Result

**APPROVED**

Product verified that UX-004:

1. matches PD-013;
2. stays within SPR-004 infrastructure/procedural scope;
3. introduces no customer-facing or admin Product capability;
4. introduces no auth shortcut, impersonation, login-as, manual LINE-ID entry, or client-side role switcher;
5. defines appropriate operator-facing CLI behavior for `qa:verify`, `qa:reset`, and `qa:reset:owner-claim`;
6. keeps Owner-claim reset unmistakably distinct from normal daily reset;
7. keeps FQA-00 → FQA-21 as the canonical checklist and adds explicit LINE-identity / verification expectations;
8. keeps evidence lightweight and secret-safe;
9. preserves 375 / 390 / 430 / desktop manual checkpoints;
10. preserves the three-identity Founder Owner / Manager / Customer model;
11. preserves all independent Production safety guards;
12. preserves SPR-002 and SPR-003 as separate delivery items.

### Fail-closed messaging clarification

For a preflight safety rejection before mutation, operator output must explicitly state that the operation was refused and **no data was changed**.

If a failure occurs after mutation begins, Engineering must not claim that no data changed unless rollback/no-mutation is positively verified. Instead, the environment must be treated as **NOT READY** until verification/recovery succeeds.

This is required to remain consistent with SPR-004's partial-reset safety rules.

### Engineering scope now authorized

Engineering may implement only the approved Founder QA / Staging v1 infrastructure and tooling:

- isolated Founder QA deployment configuration;
- separate QA Supabase setup/integration required by this Sprint;
- dedicated QA LINE/LIFF configuration;
- `BARBERQ_ENV=founder_qa` support required for QA safety;
- checked-in non-secret QA manifest/constants;
- read-only `qa:verify`;
- canonical synthetic QA tenant and isolation-sentinel fixture support;
- deterministic Johnny / Peter / Jack fixtures;
- fail-closed `qa:reset`;
- special `qa:reset:owner-claim`;
- reset/environment safety tests;
- reuse/extension of existing automated test coverage;
- FQA-00 → FQA-21 runbook/evidence format;
- staging setup and operating documentation.

Engineering must preserve the implementation order in §23. **Destructive reset tooling must not be implemented before `qa:verify` exists.**

### Explicit non-authorization

Engineering is not authorized to add:

- `/__qa`;
- graphical reset tooling;
- login-as;
- impersonation;
- auth bypass;
- manual LINE IDs;
- arbitrary tenant/database reset targets;
- Production reset capability;
- Production/PHINX data copying;
- custom RBAC;
- Manager permission changes;
- cross-shop Manager Product support;
- customer/admin redesign;
- unrelated application behavior changes;
- SPR-002 changes;
- SPR-003 changes;
- SPR-005.

### Required Engineering report

Engineering must create:

`docs/barberqx-os/reports/RPT-004-ENG.md`

The report must document at minimum:

- QA deployment/environment architecture actually provisioned;
- QA Supabase/project identity approach without secrets;
- QA LINE/LIFF configuration readiness without secrets;
- safe QA manifest/constants;
- `qa:verify` behavior/results;
- canonical tenant + sentinel fixture behavior;
- `qa:reset` behavior and fail-closed guards;
- `qa:reset:owner-claim` behavior;
- exact reset/environment safety tests/results;
- existing regression suites/results;
- evidence that Production/PHINX are rejected;
- evidence that secrets/LINE IDs/tokens are not logged;
- FQA runbook readiness;
- manual real-LINE steps that still require Founder execution;
- files/config/migrations/scripts changed;
- protected non-changes;
- exact QA verification instructions.

---

## 28. State

**READY_FOR_ENGINEERING**

Engineering is authorized to implement only the Product-approved SPR-004 + UX-004 Founder QA / Staging System v1 scope.

**Production safety is a release blocker:** any reset path capable of targeting Production, PHINX, an arbitrary tenant, or an unknown environment is unacceptable.

No `/__qa`, auth bypass, impersonation, login-as, manual LINE IDs, Product UI redesign, SPR-002 change, or SPR-003 change is authorized.

Required next artifact:

`docs/barberqx-os/reports/RPT-004-ENG.md`

STOP before Engineering implementation.
