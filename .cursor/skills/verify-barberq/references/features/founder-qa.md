# Founder QA environment

Dedicated QA Supabase + LIFF + Vercel; fixture shop `barberqpilottest`.

## Sub-features

- `npm run qa:verify` / `qa:reset` / `qa:reset:owner-claim`
- manifest `src/lib/founder-qa/manifest.ts`
- bootstrap SQL `supabase/founder-qa/bootstrap.sql`
- Thai setup guide `docs/qa-setup.md`

## How to get to it (user POV)

Follow `docs/qa-setup.md`: separate Supabase project, migrations, bootstrap, QA env vars with `BARBERQ_ENV=founder_qa`.

## Verifying with repo commands

```bash
npm run test:security      # founder-qa verify/reset unit tests always
# On a provisioned founder_qa machine only:
BARBERQ_ENV=founder_qa npm run qa:verify
```

## Gotchas

- Manifest `qaSupabaseProjectRef` may still be `unprovisioned-founder-qa` until Tommy wires the real QA project — `qa:verify` will fail until provisioned; unit tests still cover evaluateVerify.
- Never run reset against production denylist hosts/refs.
