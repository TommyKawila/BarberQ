# Manager invite / claim

Shop managers invited by owner; claim via LINE.

## Sub-features

- invite create / cancel / regenerate under `/api/[shop]/managers/…`
- claim at `/manager/join`
- settings managers UI
- manager vs owner identity rules

## How to get to it (user POV)

Owner → Settings → Managers → invite link → manager opens `/manager/join` → LINE claim.

## Verifying with repo commands

```bash
npm run test:security      # manager-invite, manager-claim-state, manager-owner-identity
npx next typegen && npm run typecheck
```

Requires migration `0025_shop_managers` on QA/prod DBs (`qa:verify` checks manager schema).

## Gotchas

- Managers must not escalate to owner or cross shops.
- Regenerating invites invalidates old tokens — cover cancel vs regenerate paths in tests.
