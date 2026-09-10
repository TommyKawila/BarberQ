BARBERQX — README FOR CURSOR
=============================

Purpose
-------
This repository includes an approved BarberQx brand guide and logo asset set.

Before making ANY branding, UI, layout, navigation, marketing, customer-facing,
or admin-facing visual changes, Cursor must read:

  /docs/BRAND.md

Treat /docs/BRAND.md as the source of truth for:
- BarberQx brand hierarchy
- merchant/shop vs platform branding
- logo selection
- dark/light logo usage
- app icon usage
- compact mark usage
- customer booking branding
- admin/product shell branding
- sales/marketing page branding
- color tokens
- sizing and spacing
- accessibility
- responsive behavior
- prohibited logo treatments


APPROVED ASSET LOCATION
-----------------------

  /public/brand/barberqx/

Approved files:

  app-icon-dark.png
  app-icon-light.png
  logo-horizontal-dark.png
  logo-horizontal-light.png
  mark-gold.png
  mark-white.png


CRITICAL BRAND HIERARCHY
------------------------

1. BarberQx Sales / Marketing pages
   BarberQx is the PRIMARY brand.

2. Customer booking / shop public pages
   The SHOP / MERCHANT is the PRIMARY brand.
   BarberQx must appear only as a subtle platform signature.

3. Admin / Owner / Staff pages
   BarberQx is the product-shell brand,
   but the current shop context must remain clearly visible.

Do not make BarberQx larger or more visually dominant than the merchant identity
on shop-facing customer pages.


DEFAULT ASSET RULES
-------------------

Marketing page on dark background:
  /brand/barberqx/logo-horizontal-dark.png

Marketing page on light background:
  /brand/barberqx/logo-horizontal-light.png

App / PWA / launcher / social icon:
  /brand/barberqx/app-icon-dark.png
  or
  /brand/barberqx/app-icon-light.png

Compact brand tile / decorative brand mark:
  /brand/barberqx/mark-gold.png
  or
  /brand/barberqx/mark-white.png

Customer booking/public shop page:
  Do NOT automatically use the full horizontal logo.
  Prefer a subtle platform signature such as:

    Powered by BarberQx

  or Thai:

    ระบบจองคิวโดย BarberQx


IMPLEMENTATION RULE
-------------------

Do not scatter hard-coded logo paths across components.

Prefer centralized brand components, for example:

  <BarberQxLogo surface="dark" />
  <BarberQxLogo surface="light" />
  <BarberQxPlatformSignature />
  <BarberQxAppIcon surface="dark" />

Also prefer one centralized asset mapping module such as:

  export const BARBERQX_BRAND = {
    logoDark: "/brand/barberqx/logo-horizontal-dark.png",
    logoLight: "/brand/barberqx/logo-horizontal-light.png",
    appIconDark: "/brand/barberqx/app-icon-dark.png",
    appIconLight: "/brand/barberqx/app-icon-light.png",
    markGold: "/brand/barberqx/mark-gold.png",
    markWhite: "/brand/barberqx/mark-white.png",
  } as const;


DO NOT
------

Do not:
- invent new BarberQx logo variants
- redraw the logo in code
- recolor logo PNGs with CSS filters
- distort or stretch the logo
- rotate the logo
- add glow, bevel, outline, shadow, or extra gradients to the logo
- recreate the wordmark using arbitrary fonts
- use app icons as normal navbar logos
- use multiple BarberQx logos on one mobile screen
- place BarberQx at equal visual weight with a shop logo/name on customer pages
- replace a merchant's own branding with BarberQx branding
- change auth, booking logic, routes, APIs, database, permissions, or tenant isolation
  as part of a branding-only task


CURSOR WORKFLOW
---------------

For any new BarberQx UI / branding task:

STEP 1
Read /docs/BRAND.md completely.

STEP 2
Inspect the current implementation before editing:
- shared layout/shell
- existing logo references
- current shop branding
- theme tokens
- mobile responsive behavior
- role-based rendering where relevant

STEP 3
Report a short implementation plan before editing if the change affects:
- global branding
- customer booking header
- admin shell
- navigation
- sales/marketing page
- shared layout

STEP 4
Implement using approved brand assets and centralized components.

STEP 5
Verify:
- 375px
- 390px
- 430px
- desktop
- dark/light surface where applicable
- no horizontal overflow
- correct logo hierarchy
- no merchant branding regression
- accessibility labels
- typecheck/build/tests

STEP 6
Report:
- inspected files
- changed files
- logo asset(s) used
- brand component(s) created/reused
- customer vs admin vs marketing behavior
- responsive verification
- tests/typecheck/build result


FIRST AUDIT PROMPT
------------------

Use this prompt when onboarding Cursor to the brand system:

Read /docs/BRAND.md completely before making any brand or UI changes.

Treat /docs/BRAND.md as the source of truth for:
- BarberQx brand hierarchy
- logo selection
- dark/light logo usage
- app icon usage
- merchant vs platform branding
- customer booking branding
- admin branding
- marketing/sales page branding
- sizing, spacing and accessibility rules

The approved assets are in:

/public/brand/barberqx/

Do not generate, redraw, recolor, distort, or invent new BarberQx logo variants.

Before implementing, inspect the current branding/logo usage in the codebase and report:
1. where BarberQx branding currently appears
2. any duplicated/hardcoded logo references
3. any placements that conflict with BRAND.md
4. proposed centralized brand components

Do not change auth, booking logic, APIs, routes, database, or merchant branding.

STOP after the audit and proposed implementation plan.


FINAL PRINCIPLE
---------------

When uncertain:

Marketing website:
  BarberQx is primary.

Customer shop booking:
  Shop branding is primary; BarberQx is subtle.

Admin/product shell:
  BarberQx is the platform shell; shop context remains visible.

App/PWA:
  Use the approved app icon.

Always follow /docs/BRAND.md.
