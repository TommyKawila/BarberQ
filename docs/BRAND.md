# ClipperQ Brand System

> **Status:** Approved working brand guide for product, website, sales page, customer booking UI, admin UI, and app surfaces.  
> **Brand name:** `ClipperQ`  
> **Thai pronunciation:** `คลิปเปอร์คิว`

---

## 1. Brand role

ClipperQ is a **booking platform for barber shops**, not the barber shop itself.

This creates two different brand hierarchies:

### A. ClipperQ marketing surfaces
Examples:
- Sales page
- Landing page
- Pricing page
- Product marketing
- Social marketing
- App/PWA install surface

**ClipperQ is the primary brand.**

### B. Merchant / shop customer surfaces
Examples:
- `/{shopSlug}` booking page
- Customer booking confirmation
- Customer "My bookings"
- Shop-specific public pages

**The shop is the primary brand. ClipperQ is a subtle platform signature.**

Never let ClipperQ visually compete with a merchant's shop name, shop logo, cover photo, or booking hero.

---

## 2. Brand character

The visual direction is:

**Premium / Modern / Confident / Masculine / Simple / Slightly Hipster / Technology-first**

ClipperQ should feel connected to modern barber culture without looking like a traditional barbershop logo.

Avoid:
- obvious scissors as the main logo device
- barber pole clichés
- vintage badge overload
- overly ornate "luxury" styling
- robot / AI visuals
- neon cyberpunk styling
- generic SaaS blue

The brand should feel like a modern operating tool built specifically for barbers.

---

## 3. Core visual palette

Use these as the digital UI tokens unless the existing product token system already defines an equivalent.

```css
--barberqx-gold: #F4B740;
--barberqx-black: #0B0B0B;
--barberqx-surface: #18181B;
--barberqx-surface-2: #27272A;
--barberqx-white: #F5F5F5;
--barberqx-muted: #A1A1AA;
--barberqx-border: #2A2A2A;
```

### Color behavior

**Gold**
- Primary ClipperQ brand accent
- CTA emphasis on ClipperQ marketing surfaces
- active states
- selected states
- small brand highlights

Do not flood entire pages with gold.

**Black / charcoal**
- primary brand background
- premium dark product surfaces
- admin/product shell

**White / muted gray**
- typography and secondary information

### Important UI rule

The supplied logo artwork contains gold gradients.

Do **not** sample random gradient pixels from the PNG files for UI components.

Use the flat digital token `#F4B740` for buttons, links, focus states, borders, and UI controls unless an existing product token is already established.

---

## 4. Logo asset inventory

Store all supplied assets here:

```text
/public/brand/barberqx/
```

### `logo-horizontal-dark.png`

**Purpose:** Primary horizontal logo for dark surfaces.

Use on:
- dark Sales Page navbar
- dark marketing hero
- dark website footer
- ClipperQ-owned dark marketing pages

Do not use:
- inside small mobile cards
- as an app icon
- beside a shop logo at equal visual weight

---

### `logo-horizontal-light.png`

**Purpose:** Primary horizontal logo for light surfaces.

Use on:
- light marketing sections
- printable/light digital layouts
- white navigation or presentation surfaces

Do not place on a dark background.

---

### `app-icon-dark.png`

**Purpose:** App/PWA/social icon with dark treatment.

Use for:
- PWA icon
- install prompt
- launcher/app preview
- social profile image when dark treatment is preferred
- branded loading/splash experience when a full icon tile is appropriate

Do not use as a normal navbar logo.

---

### `app-icon-light.png`

**Purpose:** App/PWA/social icon with light treatment.

Use for:
- light install surfaces
- light app-icon presentation
- alternate social/profile treatment

Do not use as a normal navbar logo.

---

### `mark-gold.png`

**Current asset form:** Compact ClipperQ symbol presented inside a dark rounded tile.

Use for:
- compact brand tile
- feature artwork
- marketing cards
- social/brand presentation
- situations where the square tile itself is desired

Do not treat this current PNG as a transparent standalone mark.

Do not use it beside every heading.

---

### `mark-white.png`

**Current asset form:** Compact ClipperQ symbol presented inside a light rounded tile.

Use for:
- light compact brand tile
- light marketing card
- alternate brand presentation

Do not treat this current PNG as a transparent standalone mark.

---

## 5. Logo hierarchy by product surface

### 5.1 Sales Page / Marketing Website

**Brand priority:**
1. ClipperQ
2. Product benefit / headline
3. Supporting visuals

Navbar:
- use `logo-horizontal-dark.png` on dark background
- target visual logo height: `28–34px` desktop
- target visual logo height: `24–28px` mobile

Hero:
- the horizontal logo may appear in the navbar only
- do not repeat a large logo inside the hero unless the design specifically needs it
- hero headline and product outcome should remain more important than decorative branding

