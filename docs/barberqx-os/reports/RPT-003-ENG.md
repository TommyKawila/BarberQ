# RPT-003-ENG — SPR-003 Tenant-Scoped Manager Role

| | |
|---|---|
| Linked Sprint | [SPR-003](../sprints/SPR-003-TENANT-SCOPED-MANAGER-ROLE.md) |
| Linked UX | [UX-003](../handoffs/UX-003-TENANT-SCOPED-MANAGER-ROLE.md) |
| Date | 2026-09-25 |
| Author | Engineering / Cursor |
| Sprint state after this report | **READY_FOR_QA** (QA-003-01 fix) |

## Implementation summary

Owner remains the highest shop authority. A verified LINE identity can become a tenant-scoped Manager of one shop via Owner-created invite. Manager is not stored in `barbers`, is not bookable, and cannot manage Manager membership.

Claim uses verified LINE (`assertVerifiedCustomer`). Body `line_id` / `shop_id` / `role` are ignored. Owner claim (`/owner/join`, `claim_owner_invite`) is unchanged.

## Schema / membership model

Migration: `supabase/migrations/0025_shop_managers.sql`

- `shop_managers`: shop + LINE membership, `role` check `manager`, `revoked_at`. Partial unique on `line_id` where `revoked_at` is null (one active shop per LINE). Revoked rows stay so re-login does not restore access.
- `shop_manager_invites`: shop-bound, `role` check `manager`, unique token, 7-day expiry, `consumed_at` / `revoked_at`. Regenerate revokes the old row and inserts a new token.
- RLS enabled, no public policies, RPCs granted to `service_role` only: `create_manager_invite`, `regenerate_manager_invite`, `cancel_manager_invite`, `revoke_shop_manager`, `get_manager_invite_preview`, `claim_manager_invite`.

Apply this migration on the target Supabase project before production claim/invite.

## Authorization

- `ShopStaffRole` includes `manager`. Barber LINE lookup stays first; active Manager is resolved after.
- `assertShopOperator`: Owner or active Manager of the requested shop.
- `assertShopOwner`: unchanged; Manager-management routes only.
- `assertStaffForShop`: still rejects mismatched `shop_id` (slug manipulation).
- Super Admin, `/api/staff` token admin, and booking transaction code were not changed.

Operational routes opened to Operator: shop barbers, settings, cover, setup, LINE OA support, barber deactivate/reactivate/profile image, barber name/bookable/profile fields. Manager cannot unlink Owner LINE.

## Surfaces

- Owner only: `/{shop}/admin/settings/managers` — list active/pending/expired/consumed/revoked without tokens; invite; copy link once from create/regenerate; cancel pending; revoke active with confirm. TH: เจ้าของร้าน / ผู้จัดการ.
- Claim: `/manager/join` (not `/owner/join`). Shop name + Manager wording. Errors per UX-003 §8.
- Admin chrome: shop name primary, role secondary. Manager-management hidden for Managers; direct URL still 403.
- Nav: Manager matches Owner day-to-day (board, team, stats, settings, schedule, booking). No Manager-management nav item.

## Protected non-changes

- SPR-002 artifacts/state
- Owner claim RPCs, `/owner/join`, `barbers` model
- Super Admin token path
- `/api/staff` token admin
- Customer bookable queries (barber-only)
- Booking transaction/concurrency
- SPR-004 not created

## Tests

Commands (2026-09-25), all pass:

- `npm run typecheck` — pass
- `npm run test:security` — 181 pass / 0 fail (includes new `src/lib/manager/manager-invite.test.ts`, `manager-claim-state.test.ts`)
- `npm run test:shop` — 50 pass
- `npm run test:booking` — 26 pass
- `npm run test:onboarding` — 44 pass
- `npm run build` — pass (routes include `/manager/join`, `/{shop}/admin/settings/managers`, manager APIs)

Covered: invite once; expired/invalid/consumed/revoked; regenerate invalidates old token; double claim does not consume a fresh invite; shop A invite cannot authorize shop B; verified LINE required; fake client `line_id` ignored; owner claim unchanged; manager A denied shop B read/mutate; manager cannot invite/revoke/deactivate owner; revoke then reauth denied; no barber row and not in bookable list.

`npm run lint` still reports pre-existing `react-hooks/set-state-in-effect` (and matching pattern on new Manager join/claim hooks copied from Owner join). Unrelated files were not fixed.

## Responsive / mobile

Manager join CTAs and Manager-management actions use `min-h-11` / `min-h-12` (44px+). Invite/manager status is labeled in text, not color-only.

Live Chromium viewport pass at 375 / 390 / 430 / desktop was not completed in this environment (browser automation blocked). HTTP 200 confirmed for `/manager/join`, `/manager/join?code=not-a-token`, and `/{shop}/admin/settings/managers`. QA should complete the viewport pass on those pages.

