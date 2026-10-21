# รายงาน UI QA Crawl — ClipperQ (barberq-qa) · Phase 4

- **เป้าหมาย:** `https://barberq-qa.vercel.app`
- **ร้าน:** `barberqpilottest`
- **เริ่ม:** 2026-10-20T23:59:45.070Z
- **จบ:** 2026-10-21T00:04:28.354Z
- **โหมด auth:** `qa-e2e` · `{"iphone": "chrome=true cookie=true storage=true", "ipad": "chrome=true cookie=true storage=true", "desktop": "chrome=true cookie=true storage=true"}`
- **สถานะรวม:** **WARN** — fail=0 · warn=34 · info=9
- **ภาพหน้าจอ:** 60/60
- **Deploy:** barberq-qa @ `cbc40af`

## Phase 4 — สิ่งที่แก้แล้ว (verify ด้วย crawl)

| # | เป้าหมาย | ผล |
|---|---|---|
| 1 | Sticky CTA ทับ bottom nav (schedule/services/LINE) | **ผ่าน** — ย้าย CTA เข้า `AdminShell` thumbBar + pb-28; overlap fail=0 |
| 2 | More menu latency | **ผ่าน** — iPhone ~50ms; iPad/desktop info; ไม่มี fail (แก้ locator + waitForFunction) |
| 3 | เปิดรับคิว + ลูกศรวันที่ ≥44×44 | **ผ่าน** — ไม่เหลือใน small_tap |
| 4 | Guide inline/download ≥44px สูง | **ผ่าน** |
| 5 | คิวและราคา outside viewport | **ผ่าน** — section chips ใช้ flex-wrap |

## Latency (admin Today)

- info: iphone — นำทาง “More menu” ใช้เวลา 45ms
- info: ipad — นำทาง “More menu” ใช้เวลา 45ms
- info: ipad — นำทาง “Today” ใช้เวลา 83ms
- info: ipad — นำทาง “Team” ใช้เวลา 76ms
- info: ipad — นำทาง “Summary” ใช้เวลา 81ms
- info: desktop — นำทาง “More menu” ใช้เวลา 60ms
- info: desktop — นำทาง “Today” ใช้เวลา 81ms
- info: desktop — นำทาง “Team” ใช้เวลา 77ms
- info: desktop — นำทาง “Summary” ใช้เวลา 82ms

## ที่ยังเหลือ (warn — ไม่แก้ในรอบนี้)

1. Footer/nav ข้อความสั้น **กว้าง** <44 (สูง 44 แล้ว): วิธีใช้/ราคา/คำถาม/ฟีเจอร์
2. ลิงก์ย้อนกลับตั้งค่า / ดูโควตา / เวลาเปิดร้าน — สูง <44
3. Guide FAQ ลิงก์อื่น (`/demo`, `/owner`, หน้าราคา) สูง ~25px

## สรุปรหัส

- `small_tap_target`: 34
- `nav_latency`: 9

### เป้าแตะเล็กที่เหลือ

| ครั้ง | ป้าย | หน้า |
|---:|---|---|
| 3 | วิธีใช้ (29×44) | sales-home |
| 3 | ราคา (28×44) | sales-home |
| 3 | คำถาม (39×44) | sales-home |
| 2 | เปิดหน้าทดลองใช้ (103×25) | guide |
| 2 | /demo (46×25) | guide |
| 2 | /demo/board (92×25) | guide |
| 2 | หน้าราคา (55×25) | guide |
| 2 | /owner (51×25) | guide |
| 2 | เวลาเปิดร้าน (73×23) | admin-schedule |
| 2 | < ตั้งค่า (44×23) | admin-notifications |
| 2 | กลับ (21×18) | admin-services |
| 2 | ← กลับ (41×23) | admin-line |
| 2 | ดูโควตา push → (96×20) | admin-line |
| 2 | ← ตั้งค่า (358×20) | admin-qr-queue-settings, admin-reminders |
| 2 | ← ตั้งค่า (736×20) | admin-qr-queue-settings, admin-reminders |
| 1 | ฟีเจอร์ (39×44) | sales-home |

## ภาพหน้าจอ

