# Shop admin — today board / queue

Owner and barber "today" board for appointments.

## Sub-features

- `/{shopSlug}/admin` today board
- appointment outcomes / late-called / block slots
- barber board visibility (own vs owner team view)
- stats at `/{shopSlug}/admin/stats`
- my-schedule at `/{shopSlug}/admin/my-schedule`

## How to get to it (user POV)

Staff opens admin after LINE login. Owner sees team queue; barber sees own board. More menu → stats / schedule / settings.

## Verifying with repo commands

```bash
npm run test:shop
npm run test:security
npx next typegen && npm run typecheck
```

Browser (memory/QA): create bookings, open admin board, mark outcome / block, reload.

## Gotchas

- Tenancy: staff of shop A must not load shop B board data.
- Prefer `/api/[shop]/…` appointment routes.
