# คู่มือตั้งค่า QA Environment (สำหรับ Tommy)

เอกสารนี้พาทำทีละขั้นด้วยบัญชีของคุณเอง — **อย่าแตะ Production**  
เป้าหมาย: มีสภาพแวดล้อม QA แยกก่อนเฟส P3 (ที่มี migration ฐานข้อมูล)

| | |
|---|---|
| ร้านทดสอบใน QA | slug `barberqpilottest` (ชื่อ BarberQ Pilot Test) |
| โค้ด bootstrap | `supabase/founder-qa/bootstrap.sql` |
| คำสั่งเช็คพร้อม | `npm run qa:verify` (ต้องตั้ง `BARBERQ_ENV=founder_qa`) |
| Runbook ละเอียด | `docs/barberqx-os/runbooks/FQA-00-21-FOUNDER-QA.md` |

**ห้าม** ใส่ service-role key, LINE token, หรือข้อมูลลูกค้าจริงลงใน git / chat / PR

---

## ภาพรวมสิ่งที่ต้องมี (ของแยกจาก Production ทั้งหมด)

1. **Supabase โปรเจกต์ใหม่** สำหรับ QA  
2. **LINE LIFF (+ Messaging ถ้าจะทดสอบ push)** สำหรับ QA  
3. **Vercel** โปรเจกต์แยก *หรือ* โฮสต์ QA แยก (แนะนำโปรเจกต์แยก)  
4. ค่า env ของ QA เท่านั้น — **ห้ามคัดลอก key จาก Production มาใส่**

---

## ส่วนที่ 1 — สร้าง Supabase โปรเจกต์ QA แล้วใส่ schema

### 1.1 สร้างโปรเจกต์

