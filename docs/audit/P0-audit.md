# BarberQ P0 Audit (อ่านอย่างเดียว)

| | |
|---|---|
| วันที่ | 10 ต.ค. 2026 |
| สาขา | `cursor/p0-ci-audit-f1a4` |
| ขอบเขต | CI + audit เท่านั้น — **ไม่** แก้ฟีเจอร์ / migration / config Production |
| หลักฐาน | อ่านไฟล์ใน repo โดยตรง (ไม่เดา) |

---

## 1) สถาปัตยกรรมโดยรวม

**Stack:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + LINE LIFF + Supabase (Postgres) · deploy บน Vercel

**โครงหลัก**

| ชั้น | path สำคัญ |
|---|---|
| ลูกค้า / ร้าน | `src/app/[shop]/` (`page`, `bookings`, `admin/*`) |
| แพลตฟอร์ม | `src/app/(operator)/superadmin/*`, `src/app/(app)/` (owner/manager join, pilot, trial) |
| API | `src/app/api/[shop]/*` (scoped) + route เก่าไม่ผูก shop (`/api/bookings`, `/api/slots`, `src/app/admin/*`) |
| Domain | `src/lib/services/*`, `src/lib/data/*`, `src/lib/auth/*`, `src/lib/line/*` |
| Schema | `supabase/migrations/0001`–`0025` |

**Multi-tenant:** ร้านแยกด้วย `shops.slug` → `resolveShopParam` / `getShopBySlug` · layout `[shop]` ปฏิเสธร้านที่ไม่มีหรือไม่ `active`

**Data layer:** `getStore()` ใน `src/lib/data/index.ts`
- ไม่มี Supabase URL+service role **และ** ไม่ใช่ production → `memoryStore`
- มี config / production → `supabaseStore` (service role เท่านั้น)
- production บังคับ env ผ่าน `assertProductionConfig()`

**บทบาท**
- ลูกค้า: LIFF access token → `verifyLineAccessToken` → `assertVerifiedCustomer`
- Owner / Barber: `barbers.line_id` + role
- Manager: `shop_managers` (migration 0025)
- Superadmin: header `x-superadmin-token` = `SUPERADMIN_TOKEN` (shared secret)

---

## 2) โมเดลจองคิว และการกันจองซ้อน

### Schema (`appointments`)
จาก `0001_schema.sql` + ส่วนขยาย:
- บังคับ: `customer_ref`, `customer_name`, `customer_phone`, `start_time`, `end_time`, `status`
- ภายหลัง: `no_show` / outcome timestamps (`0010`), `cancel_token` / `late_called_at` (`0011`), `customer_line_id` (`0013`)
- **ยังไม่มี** คอลัมน์ `source` หรือสถานะ `left`

### ชั้นกันจองซ้อน (defense in depth)

1. **Exclusion constraint** `appointments_no_overlap` (0001 เท่านั้น ไม่เคยเปลี่ยน):
   ```sql
   where (status = 'confirmed')
   ```
2. **RPC `create_appointment`**: `pg_advisory_xact_lock` ต่อ `barber_id` แล้วเช็ค overlap กับ appointments + `blocked_slots`
3. **App** `createBooking` (`booking-service.ts`): ตรวจชื่อ/เบอร์ไทย/ref, ห้ามอดีต, ช่องต้องอยู่ในกริด `generateSlots`, แล้วเรียก store RPC

### สมมติฐาน no_show vs busy — **ตรวจแล้ว: ไม่เป็นจริง**

สมมติฐานจากเอกสารวางแผน: “0013 อนุญาตจองทับ no-show แต่ `get_busy_intervals` ยังนับ no_show ว่าไม่ว่าง”

| Migration | `create_appointment` conflict | `get_busy_intervals` busy |
|---|---|---|
| 0002 | `confirmed` | `confirmed` |
| 0010 | `confirmed, completed, no_show` | เหมือนกัน |
| **0011** | **`confirmed, completed`** (ตัด no_show) | **เหมือนกัน** |
| 0013 | ยัง `confirmed, completed` (+ `customer_line_id`) | **ไม่ได้ redefine** → คงค่า 0011 |

