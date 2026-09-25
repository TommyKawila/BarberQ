# RPT-003-QA — SPR-003 Tenant-Scoped Manager Role

| | |
|---|---|
| Linked Sprint | [SPR-003](../sprints/SPR-003-TENANT-SCOPED-MANAGER-ROLE.md) |
| Linked UX | [UX-003](../handoffs/UX-003-TENANT-SCOPED-MANAGER-ROLE.md) |
| Engineering report | [RPT-003-ENG](./RPT-003-ENG.md) |
| Reviewed implementation commit | `6d7bb96717a1749f37de32a08957fa3b76fedc38` |
| Date | 2026-09-25 |
| QA verdict | **FAIL — RETURN_TO_ENGINEERING** |

## 1. Commit reviewed

QA reviewed GitHub `main` at/including Engineering commit `6d7bb96717a1749f37de32a08957fa3b76fedc38` against SPR-003, Product-approved UX-003, PD-012, CURRENT-STATE, WORKFLOW, BRAND, and the protected SPR-002 boundary.

## 2. Migration state / environment

Static migration review completed for:

`supabase/migrations/0025_shop_managers.sql`

Result of static review:

- `shop_managers` is distinct from `barbers`;
- role is constrained to `manager`;
- active Manager LINE identity is globally unique through a partial unique index;
- multiple Managers can belong to one shop;
- revoked rows remain non-active through `revoked_at`;
- invites are shop-bound, Manager-role-bound, expiring, single-use, and represent consumed/revoked state;
- regenerate revokes the previous invite before creating a new one;
- claim uses row locking and consumes the invite atomically;
- RLS is enabled on both Manager tables;
- Manager RPCs are revoked from `public` and granted to `service_role` only;
- Owner and Barber are not migrated into the Manager model.

The QA environment available to this review did **not** provide direct access to the target Supabase project or a live LINE/LIFF session. QA therefore did **not** apply migration 0025 or perform live invite/claim testing. No live Manager invite/claim result is claimed in this report.

The Sprint already fails on the implementation defect in §14, so no PASS is possible. Re-QA must apply migration 0025 to the target QA Supabase project before any live invite/claim verification.

## 3. Implementation-scope result

**PASS — static scope review.**

Engineering used an additive Manager model and separate `/manager/join` flow. No custom RBAC, cross-shop Manager switcher, generalized Owner/Manager/Barber membership rewrite, customer booking redesign, or unrelated admin redesign was found in the reviewed implementation.

SPR-002 was not modified by the SPR-003 implementation commit.

## 4. Invite lifecycle result

**PASS — static implementation / automated-evidence review; live QA pending re-test.**

The migration and server/store implementation represent:

- pending invite;
- 7-day expiry;
- consumed invite;
- revoked invite;
- regenerate invalidating the old invite;
- single-use claim with row lock;
- duplicate active identity rejection.

Owner Manager-management list payload uses public invite mapping that omits the token. New/regenerated invite URL is returned only from the create/regenerate response for sharing.

Live claim/regenerate/cancel behavior was not exercised by QA because migration 0025 was not applied in a target QA environment during this review.

## 5. LINE claim result

**PASS — static authorization design; live LINE verification pending re-test.**

`POST /api/manager/claim` obtains identity from `assertVerifiedCustomer(req)` and uses `lineUser.userId`. Client-supplied `lineId`, `shopId`, or role values are not authoritative.

The Manager claim route is separate from Owner claim. No manual Manager LINE-ID field exists in the claim UI.

Live physical LINE/LIFF claim was not executed in this QA environment.

## 6. Owner-only enforcement result

**FAIL — Owner identity boundary is incomplete.**

Manager-management endpoints correctly require `assertShopOwner`, and the Manager-management page rejects a Manager directly.

However, the existing Barber edit path opened to Managers allows a Manager to mutate identity/profile fields of the **Owner barber record**:

- `src/lib/admin-auth.ts`: `assertCanManageBarber` returns true for a Manager for any Barber record in the same shop.
- `src/app/api/barbers/[id]/route.ts`: for an Owner barber, Manager is blocked only from changing `lineId`; `name` remains allowed because Manager is treated as a shop operator.
- `src/app/api/barbers/[id]/profile-image/route.ts`: Manager can POST/DELETE the Owner barber's profile image.
- `src/app/admin/staff/[id]/page.tsx`: when a Manager opens the Owner barber record, the UI still exposes editable name and profile-image controls.

This conflicts with SPR-003 §4.3 and required security test §15.4: **Manager must not alter Owner identity**. UX-003 also makes Owner identity / ownership controls unavailable to Manager.

The Owner LINE unlink boundary is correctly protected; the defect is the remaining Owner identity/profile mutation path.

## 7. Manager operational-access result

**PASS WITH BLOCKING OWNER-BOUNDARY EXCEPTION.**

Static review confirms Manager is enabled on approved operational surfaces through `isShopOperatorRole` / `assertShopOperator`, including board, Team, Stats, operational Settings, Setup/help and LINE OA support.

Creating/editing ordinary Barbers is authorized.

The blocking exception is only the Owner record identity/profile mutation described in §6. QA is **not** requesting a redesign or new permissions model.

## 8. Tenant-isolation result

**PASS — static and automated-evidence review.**

Server authorization resolves authenticated staff/Manager membership, retains a concrete `shopId`, and `assertStaffForShop` rejects requested-shop mismatch. Manager-management routes resolve the route shop and then require same-shop Owner authorization.

Engineering's reported security suite includes Shop A / Shop B denial coverage. No client-supplied shop ID is authoritative in Manager claim.

Any live cross-shop defect found during re-QA remains P0.

