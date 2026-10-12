# Owner claim / onboarding / LINE OA setup

Invite claim, activation, setup wizard.

## Sub-features

- owner join `/owner/join` (+ tokenized `/c/[token]`, `/a/[token]` where used)
- claim APIs under `/api/owner/…`
- setup team / hours / link UX
- LINE OA install help under `/{shopSlug}/admin/setup`
- activation gates before shop is "ready"

## How to get to it (user POV)

Super Admin creates shop invite → owner opens invite link → LINE login → claim → setup team/hours → customer booking link works.

## Verifying with repo commands

```bash
npm run test:onboarding
npm run test:security      # owner claim / invite-session / regenerate-invite
npm run qa:reset:owner-claim   # founder_qa only
npm run qa:verify
```

## Gotchas

- `qa:reset*` is destructive and guarded to `BARBERQ_ENV=founder_qa`.
- Production denylist in `FOUNDER_QA_MANIFEST` must stay intact.
