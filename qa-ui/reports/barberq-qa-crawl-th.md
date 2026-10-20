# รายงาน UI QA Crawl — ClipperQ (barberq-qa) · Phase 3

- **เป้าหมาย:** `https://barberq-qa.vercel.app` (เท่านั้น — ไม่แตะ production)
- **ร้าน:** `barberqpilottest`
- **เริ่ม:** 2026-10-20T23:23:02.798Z
- **จบ:** 2026-10-20T23:28:03.709Z
- **โหมด auth:** `qa-e2e`
- **auth ต่อ viewport:** `{"iphone": "chrome=true cookie=true storage=true", "ipad": "chrome=true cookie=true storage=true", "desktop": "chrome=true cookie=true storage=true"}`
- **สถานะรวม:** **FAIL** — fail=15 · warn=58 · info=6
- **ภาพหน้าจอ:** 60 / 60 (ครบทุกหน้า × 3 ขนาด รวม admin ที่ login แล้ว)
- **Artifact:** `/opt/cursor/artifacts/qa-ui-crawl/`
- **Head ที่ crawl ใช้ (crawler local):** sessionStorage reinject + wait-for-chrome
- **Deployed tap-target fixes:** barberq-qa production @ `3b677dd` (+ crawler push `3fe69c3`)

## สิ่งที่แก้ใน Phase 3 (แล้ว verify ด้วย crawl)

1. **Crawler auth race:** รอ admin chrome / cookie+sessionStorage (timeout 45s) แทน sleep 2.5s; auth แยกต่อ viewport; reinject sessionStorage หลังปิดหน้า login (Chromium ล้างเมื่อปิดแท็บสุดท้าย)
2. **เป้าแตะสูง ≥44px:** LanguageToggle, marketing footer/nav links, Guide tabs, BarberQxLogo link, pilot “กลับ Super Admin”
3. **Admin login สำเร็จทั้ง iPhone/iPad/Desktop** — `auth_redirect=0`, `skippedAuth=[]`

## สรุปตามหัวข้อที่ขอ

| หัวข้อ | ผล |
|---|---|
| Admin pages logged in | **ใช่** — Today/Team/Summary (+ อื่นๆ) มี screenshot บอร์ดจริงครบ 3 ขนาด |
| ปุ่มไม่มี pressed/active (`no_tap_feedback`) | **ไม่พบ** (0) |
| Navigation >1s | **พบ** — “More menu” fail บนทั้ง 3 viewport (iphone ~34s / ipad·desktop ~4s); Today/Team/Summary ~75–80ms (info) |
| Layout / overlap / console | **fail overlapping_interactive** บน admin-schedule/services/line (iPhone) — sticky CTA ทับ bottom nav; `outside_viewport` warn 2 รายการ |
| เป้าแตะที่ Phase 3 ตั้งใจแก้ | สูงของ ไทย/EN, Guide tabs, logo, Super Admin, footer **ผ่านความสูง 44** — ยังเหลือความกว้าง <44 บนข้อความสั้น (วิธีใช้/ราคา) และเป้าใหม่บน admin |

## Top issues (จัดอันดับ — ยังไม่แก้ในรอบนี้)

1. **[fail] Sticky CTA ทับ bottom nav (iPhone)** — `overlapping_interactive` บน admin-schedule (`เพิ่มเวลาพัก`), admin-services (`เพิ่มบริการ`), admin-line (`เสร็จสิ้น`) ทับปุ่มนำทาง “วันนี้/ทีมช่าง/สรุป/เพิ่มเติม”
2. **[fail] More menu latency** — เปิด “เพิ่มเติม” แล้วรอ dialog นานเกิน: iPhone 34004ms, iPad 4034ms, desktop 4018ms (อาจเมนูไม่ขึ้นเป็น dialog ที่ crawler คาด)
3. **[warn] เป้าแตะ admin ใหม่** — “✓ เปิดรับคิว” 96×32; ลูกศรวันที่ ‹ › 36×44; ลิงก์ย้อนกลับตั้งค่า
4. **[warn] Footer/nav ข้อความสั้น กว้าง <44** — วิธีใช้/ราคา/คำถาม/ฟีเจอร์ (สูง 44 แล้ว แต่กว้าง 28–39)
5. **[warn] Guide inline links** — “ทดลองใช้ฟรี 30 วัน”, “สมัครผ่าน LINE”, ลิงก์ดาวน์โหลด rich-menu สูง 23–25px
6. **[warn] outside_viewport** — องค์ประกอบ “คิวและราคา” นอก viewport (2)
7. **[info] Today/Team/Summary nav** — ~75–80ms ผ่านเกณฑ์
8. **[ข้อมูล] ไม่พบ no_tap_feedback** บนหน้าที่ crawl

