# Customer booking (queue)

Book a slot at a shop from LIFF / web: pick barber, date, time, confirm.

## Sub-features

- shop landing at `/{shopSlug}` (merchant brand first)
- barber selection (single barber auto-selects)
- date / slot grid (shop hours + barber off days + blocks)
- confirm booking (LINE identity required in real LIFF)
- success UX copy / next steps
- staff booking-on-behalf identity keys (owner/barber vs customer)

## How to get to it (user POV)

Open `/{shopSlug}` (local demo: `/phinxstudio`). Choose barber → date → time → confirm. In LINE, the same URL is opened via LIFF (`NEXT_PUBLIC_LIFF_ID`).

## Verifying with repo commands

```bash
npm run test:booking
npm run test:shop          # slot hours / board related
npx next typegen && npm run typecheck
```

Manual / browser when UI changes:

```bash
npm run dev
# open http://localhost:3000/phinxstudio
# book a slot in memory-store mode; confirm success screen
```

## Gotchas

- Closed shop days and barber off days disable dates (`customer-flow.ts`).
- `SLOT_TAKEN` / `SLOT_BLOCKED` map to i18n keys — assert copy, not English-only strings.
- Prefer shop-scoped `POST /api/[shop]/bookings` over legacy `/api/bookings`.
