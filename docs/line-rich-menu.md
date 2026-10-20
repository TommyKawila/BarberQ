# LINE Rich Menu · ClipperQ OA (@404qsemd)

Owner-facing Official Account rich menu (ชุดที่ 2). Chat bar text: `เมนู ClipperQ`.

Set `NEXT_PUBLIC_APP_URL` (no trailing slash). Demo shop slug: `NEXT_PUBLIC_DEMO_SHOP_SLUG` (default `phinxstudio`).

Reference PNGs (upload in LINE OA Manager):

- Large: `/public/rich-menu/clipperq-oa-large.png`
- Compact: `/public/rich-menu/clipperq-oa-compact.png`

Shop optional templates (for tenant OAs): `/public/rich-menu/shop-large.png`, `shop-compact.png`.

## Button URLs

| # | Label (TH) | Action |
| --- | --- | --- |
| A0 | Header lockup | `{NEXT_PUBLIC_APP_URL}/` |
| 1 | ทดลองใช้ฟรี 30 วัน | `{NEXT_PUBLIC_APP_URL}/trial` |
| 2 | ดูตัวอย่างระบบ | `{NEXT_PUBLIC_APP_URL}/demo` → `/{DEMO_SLUG}` booking; board: `/demo/board` → `/{DEMO_SLUG}/admin` (staff login) |
| 3 | ราคา | `{NEXT_PUBLIC_APP_URL}/#pricing` (alias `{NEXT_PUBLIC_APP_URL}/pricing`) |
| 4 | เข้าหน้าร้านของฉัน | `{NEXT_PUBLIC_APP_URL}/owner` |
| 5 | คู่มือ & FAQ | `{NEXT_PUBLIC_APP_URL}/guide` |
| 6 | คุยกับทีมงาน | message `คุยกับทีมงาน` (chat mode — no URL) |

Compact layout maps buttons 1–2 + chat; pricing / owner / guide live on the large menu (and can be linked from chat replies).

## Pricing (approved)

| Barbers | Price |
| --- | --- |
| 1–2 | ฿399 / mo |
| 3–5 | ฿599 / mo |
| 6–10 | ฿999 / mo |
| >10 | Contact us |

Same features all tiers · 30-day free trial · no card · cancel anytime. Source: `src/lib/marketing/offer.ts`.

## Shop OA rich menu (tenants)

Shops configure their own rich menu in LINE OA Manager. Suggested links:

- จองคิว → `{APP_URL}/{slug}` (prefer LIFF: `https://liff.line.me/{LIFF_ID}/{slug}`)
- คิวของฉัน → `{APP_URL}/{slug}/bookings`

Owner guide + template downloads: `/guide#shop-rich-menu`. Admin settings copy card deferred (PR #21 admin redesign) — links documented on `/guide` for now.

## ClipperQ OA chat handoff

Trial “สมัครผ่าน LINE”: `https://lin.ee/UUyRBzo` (`CLIPPERQ_OA_LINE_URL` in `src/lib/marketing/clipperq-oa.ts`).
