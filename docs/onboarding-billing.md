# Onboarding & billing

Self-serve 30-day trial, subscription expiry, PromptPay + slip verification.

## Migrations (Tommy runs on QA then prod)

- `supabase/migrations/0043_onboarding_billing.sql`
  - `shops.status` includes `trialing`
  - `trial_leads.shop_id`
  - `shop_payments` + unique `trans_ref`
  - `shop_subscription_reminders`
  - private Storage bucket `payment-slips`
  - RPC updates: `create_shop_invite`, `create_shop_with_owner` (days + status), `extend_shop_subscription_one_month`

## Env vars

| Var | Required | Purpose |
|-----|----------|---------|
| `PROMPTPAY_ID` | for billing | Receiver PromptPay (phone or national ID) |
| `SLIP_VERIFIER` | no (default `mock`) | `mock` \| `slipok` \| `easyslip` |
| `SLIPOK_API_KEY` | if slipok | SlipOK API key |
| `SLIPOK_BRANCH_ID` | optional | SlipOK branch |
| `EASYSLIP_API_KEY` | if easyslip | EasySlip API key |
| `OPERATOR_LINE_USER_ID` | for ops alerts | Tommy’s LINE user id |
| `CLIPPERQ_LINE_CHANNEL_ACCESS_TOKEN` | for ops alerts | ClipperQ OA push token (else `LINE_CHANNEL_ACCESS_TOKEN`) |

Missing operator/PromptPay env → safe no-op / billing QR unavailable (no crash).

## Tommy setup checklist

1. Run migration `0043` on QA, then prod.
2. Create SlipOK or EasySlip account; set API key + `SLIP_VERIFIER`.
3. Set `PROMPTPAY_ID` to the business PromptPay id used on slips.
4. Set `OPERATOR_LINE_USER_ID` (LINE user id from Tommy’s profile) and ClipperQ OA token.
5. Confirm Vercel cron `/api/cron/reminders` still has `CRON_SECRET` (now also sends 7/3/0-day expiry reminders).

## Surfaces

- Self-serve: `/start-trial` → LINE login → shop `trialing` → `/{shop}/admin/setup`
- Fallback lead: `/trial` (still CRM) + superadmin “Create shop from lead”
- Owner renew: `/{shop}/admin/billing`
- Superadmin payment review: `GET/PATCH /api/superadmin/payments`
