# LINE Rich Menu · ClipperQ OA (@404qsemd)

Owner-facing Official Account rich menu (ชุดที่ 2). Chat bar text: `เมนู ClipperQ` (≤14 chars).

Set `NEXT_PUBLIC_APP_URL` (no trailing slash) and `NEXT_PUBLIC_LIFF_ID`.

Grid matches **LINE OA Manager standard templates** (no header strip):

| Size | Image | Columns | Rows |
| --- | --- | --- | --- |
| Large | 2500×1686 | 833 / 834 / 833 | 843 / 843 |
| Compact | 2500×843 | 833 / 834 / 833 | 843 |

## ClipperQ Demo shop

| | |
| --- | --- |
| Display name | ClipperQ Demo |
| Slug | **`clipperqdemo`** (default `NEXT_PUBLIC_DEMO_SHOP_SLUG`) |
| Fixed shop id | `c1a55e00-d300-4000-a000-000000000001` |
| Seed (prod, manual) | `supabase/scripts/seed_clipperq_demo_prod.sql` |
| Rollback | `supabase/scripts/rollback_clipperq_demo_prod.sql` |
| Migration | `supabase/migrations/0042_shops_is_demo.sql` (`shops.is_demo`) |
| Flag | `shops.is_demo = true` — app skips LINE pushes; not billed |
| Not included | LINE OA credentials, owner LINE user id, real customers |

Tommy runs the seed SQL in production (not an auto migration). Until the row exists, `/demo` and `/demo/board` show a Thai “ยังไม่พร้อม” fallback (never falls back to `phinxstudio` / `testshop` / `barberqpilottest`).

### Pre-check (slug free)

```sql
select id, name, slug, is_demo
from shops
where slug = 'clipperqdemo';
```

## ClipperQ OA — FINAL tap areas & URIs

Verified app routes: `/trial`, `/demo`, `/#pricing` (alias `/pricing`), `/owner`, `/guide`. Cell F is a LINE **message** action (no URL).

### Large 2500×1686

| Cell | Label (TH) | x | y | w | h | Action |
| --- | --- | --- | --- | --- | --- | --- |
| A | ทดลองใช้ฟรี 30 วัน | 0 | 0 | 833 | 843 | uri `{APP_URL}/trial` |
| B | ดูตัวอย่างระบบ | 833 | 0 | 834 | 843 | uri `{APP_URL}/demo` → `/{DEMO_SLUG}` when seeded (`clipperqdemo`); board `{APP_URL}/demo/board` (public **read-only**, no staff login) |
| C | ราคา | 1667 | 0 | 833 | 843 | uri `{APP_URL}/#pricing` |
| D | เข้าหน้าร้านของฉัน | 0 | 843 | 833 | 843 | uri `{APP_URL}/owner` |
| E | คู่มือ & FAQ | 833 | 843 | 834 | 843 | uri `{APP_URL}/guide` |
| F | คุยกับทีมงาน | 1667 | 843 | 833 | 843 | message `คุยกับทีมงาน` |

### Compact 2500×843

| Cell | Label (TH) | x | y | w | h | Action |
| --- | --- | --- | --- | --- | --- | --- |
| A | ทดลองใช้ฟรี 30 วัน | 0 | 0 | 833 | 843 | uri `{APP_URL}/trial` |
| B | ดูตัวอย่างระบบ | 833 | 0 | 834 | 843 | uri `{APP_URL}/demo` |
| C | คุยกับทีมงาน | 1667 | 0 | 833 | 843 | message `คุยกับทีมงาน` |

Pricing / owner / guide live on the large menu (and can be linked from chat replies).

Reference PNGs (upload in LINE OA Manager or Messaging API):

- Large: `/public/rich-menu/clipperq-oa-large.png`
- Compact: `/public/rich-menu/clipperq-oa-compact.png`

## Messaging API — ClipperQ OA rich menu objects

Replace `{APP_URL}` with `NEXT_PUBLIC_APP_URL` (no trailing slash). Create via `POST https://api.line.me/v2/bot/richmenu`, then upload the matching PNG to `/v2/bot/richmenu/{richMenuId}/content`.

### Large

```json
{
  "size": { "width": 2500, "height": 1686 },
  "selected": true,
  "name": "ClipperQ OA large",
  "chatBarText": "เมนู ClipperQ",
  "areas": [
    {
      "bounds": { "x": 0, "y": 0, "width": 833, "height": 843 },
      "action": { "type": "uri", "label": "ทดลองใช้ฟรี 30 วัน", "uri": "{APP_URL}/trial" }
    },
    {
      "bounds": { "x": 833, "y": 0, "width": 834, "height": 843 },
      "action": { "type": "uri", "label": "ดูตัวอย่างระบบ", "uri": "{APP_URL}/demo" }
    },
    {
      "bounds": { "x": 1667, "y": 0, "width": 833, "height": 843 },
      "action": { "type": "uri", "label": "ราคา", "uri": "{APP_URL}/#pricing" }
    },
    {
      "bounds": { "x": 0, "y": 843, "width": 833, "height": 843 },
      "action": { "type": "uri", "label": "เข้าหน้าร้านของฉัน", "uri": "{APP_URL}/owner" }
    },
    {
      "bounds": { "x": 833, "y": 843, "width": 834, "height": 843 },
      "action": { "type": "uri", "label": "คู่มือ & FAQ", "uri": "{APP_URL}/guide" }
    },
    {
      "bounds": { "x": 1667, "y": 843, "width": 833, "height": 843 },
      "action": { "type": "message", "label": "คุยกับทีมงาน", "text": "คุยกับทีมงาน" }
    }
  ]
}
```