ทั้งสองฝั่ง **สอดคล้องกัน**: หลัง 0011 ช่อง no-show **จองใหม่ได้** และ busy **ไม่นับ** no-show

App layer ตรงกัน: `isBlockingStatus` = confirmed|completed (`appointment-status.ts`)

**ความไม่สอดคล้องจริงที่พบ (คนละเรื่อง):**
- Admin board ใช้ `isOccupyingStatus` รวม `no_show` และ `listDayAppointments` ดึง `confirmed|completed|no_show` → บอร์ดยัง**แสดง** no-show เป็นคิว ขณะที่ลูกค้า**จองทับได้** → อาจเห็น confirmed ซ้อนกับ no-show บนบอร์ด
- Exclusion constraint ครอบแค่ `confirmed` แต่ RPC กัน `completed` ด้วย → insert ตรงๆ ที่ข้าม RPC อาจซ้อนกับ completed ได้ (path ปกติผ่าน service role RPC จึงปลอดภัย)

---

## 3) Walk-in ปัจจุบัน

| ข้อเท็จจริง | หลักฐาน |
|---|---|
| Walk-in = **บล็อกเวลา** ไม่ใช่ appointment | `blocked_slots.reason` default `'walk-in'` (`0001`) |
| UI แอดมินบล็อกด้วย reason ตายตัว `"walk-in"` | `src/app/admin/page.tsx`, `QuickBlockGrid.tsx` |
| API | `POST /api/[shop]/block` → `createBlock` |
| บอร์ด | `getAdminDay`: block มาก่อน booked → `kind: "blocked"` |
| สถิติ `walkIns` | `scopedBlocks.length` — **นับบล็อกทุก reason** ไม่กรองเฉพาะ walk-in (`stats-service.ts`) |

**ผลกระทบต่อเฟสถัดไป (ยังไม่ทำตอนนี้):**
- ต้อง migration: `source`, ทำให้ `customer_phone`/`customer_ref` nullable (หรือ sentinel), สถานะ `left` ถ้าต้องการ
- แทนที่/ลดการใช้ block สำหรับ walk-in → สร้าง appointment จริง + ชื่ออัตโนมัติ `Walk-in #N`
- ปรับ stats ให้แยก `line` / `staff_phone` / `walk_in` และเลิกใช้บล็อกเป็น proxy ของ walk-in
- `createBooking` ปัจจุบันบังคับเบอร์+กริด+ห้ามอดีต → ต้องมี staff path แยก

---

## 4) การเชื่อม LINE

| ส่วน | สถานะ | path |
|---|---|---|
| LIFF / LINE Login | **ID เดียวทั้งแพลตฟอร์ม** `NEXT_PUBLIC_LIFF_ID` | `use-line-auth.ts`, `liff-url.ts` |
| ตรวจ token ฝั่ง server | `GET https://api.line.me/v2/profile` | `line-verify.ts` |
| Messaging push | **token เดียว** `LINE_CHANNEL_ACCESS_TOKEN` · ไม่มี token ข้ามเงียบๆ | `push-message.ts` |
| ใครได้รับ push | **เฉพาะลูกค้าตอนจองสำเร็จ** | `api/[shop]/bookings/route.ts` → `sendBookingConfirm` |
| แจ้งร้านเมื่อมีคิวใหม่/ยกเลิก | **ไม่มี** | ค้นทั้ง repo ไม่พบ |
| Webhook รับข้อความเข้า | **ไม่มี** route | `.env.example` ระบุ `LINE_CHANNEL_SECRET` “Declared but unused” และไม่มีการอ้างในโค้ด |
| OA ต่อร้าน | ช่วยติดตั้งด้วยมือผ่าน `line_oa_install_requests` | `0019`, onboarding |

