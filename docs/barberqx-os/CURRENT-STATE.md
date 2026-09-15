# Current state

**Last updated:** 2026-09-16

**Phase:** Pre-Pilot / Pilot Readiness

This is an operational snapshot, not a second README. Runbook and stack: [`../../README.md`](../../README.md).

## Current goals

**Business:** Acquire first qualified Pilot shops and validate whether BarberQx creates enough value to convert to 599 THB/month paid usage. (599 is [HYP-004](./02-CUSTOMER-INSIGHTS.md), not validated pricing truth.)

**Product:** Make the core booking experience reliable and simple enough for real barbershops and customers to use with minimal handholding.

**Marketing:** Use the aligned Assisted 30-Day Pilot acquisition flow and prepare founder-led customer acquisition.

**Sales strategy:** Founder-led sales before scaling paid acquisition.

## Current validation targets

These are targets, not measured results.

- Owner setup <=15 minutes
- First customer booking <=60 seconds
- approximately 5 initial Pilot shops
- 3–4 continuing at 599 THB/month = strong early signal, **not** full PMF

## Known product truth

- Initial acquisition is an **Assisted 30-Day Pilot**, not an open self-service Free Trial ([PD-009](./04-PRODUCT-DECISIONS.md#pd-009)).
- Customers enter booking from the shop's own LINE OA; BarberQx is the booking platform and shop identity remains primary ([PD-010](./04-PRODUCT-DECISIONS.md#pd-010)).
- Deployed LINE sender identity is not verified from repository/config alone. Customer Add Friend / extra LINE messaging copy therefore uses the approved **sender-neutral** representation; it does not claim BarberQx or the shop OA is the sender.
- **Scheduled pre-appointment reminders are NOT currently implemented.** Do not claim them. [HYP-005](./02-CUSTOMER-INSIGHTS.md) is a hypothesis only.
- “Up to 10 barbers” remains an unvalidated commercial/package hypothesis and is not a public product promise ([PD-011](./04-PRODUCT-DECISIONS.md#pd-011)).

## What exists (inventory)

Status: **`0.1.0`, private.** Local prototype mode (memory store / LINE mock) is for development only.

- **Customer:** book at `/{shopSlug}` (barber, date, time, confirm); view/cancel at `/{shopSlug}/bookings`; LINE Login; shop cover/name; optional barber photos; optional sender-neutral LINE Add Friend prompt where configured.
- **Owner:** today board, team, stats; schedule, settings, customer booking; shop name/cover/logo/LINE/phone/hours; claim via `/owner/join`; setup / LINE OA help under `/{shopSlug}/admin/setup`.
- **Barber:** today board, own schedule, customer booking.
- **Platform:** `/superadmin` (invites, LINE OA requests, Pilot Applications visible terminology over the existing trial-lead workflow); `/pilot`; marketing Sales Page + `/trial` Pilot application.

Staff-assisted booking may still exist when operationally useful.

## Locked alignment baseline

[SPR-001 — Pilot Truth & Positioning Alignment](./sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) is **LOCKED** after QA PASS.

The locked result includes:

- Assisted 30-Day Pilot framing across scoped acquisition surfaces;
- `/trial` as application → contact/qualification → assisted setup, not instant self-service activation;
- 599 THB/month/shop framed as the working post-Pilot continuation price to validate;
- no public 10-barber package promise;
- no unsupported adoption/social-proof claim on the scoped path;
- sender-neutral LINE fallback while sender identity remains unverified;
- no reminder/no-show claims;
- unchanged booking/auth/LIFF/tenant/concurrency/security boundaries and unchanged CTA destinations.

Engineering report: [`reports/RPT-001-ENG.md`](./reports/RPT-001-ENG.md). QA report: [`reports/RPT-001-QA.md`](./reports/RPT-001-QA.md).

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
- deployed global LINE sender identity remains unverified; do not infer or claim sender identity without explicit verification/Product review

## Current priority

Evidence from real barber shops is more valuable than adding non-critical features.

Roadmap: [03-PRODUCT-ROADMAP.md](./03-PRODUCT-ROADMAP.md). Decisions: [04-PRODUCT-DECISIONS.md](./04-PRODUCT-DECISIONS.md). Brand tokens: [`../BRAND.md`](../BRAND.md).
