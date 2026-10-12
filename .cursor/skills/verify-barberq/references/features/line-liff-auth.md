# LINE LIFF / login

Customer and staff LINE identity via LIFF; mock/local paths for prototype.

## Sub-features

- LIFF init (`@line/liff`, `NEXT_PUBLIC_LIFF_ID`)
- customer auth headers / LINE verify
- admin LINE auth hooks (`use-admin-line-auth`, `use-line-auth`)
- LIFF return URL helpers (`liff-url.ts`, `liff-return.ts`)
- in-app browser handling

## How to get to it (user POV)

Open the shop booking or admin login URL inside LINE (LIFF). Outside LINE, prototype mode may mock identity when Supabase/LIFF are unset — production must not.

## Verifying with repo commands

```bash
npm run test:security
npm run test:onboarding
npx next typegen && npm run typecheck
```

Env doctor (no secrets in output): confirm `.env.example` keys `NEXT_PUBLIC_LIFF_ID`, `NEXT_PUBLIC_APP_URL` are documented for real LIFF.

Manual: on QA LIFF, open booking URL → identity resolves → booking succeeds.

## Gotchas

- Never commit real LIFF IDs as "proof" with production tokens.
- Admin login lives at `/{shopSlug}/admin/login` (plus legacy `/admin/login` re-exports).
