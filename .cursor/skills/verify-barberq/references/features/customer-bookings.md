# Customer bookings list / cancel

View and cancel the customer's own bookings.

## Sub-features

- list at `/{shopSlug}/bookings` (and legacy `/bookings` where still linked)
- cancel own booking
- late-called / outcome paths are staff-side; customers only see their appointments

## How to get to it (user POV)

After booking, open `/{shopSlug}/bookings` while LINE-authenticated. Cancel from the list when allowed.

## Verifying with repo commands

```bash
npm run test:booking
npm run test:security      # auth boundaries for cancel
npx next typegen && npm run typecheck
```

Browser: book once in memory mode, open bookings, cancel, reload and confirm absence.

## Gotchas

- Cancel must stay shop-scoped and LINE-user-scoped — no cross-tenant appointment IDs.
- Push failure must not erase a successful cancel/booking side effect.
