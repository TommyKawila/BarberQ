# Super Admin / pilot platform

Platform ops outside shop tenancy.

## Sub-features

- `/superadmin` shop invites, barber unlink LINE, LINE OA support requests
- trial leads CRM `/superadmin/trial-leads`
- `/pilot` production pilot checklist
- auth via `SUPERADMIN_TOKEN` (not shop staff)

## How to get to it (user POV)

Open `/superadmin` with the platform token. Invite a shop; manage trial leads; run `/pilot` checklist during go-live.

## Verifying with repo commands

```bash
npm run test:security      # unlink-line, trial-crm, auth-security
npx next typegen && npm run typecheck
NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=placeholder-anon-key \
SUPABASE_SERVICE_ROLE_KEY=placeholder-service-role-key \
NEXT_PUBLIC_LIFF_ID=0000000000-placeholder \
NEXT_PUBLIC_APP_URL=https://example.com \
SUPERADMIN_TOKEN=ci-placeholder-superadmin-token \
npm run build
```

## Gotchas

- Super Admin is separate from shop owner — do not conflate roles in proofs.
- Placeholder token is for build only; real QA uses env on Vercel, never committed.
