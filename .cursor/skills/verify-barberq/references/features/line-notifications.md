# LINE push notifications

Optional Messaging API push after booking events.

## Sub-features

- `pushText` in `src/lib/line/push-message.ts`
- skip when `LINE_CHANNEL_ACCESS_TOKEN` missing (log, do not throw)
- booking must succeed even if push fails
- pilot checklist items for push / Add Friend

## How to get to it (user POV)

Customer adds the shop LINE OA, books a slot; receives a push when token + friendship are present.

## Verifying with repo commands

```bash
npm run test:security      # env-hardening covers missing push token
```

With QA Messaging token only (never production):

1. Book as a LINE user who has added the QA OA.
2. Confirm push arrives **or** booking still persists if push fails.
3. Check `/pilot` checklist section for push GO/NO-GO items.

## Gotchas

- Missing token → `pushText` returns false / skips; must not crash APIs.
- Do not fail the booking transaction because push failed.
