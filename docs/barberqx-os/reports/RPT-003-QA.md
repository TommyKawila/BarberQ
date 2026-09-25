# RPT-003-QA — SPR-003 Tenant-Scoped Manager Role

| | |
|---|---|
| Linked Sprint | [SPR-003](../sprints/SPR-003-TENANT-SCOPED-MANAGER-ROLE.md) |
| Linked UX | [UX-003](../handoffs/UX-003-TENANT-SCOPED-MANAGER-ROLE.md) |
| Engineering report | [RPT-003-ENG](./RPT-003-ENG.md) |
| Original implementation commit | `6d7bb96717a1749f37de32a08957fa3b76fedc38` |
| QA-003-01 fix commit | `65ff9a79aaad1a5a2a361b66797463ef1bff04f5` |
| Date | 2026-09-25 |
| Re-QA verdict | **FAIL — RETURN_TO_ENGINEERING** |

## 1. Fix commit reviewed

GitHub `main` is identical to `65ff9a79aaad1a5a2a361b66797463ef1bff04f5` at re-QA time.

The fix commit changes only:

- `src/lib/admin-auth.ts`
- `src/app/api/barbers/[id]/route.ts`
- `src/app/api/barbers/[id]/profile-image/route.ts`
- `src/app/admin/staff/[id]/page.tsx`
- `src/lib/manager/manager-owner-identity.test.ts`
- `package.json`
- `RPT-003-ENG.md`
- `SPR-003-TENANT-SCOPED-MANAGER-ROLE.md`

No Manager invite/membership, booking/customer, Owner claim, tenant, Super Admin, or SPR-002 file is changed by the QA-003-01 fix.

## 2. QA-003-01 verification

**PASS.**

Engineering fixed the exact Owner-identity/profile boundary defect without introducing RBAC or broadening scope.

New server guard:

`assertCanMutateOwnerBarberIdentity(staff, barber)`

denies a non-Owner when the target Barber record has `role === "owner"`.

The guard is applied to:

- Owner `name` / `lineId` mutation through PATCH `/api/barbers/{id}`;
- Owner profile-image POST;
- Owner profile-image DELETE.

The ordinary Barber operational path remains on the existing Manager shop-operator authorization.

## 3. Direct API results

**PASS — code/test verification.**

Focused direct route tests cover:

A. Manager PATCH Owner name → **403 DENIED**, persisted name unchanged.

B. Manager PATCH Owner LINE identity → **403 DENIED**, persisted LINE identity unchanged.

C. Manager POST Owner profile image → **403 DENIED**.

D. Manager DELETE Owner profile image → **403 DENIED**, existing image remains.

E. Manager PATCH ordinary Barber name → **200 ALLOWED**.

F. Manager POST/DELETE ordinary Barber profile image → **200 ALLOWED**.

G. Manager ordinary-Barber operational access remains permitted by the unchanged `assertCanManageBarber` / operator path. Existing Manager authorization and shop/barber suites remain in `test:security` / `test:shop`. The focused identity test itself does not add a separate availability-toggle assertion.

H. Owner PATCH own name + POST own profile image → **200 ALLOWED**.

The focused test file therefore covers all four required Owner identity/profile direct server attempts and the required positive ordinary-Barber name/profile cases.

## 4. UI results

**PASS — static implementation review.**

When Manager views an Owner Barber record:

- Owner name input is read-only;
- profile-image upload/replace/delete controls are hidden;
- LINE identity management controls are hidden;
- save omits Owner `name` / `lineId` from the Manager request.

For an ordinary Barber, edit/profile controls remain available.

No broad Team redesign is introduced by the fix.

## 5. Migration state

**NOT VERIFIED AS APPLIED IN A TARGET QA SUPABASE PROJECT.**

Static review of `supabase/migrations/0025_shop_managers.sql` remains acceptable, but neither the Engineering report nor the QA tools available in this review provide evidence that migration 0025 has been applied to the target QA Supabase project.

Therefore QA does **not** claim that live Manager invite/claim behavior has passed against the target database.

Before live Manager invite/claim QA, apply/confirm migration:

`supabase/migrations/0025_shop_managers.sql`

No secret, invite token, or actual LINE user ID should be recorded in this report.

## 6. Live LINE / invite / revoke results

**NOT COMPLETED — BLOCKING QA VERIFICATION REMAINS.**

This re-QA environment does not provide direct authenticated access to the target Supabase project plus a real LINE/LIFF session. The current Engineering report also still states that target live verification was not completed.

QA therefore does not claim PASS for:

