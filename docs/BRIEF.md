# BarberQx Business Brief

เอกสารอ้างอิงธุรกิจหลักของ BarberQx (BarberQ) — ระบบจองคิว/จองคิวร้านตัดผมผ่าน LINE  
ข้อเท็จจริงที่เปลี่ยนได้ต้องมีแหล่งที่มาและวันที่กำกับ  
ค่าที่ยังยืนยันไม่ได้จาก prompt หรือ repo ให้เป็น `unknown` — ห้ามเดา

---

## ข้อเสนอ (Offer)

BarberQx เป็นแพลตฟอร์มจองคิวสำหรับร้านตัดผม ลูกค้าจองจาก LINE OA ของร้าน ร้านจัดการคิวและทีมช่างจากมือถือ  
_(source: `README.md`, `src/app/page.tsx` metadata — verified 2026-10-15)_

### ฟีเจอร์ที่ใช้งานจริงใน production (P5)

- จองคิวผ่าน LINE
- บอร์ดคิว (queue board)
- จัดการทีมช่าง (staff)
- Walk-in
- จองทางโทรและแชท
- แจ้งเตือนผ่าน LINE
- เตือนก่อนถึงคิว (reminders)
- เปิด/ปิดข้อความยืนยัน (confirmation toggle)
- เครื่องคำนวณต้นทุนข้อความ (message cost calculator)

_(source: Tommy / product status P5 — 2026-10-14)_

### ยังไม่รวมใน production

- P6: ลูกค้าเลื่อนคิวเอง (self-reschedule) — อยู่ใน PR ยังไม่ merge  
- P7: เครื่องมือจัดการ no-show — อยู่ใน PR ยังไม่ merge  

_(source: Tommy — 2026-10-14)_

### อื่น ๆ

- ชื่อสินค้า / แบรนด์: BarberQx (ออกเสียงไทย: บาร์เบอร์ควิกซ์) — _(source: `docs/BRAND.md`, `README.md` — verified 2026-10-15)_
- รายละเอียดสัญญา SLA / การรับประกัน: `unknown`
- ช่องทางชำระเงินรายเดือน: `unknown`

---

## ราคา (Pricing)

อนุมัติโดย Tommy — ทุกแพ็กเกจได้ฟีเจอร์ชุดเดียวกัน

| จำนวนช่าง | ราคา |
| --- | --- |
| 1–2 | ฿399 / เดือน |
| 3–5 | ฿599 / เดือน |
| 6–10 | ฿999 / เดือน |
| มากกว่า 10 | ติดต่อเรา |

เงื่อนไขเพิ่มเติม:

- ทดลองใช้ฟรี 30 วัน ไม่ต้องผูกบัตร แลกกับฟีดแบ็ก
- ยกเลิกได้ทุกเมื่อ
- ฟีเจอร์ใหม่ไม่ทำให้ราคาเพิ่มขึ้น
- ร้านจ่ายค่าอัปเกรด LINE OA push เอง (โควตาฟรี 300 ข้อความ/เดือน)

_(source: Tommy in chat — 2026-10-15)_

หมายเหตุ: หน้า sales ใน repo ยังอาจแสดงช่วงราคา/ข้อความเก่าบางส่วน — ให้ยึดตารางด้านบนเป็นแหล่งธุรกิจหลักจนกว่า sales page จะอัปเดตให้ตรง  
_(source: `src/lib/i18n/dictionary.ts` marketing.pricing.* — verified 2026-10-15)_

---

## กลุ่มลูกค้าเป้าหมาย (Target customers)

- ร้านตัดผมชายในประเทศไทยที่รับคิวผ่าน LINE  
  _(source: task brief / Tommy context — 2026-10-15)_

จากหน้า sales / docs ใน repo (รายละเอียดที่ยืนยันได้):

- กลุ่มที่พูดถึงคือ **ร้านตัดผม** ที่ต้องการให้ลูกค้าจองคิวเองผ่าน **LINE OA ของร้าน**  
  _(source: `src/lib/i18n/dictionary.ts` — `marketing.hero.eyebrow`, `marketing.footer.tagline`, `marketing.trial.subtitle`; `src/app/page.tsx` metadata — verified 2026-10-15)_
- ร้านต้องมี LINE OA ของร้านเอง  
  _(source: `src/lib/i18n/dictionary.ts` — `marketing.pricing.requiresBody` — verified 2026-10-15)_

รายละเอียดที่ยังไม่ยืนยัน:

- ขนาดร้านเป้าหมาย (เมือง/ต่างจังหวัด, เชน vs ร้านเดี่ยว): `unknown`
- ICP / persona เชิง demography เพิ่มเติม: `unknown`
- งบประมาณเฉลี่ยของร้านที่แปลงเป็นลูกค้าจ่ายเงิน: `unknown`
- คู่แข่งที่อ้างอิงอย่างเป็นทางการ: `unknown`

---

## จุดขายเรื่องข้อความ LINE

- ข้อความยืนยันและเตือนคิว **ชนะใจลูกค้า** และคุ้มค่ากับต้นทุนเพียงไม่กี่บาทต่อข้อความ
- มีเครื่องคำนวณต้นทุนข้อความในแอป backing จุดนี้
- ร้านสามารถ **ปิด** การส่งข้อความยืนยันแบบ push ได้

_(source: Tommy — 2026-10-14)_

---

## โทนแบรนด์

สรุปจาก copy หน้า sales ใน repo (ไม่เดาเกินข้อความที่มี):

- พูดตรง เน้นปัญหาจริงของร้าน (ตอบแชทเรื่องคิวทั้งวัน, คิวจดกระดาษ, walk-in ชนคิวจอง)
- ภาษาคุยกับเจ้าของร้าน/ช่าง ไม่ใช่ภาษาองค์กร
- เน้นใช้งานได้จริง ความครบของบอร์ดคิว และความง่าย (จองใน LINE ไม่ต้องโหลดแอป)
- โทนมั่นใจ แต่ย้ำว่าไม่มีตัวเลขปลอม/ฟีเจอร์ที่ยังไม่พร้อม

_(source: `src/lib/i18n/dictionary.ts` — keys `marketing.pain.*`, `marketing.hero.*`, `marketing.features.*`, `marketing.final.*` — verified 2026-10-15)_

ลักษณะภาพแบรนด์ที่อนุมัติใน brand guide (เสริม ไม่แทน copy หน้า sales): Premium / Modern / Confident / Masculine / Simple / Slightly Hipster / Technology-first  
_(source: `docs/BRAND.md` §2 Brand character — verified 2026-10-15)_

โทนเสียงสำหรับโซเชียล / สคริปต์ขายนอก sales page: `unknown`

---

## การกระทำที่ต้องถาม Tommy ก่อนเสมอ

ถาม Tommy ก่อนทุกครั้ง ก่อนทำสิ่งต่อไปนี้:

1. Merge PR ใด ๆ
2. รันอะไรก็ตามบน production (SQL, env, deploys)
3. เปลี่ยนราคา
4. ส่งข้อความถึงลูกค้าหรือร้าน
5. ใช้จ่ายเงิน หรืออัปเกรดแพ็กเกจ (เช่น Vercel Pro)

_(source: Tommy / operating rule — 2026-10-15)_