Mock: ถ้าไม่มี LIFF ID (non-production) Bearer ถูกใช้เป็น userId โดยตรง — production ห้ามผ่าน `assertProductionConfig`

---

## 5) Migrations 0001 → 0025 (สรุป)

| # | งานหลัก |
|---|---|
| 0001 | schema + GiST exclusion (appointments confirmed-only, blocked unconditional) |
| 0002 | RPC จอง/บล็อก/ยกเลิก/busy |
| 0003 | RLS เปิด + grant mutators → service_role; busy → anon/auth/service |
| 0004–0008 | seed barbers/staff, shop_settings, staff tokens |
| 0009 | recurring_breaks |
| 0010 | outcome / no_show · ขยาย conflict ให้รวม no_show |
| **0011** | นโยบายยกเลิก 60 นาที · **ตัด no_show ออกจาก conflict+busy** |
| 0012 | staff cancel |
| 0013 | customer_line_id + create_appointment 6 args |
| 0014–0018 | multi-shop, invite, slug, hours, regenerate invite |
| 0019 | LINE OA install requests |
| 0020–0022 | is_active, profile/cover + storage |
| 0023–0024 | trial leads + CRM notes |
| 0025 | shop managers |

**จุดที่ควรจด:**
- `shops` **ไม่มี RLS** (ตารางอื่นเปิด RLS แล้วมักไม่มี policy → ปฏิเสธ anon; แอปใช้ service role)
- `get_busy_intervals` ยัง grant ให้ `anon` (0003) — ถ้ามี anon key สาธารณะและรู้ barber UUID เรียกผ่าน REST ได้
- ไม่มี migration เรื่อง `source` / walk-in-as-appointment

---

## 6) Test coverage

| สคริปต์ | ผลล่าสุด (local) | ครอบคลุม |
|---|---|---|
| `test:security` | 217 pass | auth, env hardening, invite, manager, trial CRM, founder-qa |
| `test:shop` | 50 pass | hours, breaks, board visibility, cover |
| `test:booking` | 26 pass | customer-flow (รวม conflict ใน memory), success UX |
| `test:onboarding` | 44 pass | activation, setup UX, LINE OA install |

**ช่องว่างสำคัญ**
- ไม่มีเทส Postgres จริง (exclusion / advisory lock / concurrent booking)
- ไม่มีเทส no_show ว่าจองทับได้แต่ยังโชว์บนบอร์ด
- ไม่มีเทส `createBlock` / สถิติ walkIns
- push LINE เทสแค่ “ไม่มี token แล้วไม่พัง”
- ไม่มีเทส tenant leak ระดับ query (ดูข้อ G11 ด้านล่าง)

---

## 7) ความเสี่ยงด้านความปลอดภัย

| ความเสี่ยง | รายละเอียด |
|---|---|
| Service role เป็นประตูหลัก | ทุกการเขียนผ่าน `SUPABASE_SERVICE_ROLE_KEY` · tenancy อยู่ใน TypeScript (`assertStaffForShop` ฯลฯ) ไม่ใช่ RLS ต่อร้าน |
| `shops` ไม่มี RLS | ผิดพลาดของ client/query อาจกว้างกว่าที่คิด |
| Superadmin = shared token | เก็บใน sessionStorage · XSS บน `/superadmin` = ได้สิทธิ์เต็ม |
| Legacy staff token `x-admin-token` | ยังรับอยู่คู่กับ LINE |
| Legacy unscoped API/UI | `src/app/admin/*`, `/api/bookings` ฯลฯ ยังอยู่คู่กับ `[shop]` |
| `getAdminDay` ดึงคิวทั้งระบบต่อวัน | `listDayAppointments` ไม่กรอง `shop_id` แล้วกรองในหน่วยความจำ — ตอนนี้เทส isolation ผ่าน แต่ scale/ผิดพลาดเสี่ยง |
| Secrets ที่ประกาศแต่ไม่ใช้ | `ADMIN_SECRET_KEY`, `LINE_CHANNEL_SECRET` |
| Anon เรียก busy RPC ได้ | ดูด้านบน |

