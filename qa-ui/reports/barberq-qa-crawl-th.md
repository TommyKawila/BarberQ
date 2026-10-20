# รายงาน UI QA Crawl — ClipperQ (barberq-qa)

- **เป้าหมาย:** `https://barberq-qa.vercel.app` (เท่านั้น — ไม่แตะ production)
- **ร้าน:** `barberqpilottest`
- **เริ่ม:** 2026-10-20T23:04:03.748Z
- **จบ:** 2026-10-20T23:07:21.907Z
- **โหมด auth ที่ crawler บันทึก:** `qa-e2e`
- **สถานะรวม:** **WARN** — fail=0 · warn=106 · info=0
- **ภาพหน้าจอ:** 49 ไฟล์ (คาดหวัง ~60 = 20 หน้า × 3 viewport)
- **Artifact:** `/opt/cursor/artifacts/qa-ui-crawl/` (HTML + JSON + screenshots)

## สรุปผลการตรวจตามหัวข้อที่ขอ

| หัวข้อ | ผล |
|---|---|
| `/api/qa/e2e-session` | HTTP 200, `enabled: true` (ไม่ 404) |
| ปุ่มไม่มี active/pressed state (`no_tap_feedback`) | **ไม่พบ** (0 รายการ) |
| Navigation ช้ากว่า 1s | **ไม่พบ** — latency วัดเฉพาะ `admin-today` เมื่อ auth สำเร็จ; รอบนี้บอร์ดแอดมินไม่ถูกเปิดจริง |
| Layout พัง / HTTP error / console fail | **ไม่พบ fail** (0) |
| เป้าแตะ < 44px | **84 warn** |
| Admin redirect → login | **22 warn** (iPad 11 + desktop 11) |

## ข้อจำกัด auth ในรอบนี้ (สำคัญ)

1. **iPhone:** หน้า admin ที่ต้อง auth ถูก **ข้าม** (`needs_qa_e2e_auth`) — ไม่มี screenshot ของบอร์ด/ตั้งค่าบน iPhone
2. **iPad + Desktop:** crawler ถือว่า `authMode=qa-e2e` แล้ว แต่ทุกหน้า admin ที่ต้อง auth **ถูกพาไปหน้า login** (`auth_redirect`) — screenshot เป็นหน้า “เข้าสู่ระบบด้วย LINE” ไม่ใช่บอร์ดจริง
3. หลัง crawl จบ มีการ probe `/qa/e2e` แยก (รอ ~3.5s) พบว่า login **สำเร็จทั้ง 3 viewport** → น่าจะเป็น race/เวลา wait 2.5s ใน crawler หรือ session ไม่ติดข้ามหน้าในบริบทเดิม
4. ตามคำสั่ง Phase 2: **ไม่ retry crawl** — รายงานช่องว่างนี้แทน

**สิ่งที่ยังขาดเพื่อให้ admin crawl สมบูรณ์:** QA E2E session ที่คงอยู่ครบทุก viewport ในรอบ crawl เดียว (หรือเพิ่ม wait/verify หลัง `/qa/e2e` ก่อนไล่หน้า admin) — ไม่ใช่การขาด `QA_E2E_SECRET` (มีและ endpoint เปิดอยู่)

## Top issues (จัดอันดับความรุนแรง)

1. **[สูง] Admin auth ไม่ครบใน crawl** — iPhone ข้าม admin; iPad/Desktop ได้แค่หน้า login → **ไม่ได้ตรวจ UX บอร์ดแอดมินจริง** (ปุ่ม pressed, latency นำทาง, layout บอร์ด)
2. **[กลาง] Footer ลิงก์การตลาดเล็กเกิน** — “วิธีใช้ / ฟีเจอร์ / ราคา / คำถาม / ติดต่อเรา” สูง ~20px บน sales-home (iPhone/iPad)
3. **[กลาง] สลับภาษา ไทย/EN สูง 32px (<44)** — ซ้ำหลายหน้า booking + marketing + login
4. **[กลาง] Guide CTA แถวแท็บสูง 40px** — “เชื่อม LINE OA / เชิญช่าง / Walk-in / ปิดคิว / Rich Menu ร้าน”
5. **[ต่ำ–กลาง] ลิงก์โลโก้/brand “a” สูง 21–32px** — sales/trial/guide
6. **[ต่ำ] ปุ่ม “กลับ Super Admin” สูง 20px** — หน้า `/pilot`
7. **[ข้อมูล] ไม่พบ no_tap_feedback** — อาจเพราะหน้า admin จริงไม่ถูกเปิด; ยังไม่ยืนยันว่าปุ่มบอร์ดมี pressed state
8. **[ข้อมูล] ไม่พบ navigation >1s** — การวัด latency ไม่ได้รันบนบอร์ดที่ authenticated จริง

## สรุปรหัสปัญหา

- `small_tap_target`: 84
- `auth_redirect`: 22

### auth_redirect ตาม viewport

- ipad: 11 หน้า — admin-line, admin-notifications, admin-qr-queue-settings, admin-reminders, admin-schedule, admin-services, admin-settings, admin-setup, admin-summary, admin-team, admin-today
- desktop: 11 หน้า — admin-line, admin-notifications, admin-qr-queue-settings, admin-reminders, admin-schedule, admin-services, admin-settings, admin-setup, admin-summary, admin-team, admin-today