## สรุปรหัสปัญหา

- `small_tap_target`: 56
- `overlapping_interactive`: 12
- `nav_latency`: 9
- `outside_viewport`: 2

### Fail detail

#### `nav_latency` (3)
- admin-today/iphone: นำทาง “More menu” ใช้เวลา 34004ms
- admin-today/ipad: นำทาง “More menu” ใช้เวลา 4034ms
- admin-today/desktop: นำทาง “More menu” ใช้เวลา 4018ms

#### `overlapping_interactive` (12)
- admin-schedule/iphone: ปุ่ม/ลิงก์ทับกัน: “วันนี้” ∩ “เพิ่มเวลาพัก”
- admin-schedule/iphone: ปุ่ม/ลิงก์ทับกัน: “ทีมช่าง” ∩ “เพิ่มเวลาพัก”
- admin-schedule/iphone: ปุ่ม/ลิงก์ทับกัน: “สรุป” ∩ “เพิ่มเวลาพัก”
- admin-schedule/iphone: ปุ่ม/ลิงก์ทับกัน: “เพิ่มเติม” ∩ “เพิ่มเวลาพัก”
- admin-services/iphone: ปุ่ม/ลิงก์ทับกัน: “วันนี้” ∩ “เพิ่มบริการ”
- admin-services/iphone: ปุ่ม/ลิงก์ทับกัน: “ทีมช่าง” ∩ “เพิ่มบริการ”
- admin-services/iphone: ปุ่ม/ลิงก์ทับกัน: “สรุป” ∩ “เพิ่มบริการ”
- admin-services/iphone: ปุ่ม/ลิงก์ทับกัน: “เพิ่มเติม” ∩ “เพิ่มบริการ”
- admin-line/iphone: ปุ่ม/ลิงก์ทับกัน: “วันนี้” ∩ “เสร็จสิ้น”
- admin-line/iphone: ปุ่ม/ลิงก์ทับกัน: “ทีมช่าง” ∩ “เสร็จสิ้น”
- admin-line/iphone: ปุ่ม/ลิงก์ทับกัน: “สรุป” ∩ “เสร็จสิ้น”
- admin-line/iphone: ปุ่ม/ลิงก์ทับกัน: “เพิ่มเติม” ∩ “เสร็จสิ้น”

### เป้าแตะเล็กที่เหลือ (จัดกลุ่ม)

| ครั้ง | ป้าย (ขนาด) | หน้าตัวอย่าง |
|---:|---|---|
| 8 | ✓ เปิดรับคิว (96×32) | admin-team |
| 4 | ‹ (36×44) | admin-login, admin-today |
| 4 | › (36×44) | admin-login, admin-today |
| 3 | วิธีใช้ (29×44) | sales-home |
| 3 | ราคา (28×44) | sales-home |
| 3 | คำถาม (39×44) | sales-home |
| 2 | ทดลองใช้ฟรี 30 วัน (111×23) | guide |
| 2 | สมัครผ่าน LINE (91×23) | guide |
| 2 | ดาวน์โหลด shop-large.png (176×25) | guide |
| 2 | ดาวน์โหลด shop-compact.png (201×25) | guide |
| 2 | shop-large-nologo.png (163×25) | guide |
| 2 | shop-compact-nologo.png (188×25) | guide |
| 2 | shop-large-longname.png (185×25) | guide |
| 2 | shop-compact-longname.png (210×25) | guide |
| 2 | เวลาเปิดร้าน (73×23) | admin-schedule |
| 2 | < ตั้งค่า (44×23) | admin-notifications |
| 2 | กลับ (21×18) | admin-services |
| 2 | ← กลับ (41×23) | admin-line |
| 2 | ดูโควตา push → (96×20) | admin-line |
| 2 | ← ตั้งค่า (358×20) | admin-qr-queue-settings, admin-reminders |
| 2 | ← ตั้งค่า (736×20) | admin-qr-queue-settings, admin-reminders |
| 1 | ฟีเจอร์ (39×44) | sales-home |

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

## ไฟล์ประกอบ

- HTML: artifact `qa-ui-crawl/index.html`
- JSON: artifact `qa-ui-crawl/summary.json`
- Screenshots: artifact `qa-ui-crawl/screenshots/` (60 ไฟล์)
- Admin samples: `screenshots/qa-p3-admin-today-iphone.png`, `qa-p3-admin-team-iphone.png`, `qa-p3-admin-summary-iphone.png`

## ไม่ได้แก้บั๊ก admin ใหม่ในรอบนี้

Phase 3 แก้ crawler auth + เป้าแตะที่ระบุเท่านั้น — fail/warn ใหม่บน admin รายงานอย่างเดียว
