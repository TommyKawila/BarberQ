# UX-003 — Tenant-Scoped Manager Role

| | |
|---|---|
| Linked Sprint | [SPR-003 — Tenant-Scoped Manager Role](../sprints/SPR-003-TENANT-SCOPED-MANAGER-ROLE.md) |
| Product Decision | [PD-012 — Tenant-scoped Manager Role](../04-PRODUCT-DECISIONS.md#pd-012) |
| UX recommendation | **UX_APPROVED** |
| Product review | **APPROVED — 2026-09-25** |
| Scope type | Security-sensitive role/access UX |
| Engineering authorization | Controlled by SPR-003 state; this handoff does not independently authorize implementation |

> UX-003 defines the minimum user-facing states and access hierarchy for the approved tenant-scoped Manager MVP. It does not create custom RBAC, cross-shop Manager behavior, a new Owner model, or a general admin redesign.

---

## 1. UX objective

Enable the legitimate shop Owner to delegate day-to-day BarberQx administration to one or more trusted Managers while keeping:

- shop identity primary;
- Owner as highest shop authority;
- Manager separate from Owner and Barber;
- Manager identity verified through LINE;
- Manager access limited to the assigned shop;
- Owner-only membership/security controls protected;
- the existing admin experience substantially unchanged.

Manager is an operational role inside the current shop admin experience, not a separate product or alternate dashboard.

---

## 2. Information architecture

Manager management lives inside the **existing shop admin Settings context**.

Do not add a new top-level application, workspace, or RBAC console.

The Owner-facing Manager management surface must support:

- zero Managers;
- one Manager;
- multiple Managers;
- pending Manager invitations;
- active Managers;
- expired invitations;
- consumed invitations where surfaced;
- revoked/cancelled invitations where surfaced;
- revoke action for active Managers;
- invite/reissue flow where permitted by SPR-003.

The Manager must not see Manager-management controls.

---

## 3. Role hierarchy and indication

### Shop identity

The current shop remains the primary context.

### Role indication

The authenticated admin role is secondary context:

- Owner: show an appropriate **Owner** indication where account/role context is needed.
- Manager: show an appropriate **Manager** indication where account/role context is needed.

Role indication must not visually compete with shop identity.

Do not create a Manager-branded shell.

### Security principle

Hiding controls in UI is not authorization.

Server-side authorization remains authoritative for every protected operation.

---

## 4. Owner-only Manager management

Only Owner sees and can use:

- Manager management entry in Settings;
- Manager list/status;
- Invite Manager;
- invite sharing/copying;
- reissue/regenerate action where supported;
- revoke Manager;
- pending-invite cancellation/revocation;
- membership/security controls related to Managers.

Manager must not see or use those actions.

Direct navigation by Manager to Owner-only Manager-management routes must produce an access-denied result and no privileged data disclosure.

---

## 5. Manager permission matrix

The Manager role uses one fixed Product-defined permission set.

| Surface / operation | Owner sees / can use | Manager sees / can use | Manager cannot access |
|---|---|---|---|
| Today / queue | Yes | Yes | — |
| Booking details | Yes | Yes | — |
| Existing queue actions | Yes | Yes | Actions outside the existing approved shop-admin model |
| Staff-assisted customer booking | Yes | Yes, where already supported | New booking capabilities |
| Existing staff-side cancel/outcome operations | Yes | Yes, where already supported | New cancellation/outcome powers |
| Team | Yes | Yes | Owner membership/security controls |
| Create/edit ordinary Barbers | Yes | Yes | Create Owner/Manager via Barber model |
| Deactivate/reactivate Barbers | Yes | Yes, subject to existing safeguards | Override booking-integrity safeguards |
| Barber availability | Yes | Yes | — |
| Schedule / hours / recurring breaks | Yes | Yes | — |
| Operational shop Settings | Yes | Yes | Owner identity/security/membership settings |
| Stats | Yes | Yes | New analytics capability |
| Setup / help | Yes | Yes | Platform secrets/configuration |
| Existing LINE OA setup/support | Yes | Yes | LINE channel secrets, LIFF credentials, sender architecture |
| Manager management | Yes | **No** | Invite/reissue/revoke/view Manager membership controls |
| Owner identity / ownership controls | Yes | **No** | Unlink/replace/promote/transfer Owner |
| Shop deletion/cancellation / future billing ownership | Owner-only where capability exists | **No** | Entire capability |
| Super Admin | No shop-role access | **No** | Entire capability |

Manager never becomes a Barber, never gains a barber schedule/slots, and never appears in customer barber selection.

---

## 6. Invite creation and sharing

### Owner flow

1. Owner opens Settings → Manager management.
2. Owner selects **Invite Manager**.
3. System creates a secure invitation for the current shop.
4. Owner receives a shareable single-use invite link.
5. Owner copies/shares the link with the intended Manager.

The UI must not request a LINE user ID.

The invite experience must communicate that:

- the link grants access only after the invitee authenticates with their own LINE account;
- the invitation is for the current shop;
- the invitation expires;
- the link is intended for one Manager claim.

Do not expose platform secrets or internal membership identifiers.

---

## 7. Manager LINE claim flow

The Manager claim experience must be distinct from Owner claim.

### Valid claim

1. Invitee opens the Manager invite.
2. UI identifies the intended shop and that the invite grants **Manager** access.
3. Invitee continues with LINE authentication.
4. After verified authentication, the system completes the Manager claim if still valid.
5. Success state confirms Manager access to that shop.
6. Manager can continue to the assigned shop admin.

### Required UX truth

- no manual LINE-ID entry;
- no Owner wording;
- no Barber wording;
- no cross-shop selector;
- no permission customization;
- the invitee cannot choose a different shop or role.

---

## 8. Invite states

### Invalid

Use when the token does not resolve.

Required behavior:

- no claim action;
- no Manager membership creation;
- no unrelated shop/member disclosure;
- clear invalid-link state.

### Expired

Required behavior:

- no claim;
- explain that the invitation expired;
- direct the invitee to request a new invitation from the shop Owner.

### Consumed

Required behavior:

- no second claim;
- no second identity binding;
- explain that the invite has already been used / is no longer available.

### Revoked / cancelled

Required behavior:

- no claim;
- explain that the invitation is no longer active;
- direct the invitee to contact the shop Owner if access is still needed.

### Incompatible identity / denied claim

If the verified identity cannot claim under the approved Product rules, fail safely.

Do not reveal other tenant membership information.

Return to Product if UX would need to explain or support multi-shop Manager behavior.

---

## 9. Manager revoke flow

Owner-only flow:

1. Owner opens Manager management.
2. Owner selects an active Manager.
3. Owner chooses **Revoke access**.
4. Confirmation must clearly state:
   - BarberQx admin access for this shop will be removed;
   - the person's LINE account is not deleted or modified;
   - shop, Barber, booking and customer data are not deleted.
5. Owner confirms.
6. Success state shows that Manager access is revoked.

Revocation is a destructive access action and requires an explicit confirmation state.

Manager cannot revoke themselves, Owner, or another Manager in the MVP.

---

## 10. Zero / one / multiple Manager states

### Zero

Show a simple empty state explaining that Owner can invite a trusted employee to help operate BarberQx.

Do not present Manager as required for every shop.

### One

Show the Manager identity/display name where available and current status.

### Multiple

Use the same list pattern for each Manager.

Do not introduce hierarchy, lead Manager, permission differences, teams, or Manager limits.

---

## 11. Owner sees / Manager sees / Manager cannot access

### Owner sees

- normal existing admin;
- Manager management in Settings;
- Manager/invite statuses;
- invite/reissue/revoke actions;
- Owner role context where appropriate.

### Manager sees

- current shop admin context;
- approved daily operational admin surfaces;
- Manager role indication;
- no Owner membership/security actions.

### Manager cannot access

- Manager membership management;
- Owner identity/security actions;
- ownership transfer/replacement;
- shop ownership-lifecycle controls;
- Super Admin;
- platform LINE/LIFF secrets/configuration;
- another shop;
- any custom permission/RBAC configuration.

UI visibility must match server-side authorization, but server authorization is authoritative.

---

## 12. Mobile-first and responsive requirements

Validate at minimum:

- 375px;
- 390px;
- 430px;
- desktop/reference admin viewport.

Requirements:

- invite links/actions remain usable without horizontal overflow;
- Manager list/status remains legible on small screens;
- destructive revoke action is not accidentally triggered;
- primary actions remain reachable with mobile keyboard present where applicable;
- role/shop context remains clear;
- invite-state messages do not clip;
- dialogs/sheets do not trap content below the viewport;
- no broad admin layout redesign solely for this Sprint.

The Manager LINE claim flow must work naturally in the intended LINE/mobile context.

---

## 13. Accessibility requirements

At minimum:

- interactive targets should meet the existing product accessibility standard, with approximately 44px touch targets for primary mobile actions where practical;
- visible keyboard focus for interactive controls;
- semantic labels for invite, copy/share, revoke, close and confirmation actions;
- status must not rely on color alone;
- error/invalid/expired states must be announced/readable;
- destructive revoke requires clear action naming and confirmation;
- dialogs/sheets must preserve keyboard/focus behavior;
- role indication must remain readable and not depend on icon/color alone.

Do not use branding artwork as a substitute for accessible labels.

---

## 14. Brand hierarchy

Follow `docs/BRAND.md`:

- this is an admin/product surface;
- current shop context remains visible and important;
- BarberQx remains the product shell;
- Manager/Owner role label is secondary operational context;
- no extra BarberQx logos or Manager-specific branding;
- merchant identity must not be displaced by role chrome.

---

## 15. Protected UX / Product boundaries

UX-003 must not change:

- existing Owner claim flow;
- existing legitimate PHINX Owner relationship;
- Owner as highest authority;
- Barber model / role / bookability;
- customer barber selection;
- customer booking sequence;
- My Bookings;
- booking cancellation semantics;
- booking transaction or concurrency behavior;
- tenant IDs/slugs;
- verified LINE/LIFF identity fundamentals;
- sender-neutral messaging truth;
- Super Admin separation;
- SPR-001 locked truth;
- SPR-002 scope or state.

UX-003 must not add:

- cross-shop Manager access;
- Manager shop switcher;
- custom RBAC;
- granular permissions;
- additional roles;
- multiple Owners/co-owners;
- ownership transfer;
- generalized identity rewrite;
- broad admin redesign;
- manual LINE-ID entry.

---

## 16. Product-return criteria

Return to Product before implementation expands beyond this handoff if any of the following becomes necessary:

- cross-shop Manager membership or shop selection;
- one LINE identity managing multiple shops;
- custom/granular Manager permissions;
- a new role beyond Owner / Manager / existing Barber;
- changes to Owner claim semantics;
- migration of Owner into a generalized membership architecture;
- changes to Barber identity/model;
- changes to customer booking/concurrency behavior;
- changes to LINE/LIFF identity fundamentals;
- changes to Super Admin authority;
- a broader admin navigation/redesign than necessary for Manager access;
- a security requirement that conflicts with PD-012 or SPR-003.

---

## 17. UX acceptance summary

UX-003 is acceptable when Engineering can implement from it without inventing Product policy:

- Owner-only Manager management location and states are defined;
- fixed Manager permissions are explicit;
- Owner-only boundaries are explicit;
- invite creation/sharing is defined;
- verified-LINE claim states are defined;
- invalid/expired/consumed/revoked states are defined;
- revoke behavior and copy truth are defined;
- zero/one/multiple Manager states are defined;
- role indication and brand hierarchy are defined;
- mobile/accessibility requirements are defined;
- server-authoritative authorization is explicit;
- protected boundaries and Product-return criteria are explicit.

---

## 18. Recommendation

**UX_APPROVED**

UX-003 stays inside PD-012 and SPR-003.

It is ready for Product review and, if Product accepts it, transition of SPR-003 to `READY_FOR_ENGINEERING`.