| หน้า | path | iPhone | iPad | Desktop |
|---|---|---|---|---|
| `sales-home` | `/` | [✓](screenshots/sales-home__iphone.png) | [✓](screenshots/sales-home__ipad.png) | [✓](screenshots/sales-home__desktop.png) |
| `trial` | `/trial` | [✓](screenshots/trial__iphone.png) | [✓](screenshots/trial__ipad.png) | [✓](screenshots/trial__desktop.png) |
| `pilot` | `/pilot` | [✓](screenshots/pilot__iphone.png) | [✓](screenshots/pilot__ipad.png) | [✓](screenshots/pilot__desktop.png) |
| `guide` | `/guide` | [✓](screenshots/guide__iphone.png) | [✓](screenshots/guide__ipad.png) | [✓](screenshots/guide__desktop.png) |
| `booking-home` | `/barberqpilottest` | [✓](screenshots/booking-home__iphone.png) | [✓](screenshots/booking-home__ipad.png) | [✓](screenshots/booking-home__desktop.png) |
| `bookings` | `/barberqpilottest/bookings` | [✓](screenshots/bookings__iphone.png) | [✓](screenshots/bookings__ipad.png) | [✓](screenshots/bookings__desktop.png) |
| `qr-queue` | `/barberqpilottest/q` | [✓](screenshots/qr-queue__iphone.png) | [✓](screenshots/qr-queue__ipad.png) | [✓](screenshots/qr-queue__desktop.png) |
| `qr-queue-me` | `/barberqpilottest/q/me` | [✓](screenshots/qr-queue-me__iphone.png) | [✓](screenshots/qr-queue-me__ipad.png) | [✓](screenshots/qr-queue-me__desktop.png) |
| `admin-login` | `/barberqpilottest/admin/login` | [✓](screenshots/admin-login__iphone.png) | [✓](screenshots/admin-login__ipad.png) | [✓](screenshots/admin-login__desktop.png) |
| `admin-today` | `/barberqpilottest/admin` | [✓](screenshots/admin-today__iphone.png) | [✓](screenshots/admin-today__ipad.png) | [✓](screenshots/admin-today__desktop.png) |
| `admin-team` | `/barberqpilottest/admin/staff` | [✓](screenshots/admin-team__iphone.png) | [✓](screenshots/admin-team__ipad.png) | [✓](screenshots/admin-team__desktop.png) |
| `admin-summary` | `/barberqpilottest/admin/stats` | [✓](screenshots/admin-summary__iphone.png) | [✓](screenshots/admin-summary__ipad.png) | [✓](screenshots/admin-summary__desktop.png) |
| `admin-schedule` | `/barberqpilottest/admin/my-schedule` | [✓](screenshots/admin-schedule__iphone.png) | [✓](screenshots/admin-schedule__ipad.png) | [✓](screenshots/admin-schedule__desktop.png) |
| `admin-settings` | `/barberqpilottest/admin/settings` | [✓](screenshots/admin-settings__iphone.png) | [✓](screenshots/admin-settings__ipad.png) | [✓](screenshots/admin-settings__desktop.png) |
| `admin-notifications` | `/barberqpilottest/admin/settings/notifications` | [✓](screenshots/admin-notifications__iphone.png) | [✓](screenshots/admin-notifications__ipad.png) | [✓](screenshots/admin-notifications__desktop.png) |
| `admin-services` | `/barberqpilottest/admin/settings/services` | [✓](screenshots/admin-services__iphone.png) | [✓](screenshots/admin-services__ipad.png) | [✓](screenshots/admin-services__desktop.png) |
| `admin-line` | `/barberqpilottest/admin/settings/line` | [✓](screenshots/admin-line__iphone.png) | [✓](screenshots/admin-line__ipad.png) | [✓](screenshots/admin-line__desktop.png) |
| `admin-qr-queue-settings` | `/barberqpilottest/admin/settings/qr-queue` | [✓](screenshots/admin-qr-queue-settings__iphone.png) | [✓](screenshots/admin-qr-queue-settings__ipad.png) | [✓](screenshots/admin-qr-queue-settings__desktop.png) |
| `admin-reminders` | `/barberqpilottest/admin/settings/reminders` | [✓](screenshots/admin-reminders__iphone.png) | [✓](screenshots/admin-reminders__ipad.png) | [✓](screenshots/admin-reminders__desktop.png) |
| `admin-setup` | `/barberqpilottest/admin/setup` | [✓](screenshots/admin-setup__iphone.png) | [✓](screenshots/admin-setup__ipad.png) | [✓](screenshots/admin-setup__desktop.png) |