---

## 8) สิ่งที่โค้ดต้องเปลี่ยนในเฟสถัดไป (ชี้เป้า — ยังไม่ implement)

อิงแผน MVP / walk-in analysis / LIFF review ที่แนบมา:

| ฟีเจอร์ที่กำลังมา | จุดในโค้ดที่ต้องแตะ |
|---|---|
| พนักงานลงคิวจากโทร (ไม่มี LINE) | `createBooking` + `create_appointment` (บังคับ ref/phone), API admin ใหม่, UI บอร์ด |
| Walk-in เป็น appointment + `source` + `Walk-in #N` | migration, เลิกพึ่ง `blocked_slots` สำหรับ walk-in, `QuickBlockGrid`, stats |
| สถานะ `left` | check constraint statuses, outcome UI, `isOccupying`/`isBlocking` |
| แจ้ง LINE ไปที่ร้าน | `push-message.ts` + จุดเรียกหลัง create/cancel · ยังเป็น channel กลาง |
| รีดีไซน์ LIFF booking | `BookingApp.tsx` และลูกค้า components · ยืนยันยกเลิก · error/network states · viewport zoom |
| แยกสถิติตามช่องทาง (I9) | `stats-service.ts` ต้องเลิกใช้ `walkIns = blocks.length` และเลิกพึ่ง phone เป็น unique key สำหรับ walk-in |

---

## 9) ความเสี่ยงเรียงลำดับสำหรับเฟสถัดไป

1. **P0/P1 เสร็จแล้วแต่ lint ยังไม่ blocking** — 29 errors ส่วนใหญ่ `react-hooks/set-state-in-effect` · CI เห็นแต่ไม่ล้ม · ต้องเคลียร์ก่อนบังคับ lint
2. **ไม่มี QA/Staging + ไม่มี webhook/OA ต่อร้าน** — ทดสอบ LINE จริงและแจ้งร้าน (M7) ติดที่ ops + คำตอบ Q1 เรื่อง channel
3. **Walk-in/phone booking ต้องแตะ schema NOT NULL** — migration บน prod เป็น 🔴 · กระทบ stats และกันจองซ้อน
4. **Tenant query แบบดึงทั้งระบบ** (`listDayAppointments` / legacy routes) — ควรแก้ก่อนร้านเยอะขึ้น
5. **ความปลอดภัยพึ่ง app-layer + service role** — bug ใน assert = เข้าถึงข้ามร้านได้ · ควรเสริม RLS/policy ระยะกลาง
6. **Exclusion กับ completed/no_show ไม่ตรง UI** — บอร์ดอาจสับสนเมื่อ no-show ถูกจองทับ
7. **Push channel เดียว + ไม่มีแจ้งร้าน** — สถาปัตยกรรมข้อความยังไม่รองรับ multi-OA
8. **เทสไม่มีชั้น DB concurrency** — พึ่ง memory store · อย่ามั่นใจเกินจริงก่อน pilot

---

## 10) บันทึกการตัดสินใจ CI (เฟสนี้)

- เพิ่ม `.github/workflows/ci.yml`: typecheck (หลัง `next typegen`) · tests 4 ชุด · production build ด้วย env placeholder
- **Lint เป็น non-blocking** (`continue-on-error`) พร้อม TODO ใน workflow — เพราะ error ที่เหลือเป็น React hooks pattern ทั่วแอป ไม่ใช่แก้ trivial ใน PR นี้
- แก้ noise เล็กน้อย: ignore `scripts/**` (CJS), ลบ unused imports ใน `memory-store` / `stats-service`, ปรับ destructure ใน settings route → เหลือ **29 errors / 2 warnings**
- ไม่ใส่ production secrets ใน CI