## How QA should verify

1. Apply `0025_shop_managers.sql` on the QA Supabase project if not applied.
2. As Owner of shop A: Settings → ผู้จัดการร้าน. Empty state. Invite Manager. Copy link once. Confirm list has pending, no token in list payload.
3. Open `/manager/join?code=` in a LINE identity that is not Owner/Barber/Manager. Claim succeeds. Redirect `/{slug}/admin`. Role shows ผู้จัดการ. Shop name remains primary. No Manager-management link. Direct `/admin/settings/managers` is 403 / owner-only copy.
4. Invalid / expired / consumed / revoked / incompatible-identity states match UX-003 §8. No other shop name, LINE id, or token echo.
5. Already-active Manager of this shop: no second membership; fresh invite not consumed.
6. LINE that is Owner/Barber anywhere, or active Manager of shop B: generic incompatible denial.
7. Manager of A cannot read/mutate shop B (slug swap). Cannot invite/revoke Managers. Cannot unlink Owner LINE. Cannot deactivate Owner. Cannot use Super Admin.
8. Manager can use board, team (ordinary barbers), stats, settings (operational), schedule (via barber query), setup, LINE OA support for shop A.
9. Manager is absent from customer barber selection and has no barber row.
10. Revoke Manager: confirm copy; after revoke, that LINE cannot re-enter admin until a new invite is claimed.
11. Owner claim `/owner/join` still works; existing barbers/bookings unchanged.
12. Viewport 375 / 390 / 430 / desktop: no horizontal overflow, 44px targets, status not color-only.

Do not PASS or LOCK this Sprint from this report.

## QA-003-01 fix

QA FAIL (`d3a89bed`) returned SPR-003 to `IMPLEMENTED` because Manager could still change Owner identity/profile through Barber edit paths. `assertCanManageBarber()` correctly allows Manager shop-wide operational access; it must not also authorize Owner identity mutation.

Root cause: PATCH `/api/barbers/{id}` only blocked Manager from changing Owner `lineId`. Owner `name` and Owner profile-image POST/DELETE stayed on the operational `assertCanManageBarber` path. Team UI still exposed name and photo controls for the Owner barber record.

Server protection (no invite/membership/RBAC rewrite):

- `assertCanMutateOwnerBarberIdentity(staff, barber)` — if the target barber `role === "owner"` and the caller is not Owner, 403 `FORBIDDEN`.
- PATCH `/api/barbers/{id}` calls it whenever `name` or `lineId` is present.
- POST/DELETE `/api/barbers/{id}/profile-image` call it after shop-scope manage, before upload/replace/delete.

UI (smallest Team/Barber change):

- On `/admin/staff/[id]`, Manager viewing an Owner record: name is read-only; profile upload/delete hidden; LINE unlink/edit hidden; save omits `name`/`lineId`.
- Owner may still edit own name/photo/LINE. Manager may still edit ordinary Barber name/photo/availability.

Files:

- `src/lib/admin-auth.ts`
- `src/app/api/barbers/[id]/route.ts`
- `src/app/api/barbers/[id]/profile-image/route.ts`
- `src/app/admin/staff/[id]/page.tsx`
- `src/lib/manager/manager-owner-identity.test.ts`
- `package.json` (`test:security` includes the new file)

Focused tests (direct API, memory store, Bearer LINE):

- A Manager PATCH Owner name → 403, name unchanged
- B Manager POST Owner profile image → 403
- C Manager DELETE Owner profile image → 403
- D Manager PATCH ordinary Barber name → 200
- E Manager POST/DELETE ordinary Barber profile image → 200
- F Manager PATCH Owner `lineId` → 403
- G Owner PATCH own name + POST own profile image → 200
- H existing Manager/cross-shop suite still in `test:security`

Verification (2026-09-25), all pass except documented lint baseline:

- `npm run typecheck` — pass
- focused `src/lib/manager/manager-owner-identity.test.ts` — 7 pass / 0 fail
- `npm run test:security` — 188 pass / 0 fail (was 181; +7 QA-003-01)
- `npm run test:shop` — 50 pass
- `npm run test:booking` — 26 pass
- `npm run test:onboarding` — 44 pass
- `npm run build` — pass
- `npm run lint` — 40 problems (31 errors, 9 warnings); same pre-existing `react-hooks/set-state-in-effect` / unused-import baseline. Unrelated files were not fixed.

Ordinary Barber management by Manager is unchanged. Invite architecture, membership model, `/manager/join`, `/owner/join`, Owner claim, tenant membership, verified LINE flow, booking/customer behavior, SPR-002, and SPR-004 were not changed.

QA re-verify: as Manager, PATCH Owner name and POST/DELETE Owner profile-image must 403; Owner self-edit and ordinary Barber edit/photo must still work. Do not PASS or LOCK from this report.