## 9. Barber-separation result

**PASS — static and automated-evidence review.**

Manager membership is stored in `shop_managers`, not `barbers`. Manager auth has `barberId: null`. Customer bookable Barber queries remain Barber-backed. No Manager schedule/slot record is created by Manager claim.

## 10. Revoke result

**PASS — static implementation / automated-evidence review; live QA pending.**

Owner-only revoke route checks same-shop Owner authority and sets `revoked_at`. Active Manager lookup excludes revoked Manager membership, so a subsequent authorization lookup fails.

No code in revoke deletes LINE identity, Owner, Barber, booking, appointment, or shop data.

Live revoke → refresh/re-login denial must be executed in re-QA after migration is applied.

## 11. Regression result

**PASS — static scope / reported automated baseline.**

Reviewed changes do not rewrite:

- `/owner/join` or Owner claim RPC;
- customer booking sequence;
- booking transaction/concurrency logic;
- customer My Bookings;
- cancellation semantics;
- customer LINE identity;
- Super Admin token path;
- Barber membership model.

SPR-002 remains protected and unchanged by this Sprint.

## 12. Responsive / mobile result

**NOT COMPLETED LIVE — required in re-QA.**

Engineering explicitly reported that the live Chromium viewport pass was not completed. This QA environment also did not provide an interactive authenticated browser/LINE session.

Static UX inspection shows:

- Manager-management primary actions use 44px+ minimum heights;
- revoke requires an explicit confirmation state;
- statuses include text labels rather than color only;
- Manager join primary actions use 48px minimum height;
- layout uses wrapping/stacking patterns appropriate for narrow screens.

Re-QA must explicitly exercise 375 / 390 / 430 / desktop on the required Manager-specific states after the blocking defect is fixed.

## 13. Automated test verification

Engineering report records:

- `npm run typecheck` — PASS
- `npm run test:security` — 181 PASS / 0 FAIL
- `npm run test:shop` — 50 PASS
- `npm run test:booking` — 26 PASS
- `npm run test:onboarding` — 44 PASS
- `npm run build` — PASS

The existing Manager security tests cover invite states, verified LINE use, fake client LINE ID rejection, tenant isolation, Owner-only Manager-management, owner deactivation denial, revocation, and Barber separation.

Coverage gap relevant to this QA failure: no test currently proves that a Manager cannot PATCH the Owner barber's identity/profile fields or POST/DELETE the Owner barber profile image.

Lint still has documented `react-hooks/set-state-in-effect` findings, including the Manager hook pattern copied from the existing Owner pattern. This QA decision does not require unrelated baseline lint cleanup.

## 14. Findings / classification

### QA-003-01 — Manager can modify Owner identity/profile

**Classification:** QA FAIL — Owner-only security boundary accessible to Manager.

**Approved requirement:**

- SPR-003 §4.3: Manager must not alter Owner identity.
- SPR-003 §15.4: Manager cannot modify Owner identity.
- UX-003 permission matrix: Owner identity / ownership controls are not Manager-accessible.

**Reproduction from the implementation:**

1. Authenticate as an active Manager for Shop A.
2. Obtain the Owner barber record ID from Team / existing Barber list.
3. Request `PATCH /api/barbers/{ownerBarberId}` with `{"name":"Changed by Manager"}`.
4. `assertCanManageBarber` authorizes Manager because the Owner barber belongs to Shop A.
5. The route blocks Owner `lineId` changes but does not block Owner `name`; the update proceeds.
6. Similarly, `POST /api/barbers/{ownerBarberId}/profile-image` and DELETE are authorized through `assertCanManageBarber` + `assertShopOperator`.

**Expected:**

Manager may operate approved day-to-day shop/Barber functions but must not alter Owner identity/profile.

**Required correction scope — narrow only:**

- Add a server-side guard so Manager cannot mutate Owner identity/profile fields on a Barber record whose role is `owner`.
- At minimum protect Owner display name and Owner profile-image mutation from Manager.
- Preserve the existing Owner LINE-ID protection.
- Hide/disable the corresponding Owner identity/profile controls in the Manager UI so UI matches server authorization.
- Add focused security tests for direct API attempts by Manager against Owner name and profile-image mutation.
- Do not introduce custom RBAC.
- Do not change Owner claim.
- Do not change Manager invite/claim architecture.
- Do not change booking/customer behavior.
- Do not change SPR-002.
- Do not broaden this fix into general admin redesign.

Operational Owner-as-Barber availability/schedule behavior should not be changed unless required by the already-approved UX/Product rules; this QA return is specifically about Owner **identity/profile** mutation.

### QA-003-02 — Required live verification remains outstanding

**Classification:** QA verification prerequisite, not a separate Product-scope request.

After QA-003-01 is fixed, re-QA must:

1. apply `0025_shop_managers.sql` to the target QA Supabase project;
2. run real eligible LINE claim;
3. verify invite invalid/expired/consumed/revoked/regenerated states;
4. verify Owner revoke → Manager refresh/re-login denied;
5. verify Shop A Manager cannot access Shop B UI/API;
6. run 375 / 390 / 430 / desktop viewport checks.

No PASS may be issued without these required checks.

## 15. Final QA verdict

**FAIL — RETURN_TO_ENGINEERING**

SPR-003 must return from `READY_FOR_QA` to `IMPLEMENTED`.

Engineering should correct only QA-003-01, add focused regression tests, update RPT-003-ENG with the exact fix and test results, and return SPR-003 to `READY_FOR_QA`.

QA will then perform the required migration-backed/live re-verification.

Do not modify SPR-002. Do not create SPR-004. Do not redesign unrelated admin surfaces.
