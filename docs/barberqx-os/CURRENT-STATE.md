# Current state

**Last updated:** 2026-10-21

**Phase:** Pre-Pilot / Pilot Readiness (+ self-serve trial & billing)

This is an operational snapshot, not a second README. Runbook and stack: [`../../README.md`](../../README.md). Billing ops: [`../onboarding-billing.md`](../onboarding-billing.md).

## Current goals

**Business:** Acquire Pilot shops and validate conversion to paid usage (tiered PromptPay pricing by barber count).

**Product:** Reliable booking + automatic trial → setup → renew loop with minimal operator handholding.

**Marketing:** Self-serve 30-day trial (`/start-trial`) primary; `/trial` lead form remains as assisted fallback.

**Sales strategy:** Founder-led sales still important for >10-barber / ambiguous cases; operator LINE alerts on trial & payments.

## Current validation targets

These are targets, not measured results.

- Owner setup <=15 minutes (self-serve trial → setup wizard)
- First customer booking <=60 seconds
- approximately 5 initial Pilot shops
- Tiered monthly pricing: 1–2 ฿399 · 3–5 ฿599 · 6–10 ฿999 · >10 contact

## Known product truth

- **Self-serve 30-day trial** creates shop (`status=trialing`, `subscribed_until=now+30d`), links owner LINE, and lands in `/{shop}/admin/setup`. Abuse: one trial per LINE user + rate limit.
- `/trial` remains an application form; when a shop is created from a lead (or self-serve), `trial_leads.shop_id` is set.
- Plan state is computed from `subscribed_until` (+ 3-day grace). Expired shops: admin shows renew screen; customer booking shows a polite pause message. Data is never deleted.
- Billing: PromptPay QR + slip upload; automatic verification via pluggable SlipVerifier (`mock` / SlipOK / EasySlip). Failures → `pending_review` for superadmin.
- Operator LINE push (Tommy) on trial/shop create and payment events when `OPERATOR_LINE_USER_ID` + OA token are set.
- Daily cron (`/api/cron/reminders`) also sends subscription reminders at 7 / 3 / 0 days before expiry.
- Customers enter booking from the shop's own LINE OA; ClipperQ/BarberQx is the booking platform ([PD-010](./04-PRODUCT-DECISIONS.md#pd-010)).
- Reminder pushes for appointments **are** implemented (see cron); do not claim no-show automation.

## What exists (inventory)

Status: **`0.1.0`, private.** Local prototype mode (memory store / LINE mock) is for development only.

- **Customer:** book at `/{shopSlug}`; expired subscription → polite “not accepting bookings” message.
- **Owner:** board, team, stats, settings, **billing**; claim via `/owner/join` or self-serve `/start-trial`; setup under `/{shopSlug}/admin/setup`.
- **Barber:** today board, own schedule, customer booking.
- **Platform:** `/superadmin` (Quick Add with 30-day option, create-from-lead prefill, invite copy, payment review API); `/pilot`; marketing + `/trial` + `/start-trial`.

## Locked alignment baseline

[SPR-001 — Pilot Truth & Positioning Alignment](./sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) remains the acquisition-copy baseline where still applicable. Self-serve trial is an intentional product evolution beyond assisted-only PD-009 — document env + migration in [`../onboarding-billing.md`](../onboarding-billing.md).

## Architecture (where it lives)

- App: Next.js 16 App Router, React 19, TypeScript, Tailwind 4.
- Identity: LINE LIFF.
- Data: Supabase in production; in-memory store when Supabase env is unset.
- Billing: `src/lib/billing/*`, migration `0043_onboarding_billing.sql`.
- Tenancy: shop-scoped routes and APIs.

## Current priority

Ship self-serve trial + PromptPay renew on QA with mock slip verifier; Tommy configures real slip API + PromptPay + operator LINE before prod.

Roadmap: [03-PRODUCT-ROADMAP.md](./03-PRODUCT-ROADMAP.md). Decisions: [04-PRODUCT-DECISIONS.md](./04-PRODUCT-DECISIONS.md). Brand tokens: [`../BRAND.md`](../BRAND.md).
