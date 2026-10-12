# Shop admin — settings / hours / cover

Shop name, cover, logo, LINE/phone, hours.

## Sub-features

- settings page `/{shopSlug}/admin/settings`
- shop hours (Bangkok weekdays)
- cover image
- managers subsection `…/settings/managers`
- setup help `/{shopSlug}/admin/setup` (+ LINE support)

## How to get to it (user POV)

Owner → More → Settings / Setup. Update hours and cover; save; reopen customer booking and confirm hours/cover reflect.

## Verifying with repo commands

```bash
npm run test:shop          # shop-cover-image, slot-hours, shop-setup
npm run test:onboarding    # setup-hours, setup-link UX
npx next typegen && npm run typecheck
```

## Gotchas

- Hours closed flags disable customer dates.
- Brand on customer page stays merchant-first after cover change.