### เป้าแตะเล็ก (จัดกลุ่มตามป้าย)

| ครั้ง | ป้าย (ขนาด) | Viewports | หน้าตัวอย่าง |
|---:|---|---|---|
| 27 | ไทย (44×32) | ipad,iphone | admin-line, admin-login, admin-notifications, admin-qr-queue-settings, admin-reminders, admin-schedule (+13) |
| 27 | EN (44×32) | ipad,iphone | admin-line, admin-login, admin-notifications, admin-qr-queue-settings, admin-reminders, admin-schedule (+13) |
| 3 | a (84×21) | iphone | guide, sales-home, trial |
| 2 | วิธีใช้ (29×20) | ipad,iphone | sales-home |
| 2 | ราคา (28×20) | ipad,iphone | sales-home |
| 2 | คำถาม (39×20) | ipad,iphone | sales-home |
| 2 | a (96×24) | ipad,iphone | trial |
| 2 | กลับ Super Admin (104×20) | ipad,iphone | pilot |
| 2 | เชื่อม LINE OA (105×40) | ipad,iphone | guide |
| 2 | เชิญช่าง (70×40) | ipad,iphone | guide |
| 2 | Walk-in / บล็อก (116×40) | ipad,iphone | guide |
| 2 | ปิดคิว (58×40) | ipad,iphone | guide |
| 2 | Rich Menu ร้าน (112×40) | ipad,iphone | guide |
| 2 | a (120×30) | ipad | guide, trial |
| 1 | a (358×32) | iphone | sales-home |
| 1 | ติดต่อเรา (56×20) | iphone | sales-home |
| 1 | a (369×30) | ipad | sales-home |
| 1 | ฟีเจอร์ (39×20) | ipad | sales-home |
| 1 | a (976×32) | ipad | sales-home |

## ภาพหน้าจอต่อหน้า / ขนาด

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
| `admin-today` | `/barberqpilottest/admin` | — | [✓](screenshots/admin-today__ipad.png) | [✓](screenshots/admin-today__desktop.png) | (iPhone ข้าม) (iPad/Desktop = หน้า login)
| `admin-team` | `/barberqpilottest/admin/staff` | — | [✓](screenshots/admin-team__ipad.png) | [✓](screenshots/admin-team__desktop.png) | (iPhone ข้าม) (iPad/Desktop = หน้า login)
| `admin-summary` | `/barberqpilottest/admin/stats` | — | [✓](screenshots/admin-summary__ipad.png) | [✓](screenshots/admin-summary__desktop.png) | (iPhone ข้าม) (iPad/Desktop = หน้า login)
| `admin-schedule` | `/barberqpilottest/admin/my-schedule` | — | [✓](screenshots/admin-schedule__ipad.png) | [✓](screenshots/admin-schedule__desktop.png) | (iPhone ข้าม) (iPad/Desktop = หน้า login)
| `admin-settings` | `/barberqpilottest/admin/settings` | — | [✓](screenshots/admin-settings__ipad.png) | [✓](screenshots/admin-settings__desktop.png) | (iPhone ข้าม) (iPad/Desktop = หน้า login)
| `admin-notifications` | `/barberqpilottest/admin/settings/notifications` | — | [✓](screenshots/admin-notifications__ipad.png) | [✓](screenshots/admin-notifications__desktop.png) | (iPhone ข้าม) (iPad/Desktop = หน้า login)
| `admin-services` | `/barberqpilottest/admin/settings/services` | — | [✓](screenshots/admin-services__ipad.png) | [✓](screenshots/admin-services__desktop.png) | (iPhone ข้าม) (iPad/Desktop = หน้า login)
| `admin-line` | `/barberqpilottest/admin/settings/line` | — | [✓](screenshots/admin-line__ipad.png) | [✓](screenshots/admin-line__desktop.png) | (iPhone ข้าม) (iPad/Desktop = หน้า login)
| `admin-qr-queue-settings` | `/barberqpilottest/admin/settings/qr-queue` | — | [✓](screenshots/admin-qr-queue-settings__ipad.png) | [✓](screenshots/admin-qr-queue-settings__desktop.png) | (iPhone ข้าม) (iPad/Desktop = หน้า login)
| `admin-reminders` | `/barberqpilottest/admin/settings/reminders` | — | [✓](screenshots/admin-reminders__ipad.png) | [✓](screenshots/admin-reminders__desktop.png) | (iPhone ข้าม) (iPad/Desktop = หน้า login)
| `admin-setup` | `/barberqpilottest/admin/setup` | — | [✓](screenshots/admin-setup__ipad.png) | [✓](screenshots/admin-setup__desktop.png) | (iPhone ข้าม) (iPad/Desktop = หน้า login)

## ไฟล์ประกอบ

- HTML: `report/index.html` (gitignored) → คัดลอกไป artifact
- JSON: `report/summary.json`
- Screenshots: `report/screenshots/*.png`
- Artifact dir: `/opt/cursor/artifacts/qa-ui-crawl/`

## ไม่ได้แก้บั๊กในรอบนี้

Phase 2 เป็นการเก็บหลักฐานอย่างเดียว — ยังไม่แก้ UI / auth crawler
