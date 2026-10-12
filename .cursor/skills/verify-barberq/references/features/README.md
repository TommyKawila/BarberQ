# BarberQx feature map

Behavior-level inventory for agents verifying changes. Keep entries short enough to run without reading all source.

## Baseline preconditions

- `npm ci` once per clean tree.
- Run `npx next typegen` before `npm run typecheck` if `.next/types` is missing.
- Local prototype: no Supabase keys → memory store. Production/QA: Supabase + LIFF + `NEXT_PUBLIC_APP_URL` + `SUPERADMIN_TOKEN`.
- Founder QA destructive commands require `BARBERQ_ENV=founder_qa` and the dedicated QA project (see `docs/qa-setup.md`). Never point reset at production.

## Proof and skip reporting

- Exercise the success / cancel / error / empty / persistence paths the change can affect.
- When LINE OAuth / real push cannot run in this environment, say so and cover the closest automated path (`test:*`, `pushText` skip behavior, pilot checklist items).

## Full sweep

1. [customer-booking](customer-booking.md)
2. [customer-bookings](customer-bookings.md)
3. [line-liff-auth](line-liff-auth.md)
4. [line-notifications](line-notifications.md)
5. [shop-admin-board](shop-admin-board.md)
6. [shop-admin-team](shop-admin-team.md)
7. [shop-admin-settings](shop-admin-settings.md)
8. [owner-onboarding](owner-onboarding.md)
9. [manager-invite](manager-invite.md)
10. [superadmin-platform](superadmin-platform.md)
11. [tenancy-security](tenancy-security.md)
12. [founder-qa](founder-qa.md)
13. [marketing-trial](marketing-trial.md)