1. เปิด [https://supabase.com/dashboard](https://supabase.com/dashboard) ด้วยบัญชีของคุณ  
2. **New project** → ตั้งชื่อเช่น `barberq-qa`  
3. เลือก region ที่สะดวก รอจน Ready  
4. จดค่าเหล่านี้จาก **Project Settings → API** (เก็บไว้ในที่ปลอดภัย ไม่ใส่ใน git):
   - **Project URL** → จะเป็น `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (**ความลับสูง — อย่าโชว์ใคร**)
5. จด **Reference ID** ของโปรเจกต์ (ใน Settings → General) เช่น `abcdefghijklmnop`  
   → ใช้ทีหลังใส่ใน `src/lib/founder-qa/manifest.ts` ช่อง `qaSupabaseProjectRef`

### 1.2 ใส่ migrations ทุกไฟล์ตามลำดับ (0001 → 0025)

Repo นี้เก็บ SQL ไว้ที่ `supabase/migrations/` เรียงเลขแล้ว **ยังไม่มี** `supabase/config.toml` สำหรับ remote link เป็นหลัก — สำหรับมือใหม่ใช้ **SQL Editor** ปลอดภัยที่สุด

**วิธี A (แนะนำ): รวมไฟล์แล้ววางครั้งเดียว**

บนเครื่องที่ clone repo แล้ว:

```bash
chmod +x scripts/concat-migrations.sh
./scripts/concat-migrations.sh > /tmp/barberq-qa-schema.sql
```

1. เปิด Supabase โปรเจกต์ **QA** → **SQL Editor** → New query  
2. วางเนื้อหาจาก `/tmp/barberq-qa-schema.sql` ทั้งหมด  
3. กด **Run** รอจนสำเร็จ  
4. ถ้า error กลางทาง: **อย่า** ไปรันซ้ำบน Production — แก้เฉพาะโปรเจกต์ QA (อาจสร้างโปรเจกต์ใหม่ถ้าพังหนัก)

**วิธี B: วางทีละไฟล์**

ใน SQL Editor รันทีละไฟล์ตามลำดับชื่อ:

`0001_schema.sql` → `0002_functions.sql` → … → `0025_shop_managers.sql`

รายการเต็มอยู่ในโฟลเดอร์ `supabase/migrations/`

> หมายเหตุ: migration เหล่านี้มี seed ร้าน demo **PHINX STUDIO** (`phinxstudio`) ด้วย ซึ่งเป็นข้อมูลปลอมใน schema ไม่ใช่ลูกค้าจริง — บน QA ปล่อยไว้ได้ แต่**อย่าใช้ PHINX เป็นร้านทดสอบหลัก** (ใช้ `barberqpilottest`)

### 1.3 ใส่ข้อมูลร้านทดสอบ QA (ปลอดภัย ไม่มีลูกค้าจริง)

ยังอยู่ใน SQL Editor ของโปรเจกต์ **QA** เท่านั้น:

1. เปิดไฟล์ `supabase/founder-qa/bootstrap.sql` ใน repo  
2. คัดลอกทั้งหมด → วางใน SQL Editor → **Run**

ได้:
- ร้าน `barberqpilottest` (สถานะ `pending` รอ Owner claim)
- ร้าน sentinel สำหรับเทสแยก tenant
- ช่าง Johnny / Peter / Jack (ไม่มี LINE id, ไม่มีเบอร์ลูกค้า)

**ห้าม** รัน `bootstrap.sql` บน Production

---

## ส่วนที่ 2 — สร้าง LINE LIFF (และ Messaging) สำหรับ QA

Production ใช้ LIFF ID / channel token **คนละชุด** กับ QA

### 2.1 สร้าง Provider / Channel

1. เปิด [https://developers.line.biz/console/](https://developers.line.biz/console/)  
2. สร้าง **Provider** ใหม่หรือใช้ provider แยกสำหรับ QA (แนะนำแยกจาก Production)  
3. สร้าง **LINE Login** channel สำหรับ QA (ชื่อเช่น `BarberQ QA Login`)  
4. (ถ้าจะทดสอบข้อความยืนยันจอง) สร้าง **Messaging API** channel สำหรับ QA ด้วย แล้วคัดลอก **Channel access token** → เป็น `LINE_CHANNEL_ACCESS_TOKEN` ของ QA  
   - ถ้ายังไม่เทส push: เว้นว่างได้ — แอปจะข้ามการส่งข้อความ (จองยังทำงาน)

### 2.2 สร้าง LIFF app

ใน LINE Login channel ของ QA:

1. แท็บ **LIFF** → **Add**  
2. ตั้งค่าประมาณนี้:

| ช่อง | ค่าที่ใส่ |
|---|---|
| LIFF app name | เช่น `BarberQ QA` |
| Size | Full |
| **Endpoint URL** | URL ของเว็บ QA หลัง deploy (ดูส่วน 3) เช่น `https://barberq-qa.vercel.app` **ไม่มี** `/` ท้าย และ **ไม่มี** path ร้าน |
| Scope | `profile`, `openid` (ตามที่ Console บังคับ) |
| Bot link | ตามต้องการ (มักไม่บังคับสำหรับจอง) |

3. บันทึกแล้วคัดลอก **LIFF ID** → เป็น `NEXT_PUBLIC_LIFF_ID` ของ QA

### 2.3 URL ที่ลูกค้าเปิดจริงใน LINE

โค้ดสร้างลิงก์แบบ:

`https://liff.line.me/{LIFF_ID}/{shopSlug}`

ตัวอย่างร้านทดสอบ:

`https://liff.line.me/{LIFF_ID_ของ_QA}/barberqpilottest`

Endpoint URL ใน Console ต้องชี้ไปที่ **โดเมน QA ราก** (`NEXT_PUBLIC_APP_URL`) ไม่ใช่ path ของร้าน

> หลังได้โดเมน Vercel QA แล้ว กลับมาแก้ Endpoint URL ใน LINE Console ให้ตรงทุกตัวอักษร (https, ไม่มี slash ท้าย)

`LINE_CHANNEL_SECRET` มีใน `.env.example` แต่**โค้ดยังไม่ใช้** (ไม่มี webhook) — ไม่ต้องตั้งก็ได้ในตอนนี้

---

## ส่วนที่ 3 — Vercel สำหรับ QA + รายการ env ทั้งหมด

### 3.1 เลือกแบบติดตั้ง (Tommy ต้องตัดสินใจ)

| ทางเลือก | ข้อดี | ข้อควรระวัง |
|---|---|---|
| **ก) Vercel โปรเจกต์แยก** (แนะนำ — ตรงกับ runbook Founder QA) | แยก env ชัด, deploy Production ของร้านจริงไม่ปน | ตั้ง Git ผูก repo เดิม แล้วเลือก branch ที่จะ auto-deploy |
| **ข) Branch `qa` ในโปรเจกต์เดิม** | โปรเจกต์เดียว | ต้องแยก Environment / Domain ระวังอย่าทับ Production vars |