- Owner creating a real Manager invite in target environment;
- real eligible Manager claiming through their own verified LINE identity;
- active Manager role/shop display after live claim;
- revoke → refresh/re-login denial;
- invalid / expired / consumed / revoked / regenerated-old invite behavior in target DB;
- incompatible-identity claim in target DB;
- invite race/single-use behavior against target Supabase concurrency.

Static implementation and automated memory-store tests support these behaviors, but they are not a substitute for the required target-environment verification.

## 7. Tenant isolation

**PASS — static/server and automated-test evidence; target live route/API exercise remains outstanding.**

Server authorization still resolves:

verified LINE identity → active Manager membership → concrete shopId

and `assertStaffForShop` rejects shop mismatch.

Existing Manager tests cover Shop A Manager denial against Shop B and incompatible active Manager identity across shops.

No tenant-isolation code changed in QA-003-01.

No target live Shop A → Shop B route/API test is claimed in this report.

## 8. Barber separation

**PASS.**

Manager remains stored in `shop_managers`, has `barberId: null`, creates no Barber record, remains absent from customer bookable-Barber queries, and receives no Barber schedule/slots.

QA-003-01 does not modify this model.

## 9. Responsive results

**NOT COMPLETED LIVE — BLOCKING QA VERIFICATION REMAINS.**

The required interactive viewport pass at:

- 375px
- 390px
- 430px
- desktop

has not been completed in a target authenticated browser/LINE environment.

Static review confirms:

- relevant buttons use approximately 44px+ minimum targets;
- Owner name becomes non-actionable for Manager;
- Owner photo controls disappear rather than remaining misleading;
- revoke still requires explicit confirmation;
- role/shop hierarchy code is unchanged;
- no broad layout redesign was introduced.

QA does not claim responsive PASS until the required viewport states are exercised.

## 10. Regression results

**PASS — fix-scope/static review.**

The QA-003-01 fix does not change:

- Manager invite lifecycle;
- `/manager/join`;
- `/owner/join`;
- Manager membership model;
- tenant isolation architecture;
- verified LINE claim path;
- Manager revoke path;
- ordinary Barber management architecture;
- customer booking;
- My Bookings;
- cancellation semantics;
- booking transaction/concurrency;
- Super Admin separation;
- SPR-002 scope/state.

SPR-002 remains `READY_FOR_ENGINEERING`.

## 11. Automated test verification

Engineering reports after fix:

- `npm run typecheck` — PASS
- focused `manager-owner-identity.test.ts` — 7/7 PASS
- `npm run test:security` — 188 PASS
- `npm run test:shop` — 50 PASS
- `npm run test:booking` — 26 PASS
- `npm run test:onboarding` — 44 PASS
- `npm run build` — PASS
- `npm run lint` — existing baseline: 31 errors / 9 warnings

Code inspection confirms the focused test suite executes direct API handlers for Owner name, Owner LINE identity, Owner profile-image POST, Owner profile-image DELETE, ordinary Barber name/profile-image positive cases, and Owner self-edit positive behavior.

No new SPR-003 lint regression is identified from the fix diff. The known lint baseline is not used as a failure reason.

## 12. Remaining findings

### QA-003-01 — CLOSED

Owner identity/profile mutation by Manager is fixed at server and UI levels with focused regression coverage.

### QA-003-02 — OPEN: target live verification prerequisite

**Classification: QA verification blocker, not a newly discovered Product/code defect.**

Before QA can issue PASS, the following previously required acceptance checks must be completed in an environment where migration 0025 is applied:

1. real LINE Manager claim;
2. invite lifecycle in target DB, including single-use/regenerated-old invite;
3. revoke → refresh/re-login denial;
4. Shop A Manager denied Shop B route/API;
5. confirmation Manager creates no Barber/bookable record in target environment;
6. 375 / 390 / 430 / desktop responsive pass on Manager-specific states.

**No application-code change is requested for QA-003-02.** Engineering/operations only needs to prepare/identify the target QA environment with migration 0025 applied and make it available for the required QA exercise.

## 13. Final verdict

**FAIL — RETURN_TO_ENGINEERING**

Reason: QA-003-01 is fixed, but SPR-003 still has mandatory target-environment / real-LINE / responsive acceptance verification that has not been completed. The previous QA report explicitly made those checks a prerequisite to PASS, and this re-QA has no evidence that the prerequisite was satisfied.

Return scope is operational only:

- do **not** change application code unless a new verified defect is found;
- apply/confirm migration 0025 in the target QA Supabase project;
- provide/run the real LINE/LIFF Manager test context;
- complete required live invite/revoke/tenant/responsive checks;
- update RPT-003-ENG only with factual environment/test evidence if Engineering participates;
- return SPR-003 to `READY_FOR_QA`.

Do not modify SPR-002. Do not create SPR-004. Do not LOCK SPR-003.
