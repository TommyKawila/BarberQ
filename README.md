# BarberQx

Booking platform for barber shops. Thai pronunciation: **บาร์เบอร์ควิกซ์**.

BarberQx is the platform, not the shop. On customer pages the merchant brand comes first; BarberQx stays a small platform signature. Brand rules live in [`docs/BRAND.md`](docs/BRAND.md). Cursor/agent brand workflow lives in [`README_FOR_CURSOR.txt`](README_FOR_CURSOR.txt).

Deeper write-ups (architecture, security, pilot) should go under `/docs` later — this README is the map, not the full spec.

## Product

Customers book from the shop’s LINE OA using BarberQx LIFF. Owners get a queue board, team, hours, and shop settings without building their own booking system.

Each shop is a tenant at `/{shopSlug}` (example seed shop: `/phinxstudio`).

### Customers

- Book at `/{shopSlug}`: barber, date, time, confirm
- View / cancel at `/{shopSlug}/bookings`
- LINE Login required
- Shop cover, shop name, and (optional) barber photos on the booking page

### Owners / staff

- **Owner:** today board, team, stats; More → schedule, settings, customer booking
- **Barber:** today board, own schedule; More → customer booking
- Settings: shop name, cover image, logo, LINE/phone, hours
- Claim shop via invite at `/owner/join`
- Setup / LINE OA install help under `/{shopSlug}/admin/setup`

Platform ops: `/superadmin` (shop invites, LINE OA requests) and `/pilot` (production pilot checklist).

## Stack (this repo)

- Next.js 16 App Router, React 19, TypeScript
- Tailwind CSS 4
- LINE LIFF (`@line/liff`)
- Supabase JS (Postgres + Storage in production)
- In-memory store in local prototype mode when Supabase env is unset
- date-fns / date-fns-tz, lucide-react

## Layout

```
src/app/            routes + API (`/[shop]`, `/admin` re-exports, `/api`)
src/components/     customer, admin, layout, superadmin
src/lib/            booking, auth, shop, data (memory + supabase)
src/types/          shared types
supabase/migrations SQL + Storage buckets
docs/BRAND.md       brand system
public/brand/       approved BarberQx assets
```

Shop-scoped APIs: `/api/[shop]/…`. Legacy unscoped `/api/bookings` etc. still exist; prefer shop-scoped routes.

## Develop

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Copy env from [`.env.example`](.env.example).

Without `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, the app uses the memory store (prototype). Production requires those plus `NEXT_PUBLIC_LIFF_ID`, `NEXT_PUBLIC_APP_URL`, and `SUPERADMIN_TOKEN`.

```bash
npm run lint
npm run typecheck
npm run test:shop
npm run test:booking
npm run test:security
npm run test:onboarding
npm run build
npm run start
```

## Security / tenancy (high level)

- Data and admin actions are shop-scoped. Staff from shop A cannot manage shop B.
- Customer identity is LINE. Owner/barber roles are shop staff records, not a platform `super_admin` role on the shop.
- Super Admin is a separate token (`SUPERADMIN_TOKEN`), not a shop owner.
- Uploads (cover / barber photos) go through owner-authorized APIs; buckets are public-read, writes are server-side.
- Do not leak shop IDs, tokens, or another shop’s bookings across tenants.

## Status

`0.1.0`, private. Product is in **pilot / beta**: real shops can be invited from Super Admin and exercised via `/pilot`. Local prototype mode is for development only; production must not use the memory store or LINE mock auth.