คู่มือด้านล่างเน้น **ทางเลือก ก**

### 3.2 สร้างโปรเจกต์ Vercel QA

1. เปิด [Vercel Dashboard](https://vercel.com) → **Add New Project** → Import repo `TommyKawila/BarberQ`  
2. ตั้งชื่อเช่น `barberq-qa`  
3. Framework: Next.js (auto)  
4. **ยังไม่ Deploy** จนกว่าจะใส่ env (หรือ Deploy แล้วค่อยใส่แล้ว Redeploy)  
5. หลังมี URL เช่น `https://barberq-qa.vercel.app` → ใช้เป็น `NEXT_PUBLIC_APP_URL` และเป็น **LIFF Endpoint URL**  
6. (ทางเลือก) ผูก Custom Domain สำหรับ QA แยกจากโดเมน Production

แนะนำให้ Production Deployment ของโปรเจกต์นี้ชี้ branch เช่น `main` **เฉพาะเมื่อคุณตั้งใจให้ main = QA** หรือใช้ branch ชื่อ `qa` เป็น Production Branch ของโปรเจกต์ QA นี้ — **อย่า** เปลี่ยนการตั้งค่าของโปรเจกต์ Production เดิม

### 3.3 ตาราง env ที่แอปอ่านจริง (grep จากโค้ด)

ใส่ใน Vercel โปรเจกต์ **QA** → Settings → Environment Variables  
ทำเครื่องหมาย Environment = **Production** ของโปรเจกต์ QA (และ Preview ถ้าต้องการ)

| ตัวแปร | จำเป็น? | มาจากไหน | ต้องต่างจาก Production? | หมายเหตุ |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ใช่ | Supabase QA → Project URL | **ใช่** | ฝั่ง client+server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | แนะนำ | Supabase QA → anon key | **ใช่** | มีใน client helper; แอปเขียนข้อมูลผ่าน service role เป็นหลัก |
| `SUPABASE_SERVICE_ROLE_KEY` | ใช่ | Supabase QA → service_role | **ใช่** | ลับมาก — อย่าใส่ใน client / git |
| `NEXT_PUBLIC_LIFF_ID` | ใช่ | LINE Developers → LIFF ID ของ QA | **ใช่** | ถ้าไม่ตั้ง โหมด mock (Production/QA จริงห้าม) |
| `NEXT_PUBLIC_APP_URL` | ใช่ | URL เว็บ QA เช่น `https://barberq-qa.vercel.app` | **ใช่** | ต้องตรง LIFF Endpoint |
| `SUPERADMIN_TOKEN` | ใช่ | สร้างรหัสสุ่มใหม่สำหรับ QA | **ใช่** | ใช้เข้า `/superadmin` |
| `BARBERQ_ENV` | ใช่สำหรับ QA tooling | ใส่ค่าคงที่ `founder_qa` | **ใช่** (Production ใช้ `production` หรือว่างตามที่ตั้ง) | บังคับก่อน `qa:verify` / `qa:reset` |
| `LINE_CHANNEL_ACCESS_TOKEN` | ไม่บังคับ | Messaging API QA | **ใช่** ถ้าใช้ | ไม่มี = จองได้แต่ไม่ส่ง LINE |
| `NEXT_PUBLIC_LINE_OA_ADD_URL` | ไม่บังคับ | ลิงก์ Add Friend ของ OA QA | ควรเป็นของ QA | ไม่มี = ซ่อนปุ่มเพิ่มเพื่อน |
| `NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL` | ไม่บังคับ | ลิงก์ซัพพอร์ต | ตามต้องการ | หน้า marketing / trial |
| `ADMIN_SECRET_KEY` | ไม่ใช้ | — | — | ประกาศใน `.env.example` แต่โค้ดไม่ได้อ่าน |
| `LINE_CHANNEL_SECRET` | ไม่ใช้ | — | — | ยังไม่มี webhook |
| `VERCEL_URL` | อัตโนมัติ | Vercel ใส่เอง | — | โค้ดมี fallback ในบาง API; คุณไม่ต้องตั้ง |
| `NODE_ENV` | อัตโนมัติ | Next/Vercel ใส่ `production` ตอน build | — | ไม่ต้องตั้งเอง |

ค่าที่ **ต้องต่างจาก Production เสมอ:**  
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_LIFF_ID`, `NEXT_PUBLIC_APP_URL`, `SUPERADMIN_TOKEN`, `BARBERQ_ENV`, และถ้ามี `LINE_CHANNEL_ACCESS_TOKEN` / `NEXT_PUBLIC_LINE_OA_ADD_URL`

### 3.4 Deploy แล้วเช็คหน้าเว็บ

1. Deploy โปรเจกต์ QA  
2. เปิด `https://<โดเมน-QA>/superadmin` ใส่ `SUPERADMIN_TOKEN` ของ QA  
3. **อย่าตกใจถ้า** `https://<โดเมน-QA>/barberqpilottest` ได้ **404** — ในโค้ด (`src/app/[shop]/layout.tsx`) ร้านที่ `status !== "active"` ถูก `notFound()` จงใจ ดังนั้นร้าน `pending` (ยังไม่ claim) = 404 เป็นพฤติกรรมปกติ ไม่ใช่ env พัง  
4. ต้อง Owner claim ให้ร้านเป็น `active` ก่อน หน้าจอง/บอร์ดถึงจะเปิดได้ (ดูส่วน 4.1)

### 3.5 อัปเดต manifest ใน repo (หลังได้ Project Ref + Hostname จริง)

ไฟล์ `src/lib/founder-qa/manifest.ts` ยังเป็น placeholder:

- `qaSupabaseProjectRef: "unprovisioned-founder-qa"`
- `qaAppHostname: "unprovisioned-founder-qa.example.invalid"`

**หลัง** มี Supabase Ref และโดเมน QA จริงแล้ว ให้เปิด PR เล็กๆ แก้สองค่านี้ให้ตรง (ไม่ใส่ secrets)  
จนกว่าจะแก้ `npm run qa:verify` จะไม่ผ่านเกณฑ์ identity

อย่าแก้ `productionDenylist` / ค่า PHINX

---

## ส่วนที่ 4 — ตรวจว่า QA ใช้ได้

ทำบนโดเมน **QA** และ LINE **QA** เท่านั้น

### 4.1 Owner claim (ครั้งแรก)

1. เข้า `/superadmin` บนโดเมน QA ด้วย token ของ QA  
2. หา/สร้าง Invite ของร้าน **BarberQ Pilot Test** (`barberqpilottest`)  
3. เปิดลิงก์ claim ด้วยบัญชี LINE ที่จะเป็น **Owner ทดสอบ** (ใน LINE ที่มี LIFF QA)  
4. หลัง claim สำเร็จ ร้านควรเป็น `active`

รายละเอียด baselines ดู runbook FQA-00

### 4.2 จองทดสอบผ่าน LIFF

1. ใน LINE มือถือ เปิด  
   `https://liff.line.me/<LIFF_ID_QA>/barberqpilottest`  
2. อนุญาต Login → เลือกช่าง (Johnny/Peter/Jack) → วัน → เวลา → กรอกชื่อ/เบอร์ทดสอบ → ยืนยัน  
3. ควรเห็นหน้าสำเร็จ (ถ้ามี Messaging token ของ QA อาจได้ข้อความยืนยัน)

### 4.3 ดูบอร์ดร้าน

1. เปิด `https://<โดเมน-QA>/barberqpilottest/admin` ใน LIFF/เบราว์เซอร์ ด้วย LINE ของ Owner  
2. ดูคิววันนี้ — ควรเห็นคิวที่เพิ่งจอง

### 4.4 (ทางเลือก) เช็คด้วย CLI

บนเครื่องที่มี env ของ **QA** ใน `.env.local` (อย่า commit):

```bash
# ใน .env.local ต้องมี BARBERQ_ENV=founder_qa และค่า Supabase/LIFF/APP_URL ของ QA
npm run qa:verify
```

ผ่านได้เมื่อ manifest ตรงกับโปรเจกต์/โฮสต์จริง

---

## ส่วนที่ 5 — Workflow ต่อไป (ก่อน/หลัง P3)

```
สร้าง feature branch → เปิด PR → CI เขียว
    → deploy / ชี้ไปที่ QA (โปรเจกต์ Vercel QA หรือ branch ที่ผูก QA)
    → Tommy ทดสอบบน LINE + บอร์ด QA
    → อนุมัติ → squash merge เข้า main
    → Production deploy (โปรเจกต์ Vercel Production เดิม) แยกต่างหาก
```

สำหรับเฟสที่มี **migration** (เช่น P3):

1. ลอง migration บน **Supabase QA ก่อน** (SQL Editor หรือเครื่องมือที่คุณใช้)  
2. ทดสอบจอง/บอร์ดบน QA  
3. ค่อยรัน migration บน Production เมื่อ Tommy อนุมัติ (Gate แดงในแผน MVP)

**อย่า** ใช้ `qa:reset` ชี้ไปที่ Production — เครื่องมือมีตัวกัน แต่ยังต้องตั้ง env ให้ถูก

---

## สิ่งที่ Tommy ต้องตัดสินใจ / ทำต่อ

1. **Vercel:** โปรเจกต์แยก (แนะนำ) หรือ branch `qa` ในโปรเจกต์เดิม?  
2. **โดเมน QA** คืออะไร (default `*.vercel.app` พอ หรือจะซื้อโดเมน)?  
3. **LINE:** สร้าง Login+LIFF แยก และจะเปิด Messaging push บน QA ด้วยไหม?  
4. หลังได้ Project Ref + hostname → เปิด PR เล็กแก้ `src/lib/founder-qa/manifest.ts`  
5. เก็บ secrets ของ QA คนละที่กับ Production (Password manager)  
6. ใครเป็น LINE Owner / Manager / Customer ตอนเทส (สามบัญชีหรือสลับบทบาทอย่างระวัง)

---

## เช็คลิสต์สั้น

- [ ] Supabase QA สร้างแล้ว + จด URL / anon / service_role / project ref  
- [ ] รัน migrations 0001–0025 บน QA แล้ว  
- [ ] รัน `supabase/founder-qa/bootstrap.sql` บน QA แล้ว  
- [ ] LINE LIFF QA + Endpoint = `NEXT_PUBLIC_APP_URL` ของ QA  
- [ ] Vercel QA ใส่ env ครบ (โดยเฉพาะ `BARBERQ_ENV=founder_qa`)  
- [ ] Owner claim ที่ `barberqpilottest` สำเร็จ  
- [ ] จองผ่าน LIFF แล้วเห็นบนบอร์ด  
- [ ] (ถัดไป) อัปเดต `manifest.ts` ด้วย ref + hostname จริงผ่าน PR  

ถ้าติดตรงขั้นไหน บอกขั้นที่เป็นตัวเลขในเอกสารนี้มาได้เลย (อย่าแปะ secrets ในแชท)