Footer:
- horizontal logo allowed
- can be slightly quieter than navbar

---

### 5.2 Customer Booking Page

**Brand priority:**
1. Shop name / shop cover / merchant identity
2. Booking task
3. ClipperQ platform signature

ClipperQ must be subtle.

Preferred pattern:

```text
[small ClipperQ mark]  Powered by ClipperQ
-------------------------------------------
[SHOP COVER]
Shop Name
Booking flow
```

or:

```text
[shop/app header]
...
Powered by ClipperQ
```

Rules:
- only one ClipperQ signature per page
- do not use the full horizontal logo at the same visual size as the shop name
- do not place ClipperQ in the center of the merchant hero
- do not overlay a large ClipperQ logo on the merchant cover image
- platform signature should be visually secondary

Recommended:
- icon/mark visual size: `14–18px`
- supporting text: `10–11px`
- muted opacity / muted zinc text
- minimum tap target only if the signature is interactive

Suggested copy:
- `Powered by ClipperQ`
- Thai UI may use `ระบบจองคิวโดย ClipperQ`

Do not show both phrases at once.

---

### 5.3 Customer "My bookings" / confirmation pages

Use the same hierarchy as the booking page.

The customer's current booking information is more important than ClipperQ branding.

ClipperQ may appear:
- in the shared customer top shell
- or once in the footer/signature area

Never both.

---

### 5.4 Owner / Admin / Staff application

These are ClipperQ product surfaces, but the current shop context still matters.

**Brand priority:**
1. Current operational task / page title
2. Shop context
3. ClipperQ product shell branding

Recommended top header:

```text
[small ClipperQ mark] ClipperQ
Shop: {shopName}                    [TH] [EN]
```

Alternative if the current shell already shows the shop name strongly:

```text
{shopName}
by ClipperQ
```

Rules:
- use a compact treatment
- no giant horizontal brand logo in every admin page
- keep the shared header consistent across all admin routes
- one platform brand instance per screen is enough

Recommended icon/mark size:
- `20–24px`

Recommended wordmark/text visual height:
- `12–14px`

---

### 5.5 Auth / onboarding / empty app state

When no merchant identity is the primary subject, ClipperQ can become the main brand.

Allowed:
- `app-icon-dark.png`
- horizontal dark/light logo depending on surface

Examples:
- login
- invite entry
- generic loading
- system error
- platform onboarding before a shop has been established

---

## 6. Clear space

Never crowd the logo.

### Horizontal logo
Minimum clear space around the logo:
- at least the visual height of the `Qx` lowercase `x` on every side
- for UI implementation, use at least `12px` clear space on small mobile placements and `16–24px` on larger marketing placements

### Compact icon/tile
Use at least:
- `8px` clear space from unrelated icons/text
- `12px` from card edges when used as a prominent brand tile

Do not place the logo flush against a viewport edge.

---

## 7. Minimum sizes

### Horizontal logo
Recommended minimum:
- `120px` rendered width for a full logo
- below this width, prefer a compact product mark/tile rather than forcing the wordmark to become unreadable

### Compact mark / app icon
Recommended:
- `16px` only for platform signature/icon use
- `20–24px` admin header
- `32px+` for branded cards
- `48px+` for login/onboarding identity
- `180px+` source asset for Apple touch icon
- `192px / 512px` for PWA icon exports

---

## 8. Typography

Do not redesign the entire product typography merely to match the logo.

For product UI:
- keep the existing ClipperQ app font stack if already established
- prefer clean sans-serif UI typography
- prioritize Thai readability

Recommended direction:
- `Inter`, `Noto Sans Thai`, system sans-serif, or the existing project equivalent

Marketing typography may use heavier display weights, but should still feel modern rather than vintage.

Avoid script fonts for UI.

---

## 9. Image and hero styling

ClipperQ marketing photography should feel:
- real barbershop environment
- warm practical lighting
- dark wood / black / metal
- premium but not inaccessible
- working barber culture
- modern craft

Customer shop cover photos belong to the merchant and may have a completely different style.

Never force a merchant's cover photo into ClipperQ's black/gold marketing look.

ClipperQ should frame the merchant, not repaint the merchant.

---

## 10. Co-branding rule: ClipperQ + shop

This is critical.

### Correct

```text
TMY BARBER
[large shop identity]

Powered by ClipperQ
[small/subtle]
```

### Incorrect

```text
BARBERQX       TMY BARBER
same size      same size
```

ClipperQ must not make a customer feel that the merchant is merely a branch of ClipperQ.

---

## 11. UI implementation components

Do not scatter hard-coded `<img>` tags for brand assets across pages.

Create/reuse centralized components such as:

```tsx
<BarberQxLogo surface="dark" />
<BarberQxLogo surface="light" />
<BarberQxPlatformSignature />
<BarberQxAppIcon surface="dark" />
```

Suggested behavior:

### `BarberQxLogo`

