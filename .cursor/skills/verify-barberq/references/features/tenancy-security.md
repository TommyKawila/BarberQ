# Tenancy / security boundaries

Shop A cannot read or mutate shop B.

## Sub-features

- shop-scoped data access (memory + supabase stores)
- staff session shop binding
- invite / claim guards
- env hardening (required prod env, no secret leakage)
- upload authorization

## How to get to it (user POV)

Attempt cross-shop URLs/APIs as staff or customer of another tenant — expect denial. Isolation sentinel shop exists in Founder QA fixtures.

## Verifying with repo commands

```bash
npm run test:security
npm run test:shop
npm run qa:verify          # sentinel + fixture identity on founder_qa
```

## Gotchas

- Legacy unscoped APIs still exist; new work should use `/api/[shop]/…`.
- Do not log shop tokens, service role keys, or another shop's bookings.
