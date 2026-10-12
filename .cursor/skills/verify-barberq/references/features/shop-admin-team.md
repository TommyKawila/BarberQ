# Shop admin — team / barbers

Manage barbers: add, edit, deactivate, photos, breaks.

## Sub-features

- team list `/{shopSlug}/admin/staff`
- barber detail `/{shopSlug}/admin/staff/[id]`
- profile image upload (owner-authorized API)
- recurring breaks / off days
- remove / deactivate / reactivate

## How to get to it (user POV)

Owner → Team. Edit name/photo/bookable flags; set breaks; deactivate carefully.

## Verifying with repo commands

```bash
npm run test:shop
npm run test:security      # remove-barber, barber-edit, unlink-line
npm run test:onboarding    # setup team UX
npx next typegen && npm run typecheck
```

## Gotchas

- Uploads: public-read buckets, server-side write only.
- Unlinking LINE from a barber is a privileged / superadmin-sensitive path — cover with `test:security`.
