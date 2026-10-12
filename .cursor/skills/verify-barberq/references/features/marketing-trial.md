# Marketing / trial lead form

Public trial interest capture for the platform brand.

## Sub-features

- `/trial` form UX
- `POST /api/trial-leads`
- rate limiting
- superadmin trial CRM consumption
- layout / brand (BarberQx primary on marketing)

## How to get to it (user POV)

Open `/trial`, submit lead, confirm success state. Super Admin reviews under trial-leads.

## Verifying with repo commands

```bash
npm run test:security      # trial-leads, trial-form-ux, layout, trial-crm
npx next typegen && npm run typecheck
```

## Gotchas

- Marketing pages: BarberQx is the primary brand (unlike shop booking pages).
- Rate limit behavior is part of the security suite — exercise repeat submits when changing the limiter.