### Compact

```json
{
  "size": { "width": 2500, "height": 843 },
  "selected": true,
  "name": "ClipperQ OA compact",
  "chatBarText": "เมนู ClipperQ",
  "areas": [
    {
      "bounds": { "x": 0, "y": 0, "width": 833, "height": 843 },
      "action": { "type": "uri", "label": "ทดลองใช้ฟรี 30 วัน", "uri": "{APP_URL}/trial" }
    },
    {
      "bounds": { "x": 833, "y": 0, "width": 834, "height": 843 },
      "action": { "type": "uri", "label": "ดูตัวอย่างระบบ", "uri": "{APP_URL}/demo" }
    },
    {
      "bounds": { "x": 1667, "y": 0, "width": 833, "height": 843 },
      "action": { "type": "message", "label": "คุยกับทีมงาน", "text": "คุยกับทีมงาน" }
    }
  ]
}
```

## Pricing (approved)

| Barbers | Price |
| --- | --- |
| 1–2 | ฿399 / mo |
| 3–5 | ฿599 / mo |
| 6–10 | ฿999 / mo |
| >10 | Contact us |

Same features all tiers · 30-day free trial · no card · cancel anytime. Source: `src/lib/marketing/offer.ts`.

## Shop OA rich menu (tenants)

Shops configure their own rich menu in LINE OA Manager. Prefer LIFF so taps stay in LINE (`buildShopLiffUrl` in `src/lib/line/liff-url.ts`).

### Large 2500×1686

| Cell | Label (TH) | x | y | w | h | Action |
| --- | --- | --- | --- | --- | --- | --- |
| A | จองคิว | 0 | 0 | 833 | 843 | uri `https://liff.line.me/{LIFF_ID}/{slug}` |
| B | คิวของฉัน | 833 | 0 | 834 | 843 | uri `https://liff.line.me/{LIFF_ID}/{slug}/bookings` |
| C | บริการ & ราคา | 1667 | 0 | 833 | 843 | uri shop services (or message) — optional |
| D | ช่างของเรา | 0 | 843 | 833 | 843 | uri shop barbers (or booking) — optional |
| E | ที่ตั้ง & เวลาเปิด | 833 | 843 | 834 | 843 | uri Maps / shop info — optional |
| F | ติดต่อร้าน | 1667 | 843 | 833 | 843 | message `ติดต่อร้าน` (or `tel:`) |

### Compact 2500×843

| Cell | Label (TH) | x | y | w | h | Action |
| --- | --- | --- | --- | --- | --- | --- |
| A | จองคิว | 0 | 0 | 833 | 843 | uri `https://liff.line.me/{LIFF_ID}/{slug}` |
| B | คิวของฉัน | 833 | 0 | 834 | 843 | uri `https://liff.line.me/{LIFF_ID}/{slug}/bookings` |
| C | ติดต่อร้าน | 1667 | 0 | 833 | 843 | message `ติดต่อร้าน` |

Web fallbacks when LIFF unset: `{APP_URL}/{slug}`, `{APP_URL}/{slug}/bookings`.

### Template downloads

| File | Use |
| --- | --- |
| `/public/rich-menu/shop-large.png` | Sample with ClipperQ Demo branding |
| `/public/rich-menu/shop-compact.png` | Compact sample |
| `/public/rich-menu/variants/shop-large-nologo.png` | Initial-letter logo fallback |
| `/public/rich-menu/variants/shop-compact-nologo.png` | Compact no-logo |
| `/public/rich-menu/variants/shop-large-longname.png` | Long Thai name truncation sample |
| `/public/rich-menu/variants/shop-compact-longname.png` | Compact long-name |

Owner guide: `/guide#shop-rich-menu`.

### Example shop Messaging API areas (Demo slug)

```json
{
  "size": { "width": 2500, "height": 1686 },
  "selected": true,
  "name": "Shop rich menu large",
  "chatBarText": "จองคิว / เมนู",
  "areas": [
    {
      "bounds": { "x": 0, "y": 0, "width": 833, "height": 843 },
      "action": {
        "type": "uri",
        "label": "จองคิว",
        "uri": "https://liff.line.me/{LIFF_ID}/clipperqdemo"
      }
    },
    {
      "bounds": { "x": 833, "y": 0, "width": 834, "height": 843 },
      "action": {
        "type": "uri",
        "label": "คิวของฉัน",
        "uri": "https://liff.line.me/{LIFF_ID}/clipperqdemo/bookings"
      }
    },
    {
      "bounds": { "x": 1667, "y": 0, "width": 833, "height": 843 },
      "action": { "type": "message", "label": "บริการ & ราคา", "text": "บริการ & ราคา" }
    },
    {
      "bounds": { "x": 0, "y": 843, "width": 833, "height": 843 },
      "action": { "type": "message", "label": "ช่างของเรา", "text": "ช่างของเรา" }
    },
    {
      "bounds": { "x": 833, "y": 843, "width": 834, "height": 843 },
      "action": { "type": "message", "label": "ที่ตั้ง & เวลาเปิด", "text": "ที่ตั้ง & เวลาเปิด" }
    },
    {
      "bounds": { "x": 1667, "y": 843, "width": 833, "height": 843 },
      "action": { "type": "message", "label": "ติดต่อร้าน", "text": "ติดต่อร้าน" }
    }
  ]
}
```

## ClipperQ OA chat handoff

Trial “สมัครผ่าน LINE”: `https://lin.ee/UUyRBzo` (`CLIPPERQ_OA_LINE_URL` in `src/lib/marketing/clipperq-oa.ts`).
