# SPR-003 — Tenant-Scoped Manager Role

| | |
|---|---|
| Date opened | 2026-09-25 |
| State | **READY_FOR_QA** |
| Type | Normal delivery Sprint |
| Phase | Pre-Pilot / Pilot Readiness |
| Product owner | Product / R&D |
| Founder approval | **Approved — 2026-09-25** |
| Source / rationale type | Product Decision + real Shop #1 operational requirement |
| Source / rationale | [PD-012 — Tenant-scoped Manager Role](../04-PRODUCT-DECISIONS.md#pd-012), Accepted 2026-09-25; PHINX STUDIO Shop #1 operational requirement |
| Relationship to SPR-002 | Separate delivery dependency. Do **not** add Manager scope to SPR-002. SPR-002 remains `READY_FOR_ENGINEERING` until this capability is delivered and LOCKED. |
| UX handoff | [UX-003 — Tenant-Scoped Manager Role](../handoffs/UX-003-TENANT-SCOPED-MANAGER-ROLE.md) — **UX_APPROVED / Product-approved** |
| Product review | **APPROVED — 2026-09-25** |
| Next allowed transition | `PASS` after QA vs SPR-003 + UX-003 (or back to `IMPLEMENTED` on reject) |
| Engineering authorized now? | Implementation complete for approved SPR-003 + UX-003 only |
| Engineering report | [RPT-003-ENG](../reports/RPT-003-ENG.md) |
| Feature/code implementation authorized now? | Complete for this Sprint — QA owns verification |
| P0? | No |

> This Sprint creates the first-class tenant-scoped Manager capability approved in PD-012. Product has approved UX-003. Engineering implemented only SPR-003 + UX-003 and moved the Sprint to `READY_FOR_QA`. It does not authorize broad RBAC, multi-shop Manager access, generalized identity rewrites, unrelated admin redesign, or changes to SPR-002.

---

## 1. Sprint objective

Deliver the smallest secure Manager capability necessary for a real barber shop Owner to delegate normal BarberQx administration to one or more trusted employees without:

- sharing Owner credentials;
- turning Managers into fake/non-bookable Barbers;
- manually entering LINE user IDs;
- weakening tenant isolation;
- changing the existing Owner claim flow;
- introducing broad RBAC or multi-shop administration.

The Sprint must establish:

> **Owner remains the tenant's highest authority while a verified, tenant-scoped Manager can safely operate the existing day-to-day BarberQx admin experience for that shop.**

This Sprint is specifically intended to unblock PHINX STUDIO's real Pilot operation while establishing a reusable minimum Manager model for subsequent Pilot shops.

---

## 2. Core Product Truth

The following is approved and must be preserved:

- Manager is a first-class tenant-scoped role.
- Manager is distinct from Owner and Barber.
- Manager authenticates with their own verified LINE identity.
- Manager does not live in `barbers`.
- Manager never appears in customer barber selection.
- Owner remains the highest shop authority.
- Owner alone can invite/revoke Managers.
- Multiple Managers per shop are allowed.
- Initial delivery does not support one Manager identity across multiple shops.
- Manager invite is shop-bound, role-bound, expiring, single-use, and claimed through verified LINE authentication.
- No manual LINE-ID entry.
- Existing Owner claim flow remains unchanged.
- Existing Barber/customer/booking behavior remains unchanged.
- No broad RBAC or generalized identity rewrite.

---

## 3. Exact Manager MVP scope

Manager MVP includes only:

1. a first-class tenant-scoped Manager membership;
2. Owner-created Manager invitations;
3. expiring, single-use, shop-bound Manager invite tokens;
4. Manager claim using the invitee's own verified LINE identity;
5. Manager authorization to approved existing shop-admin operations;
6. Owner ability to view active Managers;
7. Owner ability to revoke a Manager;
8. Manager inability to access Owner-only security/membership controls;
9. strict shop isolation;
10. support for multiple Managers in one shop;
11. one Manager LINE identity assigned to only one shop in initial delivery;
12. Manager does not exist in `barbers`, has no schedule/slots, and never appears to customers as a barber.

The MVP does **not** introduce arbitrary permission configuration. Manager permissions are one fixed Product-defined role.

---

## 4. Owner permissions

Owner remains the highest shop authority.

### 4.1 Existing Owner behavior

Existing Owner behavior must continue unchanged unless a narrow UI adjustment is required to expose Manager management.

### 4.2 Owner-only Manager controls

Only Owner may:

- invite a Manager;
- view Manager access/membership state;
- revoke/remove a Manager;
- regenerate/reissue a Manager invite where approved UX requires it;
- see whether a Manager invitation is pending, expired, consumed, or revoked;
- control future ownership/security-sensitive membership actions.

Manager must not have access to these controls.

### 4.3 Explicitly Owner-only

Manager must **not** be able to:

- invite another Manager;
- revoke another Manager;
- alter Owner identity;
- unlink Owner's LINE identity;
- replace Owner;
- promote themselves to Owner;
- promote another user to Owner;
- transfer tenant ownership;
- delete/cancel the shop tenant;
- control billing/subscription ownership when those capabilities exist;
- access Super Admin behavior.

No new ownership-transfer capability is authorized by this Sprint.

---

## 5. Manager permissions

Manager may perform approved **day-to-day operational administration for the assigned shop only**.

MVP Manager access includes the existing operational admin capabilities required for Pilot operation:

- access `/{shopSlug}/admin`;
- view Today's queue;
- view booking details;
- operate existing queue actions available to shop administration;
- create staff-assisted customer bookings where already supported;
- perform existing authorized staff-side cancellation/outcome operations where currently supported;
- view Team;
- create ordinary Barber records where current Owner admin can do so;
- edit ordinary Barber operational settings;
- deactivate/reactivate ordinary Barbers subject to existing safeguards;
- manage existing barber availability;
- manage current schedule/hours/recurring-break behavior used by the shop;
- update operational shop settings such as shop profile information, phone, imagery and opening hours where currently supported;
- view existing Stats;
- access Setup/help;
- use existing LINE OA setup/support surfaces;
- configure the existing shop LINE OA booking-entry information supported by current Product behavior.

Manager does **not** receive new booking/product powers beyond what already exists.

Manager does not gain access to BarberQx platform secrets, LINE channel secrets, LIFF credentials, sender architecture, tenant architecture or Super Admin operations.

---

## 6. Manager invite / claim flow

The Manager flow must remain separate from the existing Owner claim lifecycle.

### 6.1 Invite creation

1. Verified authenticated Owner accesses Manager management for their own shop.
2. Owner chooses **Invite Manager**.
3. Server creates an invitation bound to:
   - exactly one `shop_id`;
   - role = `manager`;
   - random secure invite token;
   - expiry;
   - unconsumed state.
4. Invite contains no manually assigned LINE user ID.
5. Owner shares the invite with the intended Manager.

### 6.2 Invite claim

1. Invitee opens the Manager invite.
2. System resolves the intended shop and invite validity.
3. Invitee authenticates through LINE.
4. Server obtains identity from verified LINE authentication.
5. Server re-checks:
   - invite exists;
   - invite belongs to the expected shop;
   - role is Manager;
   - invite is not expired;
   - invite is not consumed;
   - invite is not revoked;
   - verified LINE identity is not already attached to an incompatible Manager membership;
   - claiming does not create cross-shop access.
6. Manager membership is created.
7. Invite is atomically consumed.
8. Manager may then access only that shop's authorized admin surfaces.

The browser/client must never decide or submit an authoritative `line_id`, role, or shop membership.

### 6.3 Protected Owner flow

Existing `/owner/join` and Owner claim semantics remain unchanged.

Do not turn Owner claim into a generic role-claim endpoint merely for code reuse.

---

## 7. Manager revoke flow

Only the tenant Owner may revoke Manager access in this MVP.

Required flow:

1. Owner opens Manager management.
2. Owner selects an active Manager.
3. UI makes clear that revocation removes BarberQx shop-admin access but does not alter the person's LINE account.
4. Owner confirms.
5. Server verifies requesting identity is the Owner of that same shop.
6. Membership becomes inactive/revoked.
7. Future Manager authorization fails immediately according to the existing session/auth architecture.
8. Existing shop operational data remains unchanged.

Revocation must not:

- delete appointments;
- delete shop data;
- alter Barbers;
- alter Owner identity;
- alter LINE identity globally;
- affect memberships belonging to another tenant.

A revoked Manager cannot reactivate themselves.

Manager cannot revoke Owner.

Manager cannot revoke or invite other Managers in the initial version.

---

## 8. Data-model direction

### 8.1 Required new concept

Create a tenant-scoped Manager membership model distinct from `barbers`.

Minimum fields/concepts:

- membership ID;
- `shop_id`;
- verified LINE user identifier;
- role = `manager`;
- display name where obtained/appropriate;
- active/revoked state;
- created/claimed timestamp;
- revoked timestamp where appropriate.

### 8.2 Manager invitation model

Minimum invitation state:

- invitation ID or secure token identity;
- `shop_id`;
- role = `manager`;
- secure invite token;
- expiry;
- consumed state/time;
- revoked/invalid state where needed;
- created timestamp;
- identity of inviting Owner if useful for authorization/audit integrity.

### 8.3 Constraints

Initial Product behavior must prevent one Manager LINE identity from holding active Manager membership across multiple shops.

Multiple Managers may belong to the same shop.

A Manager record must not contain:

- barber slot duration;
- off days;
- barber bookability;
- barber customer profile;
- booking schedule.

### 8.4 Architecture guard

Do **not** migrate Owner into a new generalized membership subsystem solely for this Sprint.

Do not rewrite the existing Barber model.

A future unified shop-membership architecture may be considered later, but it is explicitly outside this MVP.

---

## 9. Authorization / security model

Every Manager request must establish all three:

> **verified LINE identity → active Manager membership → requested shop**

The route slug or client request alone never grants authority.

### 9.1 Server-side authorization requirements

For Manager-accessible protected actions:

1. verify LINE identity;
2. resolve an active Manager membership;
3. verify membership `shop_id` equals the requested tenant;
4. verify the operation is Manager-permitted;
5. reject any cross-shop mismatch.

Owner authorization remains distinct and higher privilege.

### 9.2 Never trust

Do not trust client-provided:

- Manager role;
- `shop_id`;
- `line_id`;
- Owner status;
- invitation consumed status.

All must be resolved/validated server-side.

### 9.3 Revocation

Authorization must check active membership rather than assuming that a previously authenticated LINE identity remains authorized forever.

A revoked Manager must lose Manager access.

### 9.4 Existing security

Do not weaken:

- Owner verification;
- Barber authorization;
- customer LINE identity;
- Super Admin separation;
- tenant scoping;
- booking transaction/concurrency protection.

---

## 10. Tenant isolation requirements

Required invariants:

- Manager A for Shop A cannot read Shop B admin data.
- Manager A cannot mutate Shop B data.
- An invite for Shop A cannot be used to claim Manager access to Shop B.
- A manipulated route slug does not change authorization scope.
- Owner of Shop A cannot invite a Manager into Shop B.
- Manager revocation in Shop A cannot affect Shop B.
- Manager cannot use customer-facing identity or Barber identity as an authorization shortcut.
- Manager cannot call Owner-only Manager-management endpoints successfully.
- Super Admin authorization remains separate.

Any cross-shop data-access defect is P0.

---

## 11. Affected admin UI surfaces

### 11.1 New/changed surfaces

Minimum UI work:

- Owner-facing Manager/access-management surface;
- Manager list;
- Manager status;
- Invite Manager action;
- invite sharing/result state;
- revoke Manager action;
- Manager invite/claim experience;
- invalid invite state;
- expired invite state;
- consumed invite state;
- revoked invite state;
- successful Manager claim state;
- Manager admin login/authorization handling;
- role indication inside admin where needed.

### 11.2 Existing admin surfaces requiring permission review

Manager access must be deliberately reviewed on:

- Today / queue;
- Team;
- Barber management;
- Schedule / availability;
- Settings;
- Stats;
- Setup;
- LINE OA setup/support;
- customer/staff-assisted booking surfaces.

The Sprint does **not** authorize redesigning those existing surfaces beyond the minimum required for Manager access and Owner-only protection.

---

## 12. Manager vs Owner UI indication

The admin experience should make role context understandable without turning the UI into an RBAC console.

Minimum requirement:

- logged-in Manager can see they are operating as **Manager** for the current shop;
- logged-in Owner can see Owner-only Manager management;
- Manager must not see actionable Owner-only membership/security controls;
- if a Manager directly navigates to an Owner-only route/action, server denies access even if the UI accidentally exposes a link.

Product hierarchy:

- shop identity remains primary;
- role label is secondary operational context;
- avoid displaying platform-internal permission terminology to customers.

No separate Manager-themed application or alternate admin dashboard is required.

---

## 13. Invalid / expired / consumed / revoked invite states

All states must fail securely and explain the next valid action without exposing tenant/security data unnecessarily.

### 13.1 Invalid

Invite token does not resolve.

Expected result:

- no claim;
- no LINE membership creation;
- clear invalid-link state;
- no disclosure of unrelated shop/member information.

### 13.2 Expired

Invite existed but expiry has passed.

Expected result:

- no claim;
- tell invitee the invitation has expired;
- direct them to request a new invitation from the shop Owner;
- only Owner may issue/reissue access.

### 13.3 Consumed

Invite has already been successfully claimed.

Expected result:

- cannot create another Manager membership;
- cannot bind a second LINE identity;
- show already-used/invalid-for-claim state.

### 13.4 Revoked / cancelled pending invite

If Owner revokes an invitation before claim:

- invite becomes unusable;
- no Manager membership is created;
- invite cannot later be resurrected by the invitee.

Invite checking and claim must be resistant to double-submit/race conditions so a one-time invite cannot create duplicate memberships.

---

## 14. Acceptance criteria

Sprint passes only if all are true:

1. Owner remains the existing legitimate highest authority.
2. Owner's current claim flow still works unchanged.
3. Owner can create a Manager invitation for their own tenant.
4. Manager invite is shop-bound, Manager-role-bound, expiring and single-use.
5. Manager LINE identity comes from verified LINE authentication.
6. No manual LINE-ID entry exists.
7. Successful claim creates a Manager membership without creating a Barber.
8. Manager never appears in customer barber selection.
9. Manager has no booking slots or personal Barber schedule.
10. Manager can access the correct shop admin.
11. Manager can complete the approved daily operational tasks.
12. Manager cannot perform Owner-only membership/security operations.
13. Owner can revoke Manager.
14. Revoked Manager can no longer access protected Manager admin behavior.
15. Multiple Managers can coexist for one shop.
16. Initial implementation rejects an active Manager membership for the same identity in another shop.
17. Manipulating the shop slug does not produce cross-shop access.
18. Existing Owner, Barber and customer authorization tests remain passing.
19. Existing booking/concurrency behavior remains unchanged.
20. Existing customer booking flow remains unchanged.
21. Existing shop data is unaffected by Manager revocation.
22. Invite double-use does not create duplicate memberships.
23. Manager functionality works in the intended mobile/LINE authentication environment.
24. No Super Admin privilege can be acquired through Manager flow.

---

## 15. Required security tests

At minimum Engineering/QA must cover:

### 15.1 Invite security

- valid Manager invite succeeds once;
- expired invite rejected;
- invalid invite rejected;
- consumed invite rejected;
- revoked invite rejected;
- second simultaneous/double claim does not create a duplicate membership;
- invite for Shop A cannot create Shop B access.

### 15.2 LINE identity

- Manager claim requires verified LINE identity;
- missing/invalid LINE authentication rejected;
- client-supplied fake LINE ID ignored/rejected;
- existing Owner authentication behavior unaffected.

### 15.3 Tenant isolation

- Manager Shop A denied Shop B admin routes/APIs;
- Manager cannot alter another shop's Team/settings/schedule/queue;
- Manager membership lookup is tenant-safe;
- route-slug manipulation does not bypass membership.

### 15.4 Role boundaries

- Manager cannot invite Manager;
- Manager cannot revoke Manager;
- Manager cannot modify Owner identity;
- Manager cannot promote to Owner;
- Manager cannot access Super Admin;
- Owner retains Manager-management authority.

### 15.5 Revocation

- active Manager succeeds before revocation;
- same identity denied after revocation;
- reauthentication does not restore revoked membership;
- revocation does not modify Owner, Barber or booking data.

### 15.6 Barber separation

- creating Manager creates no Barber record;
- Manager absent from bookable-barber query/list;
- Manager cannot receive booking slots as a side effect.

### 15.7 Regression

Existing security, shop, booking and onboarding suites must remain passing.

---

## 16. Explicit out-of-scope

Do not include:

- custom permission builder;
- per-Manager granular permission toggles;
- Assistant Manager role;
- Receptionist role;
- generic Employee role;
- cross-shop Manager access;
- multi-branch administration;
- Manager shop-switcher;
- Owner transfer;
- additional Owners/co-owners;
- ownership recovery redesign;
- unified Owner/Manager/Barber identity migration;
- broad staff-model rewrite;
- SSO;
- email/password auth;
- phone-number auth;
- manual LINE-ID administration;
- audit-log platform;
- approval workflows;
- billing/subscription redesign;
- Super Admin redesign;
- LINE sender/channel architecture changes;
- reminder features;
- analytics expansion;
- booking-flow redesign;
- customer-facing feature changes;
- general admin-experience redesign.

---

## 17. Protected existing behavior

Must remain unchanged unless separately returned to Product:

- existing Owner claim through verified LINE;
- Owner's current legitimate PHINX relationship;
- Owner remains highest authority;
- Barber model and Barber role;
- Barber bookability and customer selection;
- customer booking sequence;
- My Bookings;
- cancellation semantics;
- booking transaction logic;
- concurrency/double-booking safeguards;
- shop tenant IDs/slugs;
- customer LINE identity;
- LINE/LIFF verification fundamentals;
- sender-neutral messaging truth;
- Super Admin separation;
- current Pilot acquisition truth;
- SPR-001 locked behavior;
- SPR-002 scope and delivery state.

---

## 18. UX involvement required

**YES — REQUIRED.**

This Sprint introduces a new role and security-sensitive invite/access lifecycle, so the normal workflow begins at `READY_FOR_UX`.

UX handoff must define the minimum necessary states and hierarchy for:

- Owner Manager-management surface;
- Manager list/status;
- Manager invitation;
- invite sharing;
- invite claim;
- LINE login/return;
- successful claim;
- invalid/expired/consumed/revoked invite;
- Manager role indication;
- Owner-only controls;
- permission-denied states;
- revoke confirmation/result.

UX must explicitly map:

> **Owner sees / Manager sees / Manager cannot access**

for each affected admin surface.

UX must not expand this into configurable RBAC or redesign the general admin experience.

---

## 19. Engineering risk constraints

**Risk level: HIGHER THAN NORMAL FEATURE WORK due to authorization scope.**

The implementation is conceptually narrow but touches sensitive areas:

- verified LINE identity;
- tenant membership;
- authorization helpers;
- server API permission checks;
- database constraints;
- invite token lifecycle;
- revocation;
- admin route protection.

Primary risks:

1. cross-tenant privilege leakage;
2. Manager receiving Owner privileges accidentally;
3. trusting role/shop information from client;
4. stale access after revocation;
5. duplicate memberships from invite races;
6. breaking existing Owner authentication;
7. accidentally making Manager a Barber;
8. allowing one LINE identity to cross shops despite MVP restriction;
9. protecting UI while leaving API unprotected;
10. overly broad refactor of existing auth architecture.

Engineering should prefer the smallest additive design possible.

Do not unify all roles merely because Manager exposes architectural duplication.

Any architecture expansion beyond the approved Manager MVP must return to Product.

---

## 20. Dependencies and delivery relationship

### Approved source

- [PD-012 — Tenant-scoped Manager Role](../04-PRODUCT-DECISIONS.md#pd-012) — **Accepted**
- Real PHINX STUDIO Shop #1 operational requirement
- Explicit Founder approval for SPR-003 creation on 2026-09-25

### SPR-002 relationship

SPR-003 is a separate delivery dependency.

Do **not**:

- add Manager scope to SPR-002;
- change SPR-002 state because SPR-003 was opened;
- treat SPR-002 validation authorization as permission to implement Manager.

PHINX resumes the Manager-dependent portion of SPR-002 operational validation only after SPR-003 is delivered, QA-passed, and **LOCKED**.

---

## 21. READY_FOR_UX acceptance for handoff

SPR-003 remains `READY_FOR_UX` until a linked UX handoff exists that:

1. preserves PD-012 exactly;
2. defines Owner-only Manager management;
3. defines fixed Manager operational access without custom RBAC;
4. defines invitation creation/sharing;
5. defines Manager claim through verified LINE;
6. defines invalid/expired/consumed/revoked invite states;
7. defines Manager vs Owner role indication;
8. maps Owner sees / Manager sees / Manager cannot access across affected admin surfaces;
9. defines revocation UX;
10. preserves existing Owner claim flow;
11. preserves Barber/customer/booking behavior;
12. preserves tenant isolation/security requirements;
13. does not introduce cross-shop Manager behavior;
14. does not redesign the general admin experience;
15. does not authorize Engineering.

Only after UX approval and Product review may SPR-003 be considered for `READY_FOR_ENGINEERING`.

---

## 22. Product review — UX-003

### Result

**APPROVED**

Product verified that UX-003:

1. matches PD-012;
2. stays inside SPR-003 scope;
3. introduces no unauthorized capability;
4. preserves the fixed Manager permission set;
5. preserves Owner-only membership/security boundaries;
6. defines sufficient invite/claim/revoke and invalid/expired/consumed/revoked states;
7. preserves server-authoritative authorization, verified LINE identity, and tenant isolation;
8. defines appropriate mobile/LINE-first behavior at 375 / 390 / 430 / desktop;
9. defines accessibility expectations adequate for implementation/QA;
10. preserves all protected Owner/Barber/customer/booking/concurrency/SPR-002 boundaries.

No material Product conflict was found. No Founder re-review is required.

### Engineering scope now authorized

Engineering may implement only the tenant-scoped Manager MVP defined by this Sprint and Product-approved UX-003, including:

- Manager membership data model distinct from `barbers`;
- Manager invite data/state required by the approved lifecycle;
- Owner-only Manager management;
- secure shop-bound/role-bound/expiring/single-use invite generation;
- Manager claim through verified LINE identity;
- active Manager authorization scoped to exactly one shop;
- approved existing admin access for Manager;
- Owner-only revoke behavior;
- invalid/expired/consumed/revoked invite handling;
- Manager vs Owner role indication;
- server-side Owner-only enforcement;
- tenant-isolation enforcement;
- required security/regression tests.

Engineering must not invent additional Manager powers or broaden architecture.

### Required Engineering report

Engineering must create:

`docs/barberqx-os/reports/RPT-003-ENG.md`

It must document:

- implementation commit(s);
- files/schema/migrations changed;
- Manager membership/invite model implemented;
- authorization model and tenant-scoping checks;
- invite/claim/revoke implementation;
- Owner-only enforcement;
- Manager operational surfaces enabled;
- explicit protected non-changes;
- exact security and regression tests/results;
- responsive/mobile verification;
- how QA should verify every SPR-003 + UX-003 acceptance criterion.

---

## 23. State

**READY_FOR_QA**

`READY_FOR_ENGINEERING` → **IMPLEMENTED** via Engineering + [RPT-003-ENG](../reports/RPT-003-ENG.md) on 2026-09-25.

`IMPLEMENTED` → **READY_FOR_QA** via Engineering verification package in the same report (how QA should verify SPR-003 + UX-003).

QA owns the next transition. Do not PASS or LOCK from Engineering.

**No cross-shop Manager access, custom RBAC, generalized identity rewrite, Owner claim rewrite, Barber/customer/booking redesign, or SPR-002 change is authorized.**

Do not modify SPR-002 scope or state.

Do not create SPR-004.