```ts
type Props = {
  surface: "dark" | "light";
  className?: string;
  priority?: boolean;
};
```

Mapping:

```ts
dark  -> /brand/barberqx/logo-horizontal-dark.png
light -> /brand/barberqx/logo-horizontal-light.png
```

### `BarberQxAppIcon`

```ts
dark  -> /brand/barberqx/app-icon-dark.png
light -> /brand/barberqx/app-icon-light.png
```

### `BarberQxPlatformSignature`

Customer-facing default:

```text
Powered by ClipperQ
```

Must render visually smaller and quieter than the merchant brand.

---

## 12. Asset selection decision tree

Before selecting a ClipperQ asset, use this order:

### Is this a ClipperQ-owned marketing page?
Yes:
- dark surface -> horizontal dark logo
- light surface -> horizontal light logo

### Is this a customer shop booking/public page?
Yes:
- merchant brand remains dominant
- use only a small ClipperQ platform signature
- do not automatically use the full horizontal logo

### Is this an admin/product shell?
Yes:
- use compact ClipperQ header identity
- keep shop context visible

### Is this an OS/app/social icon?
Yes:
- use `app-icon-dark.png` or `app-icon-light.png`

### Is this a decorative/compact brand tile?
Yes:
- use `mark-gold.png` or `mark-white.png` only when its square/tile presentation is appropriate

---

## 13. Accessibility

Logo images must use meaningful `alt` text when they convey brand identity.

Recommended:

```tsx
alt="ClipperQ"
```

If the logo is next to visible text already reading `ClipperQ`, use:

```tsx
alt=""
aria-hidden="true"
```

Do not use logo artwork as a replacement for an accessible button label.

Ensure sufficient contrast for surrounding text and controls.

---

## 14. Responsive rules

### Mobile
- prefer compact branding
- prioritize merchant/task content
- never allow the logo to force horizontal scrolling
- horizontal logo width should be responsive
- use `object-contain`, never crop a logo

### Desktop
- full horizontal logo is preferred on ClipperQ marketing pages
- keep branding contained within nav/header grid
- do not upscale raster PNG beyond the point where it visibly softens

---

## 15. PNG limitations

The current approved assets are PNG files.

Rules:
- do not artificially upscale small raster assets
- use `object-fit: contain`
- preserve source aspect ratio
- never stretch
- do not recolor PNG logos with CSS filters
- do not add shadows, outlines, glow, bevels, or extra gradients to the logo

When production-quality SVG masters become available, prefer SVG for:
- website header
- marketing pages
- scalable print
- high-density UI

Do not auto-trace these PNGs into poor-quality SVG and call them approved masters.

---

## 16. Never do this

Do not:
- distort the logo
- rotate the logo
- recreate the logo using arbitrary fonts
- change `ClipperQ` letterforms or spacing inside the official wordmark artwork
- recolor the `Q` mark to unrelated accent colors
- put the logo over a busy image without readable separation
- use both dark and light variants on the same surface
- use app icons as navbar logos
- use multiple ClipperQ logos on one mobile screen
- make ClipperQ larger than the merchant identity on merchant-facing pages
- add barber-shop clichés around the master logo
- create unapproved new logo variants during ordinary UI implementation

---

## 17. Cursor / AI coding instruction

When implementing UI, follow this guide before choosing a ClipperQ asset.

**Do not choose a logo based only on filename. Determine the page's brand hierarchy first.**

Rules:

1. On ClipperQ Sales/Marketing pages, ClipperQ is the primary brand.
2. On shop customer/public pages, the merchant is the primary brand.
3. On admin pages, ClipperQ is the product shell and the current shop remains visible context.
4. Reuse centralized brand components instead of hardcoding asset paths repeatedly.
5. Never generate a new logo automatically.
6. Never change logo colors, proportions, or typography in code.
7. Preserve the user's current shop branding.
8. If an intended placement conflicts with this guide, stop and report the conflict before changing brand hierarchy.

---

## 18. Approved asset paths

```ts
export const BARBERQX_BRAND = {
  logoDark: "/brand/barberqx/logo-horizontal-dark.png",
  logoLight: "/brand/barberqx/logo-horizontal-light.png",
  appIconDark: "/brand/barberqx/app-icon-dark.png",
  appIconLight: "/brand/barberqx/app-icon-light.png",
  markGold: "/brand/barberqx/mark-gold.png",
  markWhite: "/brand/barberqx/mark-white.png",
} as const;
```

Keep this mapping centralized if the codebase has an existing constants/brand module.

---

## 19. Default recommendation

When uncertain:

**Marketing website:** use full ClipperQ horizontal logo.  
**Customer booking:** use shop branding + subtle `Powered by ClipperQ`.  
**Admin:** use a small ClipperQ platform header identity.  
**App/PWA icon:** use the supplied app icon.

That is the default brand system.
