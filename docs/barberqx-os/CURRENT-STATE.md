# Current state

**Last updated:** 2026-09-15

**Phase:** Pre-Pilot / Pilot Readiness

This is an operational snapshot, not a second README. Runbook and stack: [`../../README.md`](../../README.md).

## Current goals

**Business:** Acquire first qualified Pilot shops and validate whether BarberQx creates enough value to convert to 599 THB/month paid usage. (599 is [HYP-004](./02-CUSTOMER-INSIGHTS.md), not validated pricing truth.)

**Product:** Make the core booking experience reliable and simple enough for real barbershops and customers to use with minimal handholding.

**Marketing:** Complete conversion-ready Sales Page and prepare founder-led customer acquisition.

**Sales strategy:** Founder-led sales before scaling paid acquisition.

## Current validation targets

These are targets, not measured results.

- Owner setup <=15 minutes
- First customer booking <=60 seconds
- approximately 5 initial Pilot shops
- 3–4 continuing at 599 THB/month = strong early signal, **not** full PMF

## Known product truth

**Scheduled pre-appointment reminders are NOT currently implemented.** Do not claim them. [HYP-005](./02-CUSTOMER-INSIGHTS.md) is a hypothesis only.

## What exists (inventory)

Status: **`0.1.0`, private.** Local prototype mode (memory store / LINE mock) is for development only.

- **Customer:** book at `/{shopSlug}` (barber, date, time, confirm); view/cancel at `/{shopSlug}/bookings`; LINE Login; shop cover/name; optional barber photos.
- **Owner:** today board, team, stats; schedule, settings, customer booking; shop name/cover/logo/LINE/phone/hours; claim via `/owner/join`; setup / LINE OA help under `/{shopSlug}/admin/setup`.
- **Barber:** today board, own schedule, customer booking.
- **Platform:** `/superadmin` (invites, LINE OA requests, trial leads); `/pilot`; marketing sales page + `/trial`.

Staff-assisted booking may still exist when operationally useful.

## Architecture (where it lives)

- App: Next.js 16 App Router, React 19, TypeScript, Tailwind 4.
- Identity: LINE LIFF.
- Data: Supabase in production; in-memory store when Supabase env is unset.
- Tenancy: shop-scoped routes and APIs. Details in repo README, not here.

## Known strategic risks

- differentiation beyond generic LINE booking
- willingness to pay remains unvalidated
- feature creep before Pilot evidence
- over-polishing before real usage

## Current priority

Evidence from real barber shops is more valuable than adding non-critical features.

Roadmap: [03-PRODUCT-ROADMAP.md](./03-PRODUCT-ROADMAP.md). Decisions: [04-PRODUCT-DECISIONS.md](./04-PRODUCT-DECISIONS.md). Brand tokens: [`../BRAND.md`](../BRAND.md).
