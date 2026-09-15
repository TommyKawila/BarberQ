# UX-001 — Pilot Truth & Positioning Alignment

| | |
|---|---|
| Linked Sprint | [SPR-001 — Pilot Truth & Positioning Alignment](../sprints/SPR-001-PILOT-TRUTH-POSITIONING-ALIGNMENT.md) |
| State at creation | SPR-001 is `READY_FOR_UX` |
| UX recommendation | **UX_APPROVED** |
| Scope | UX/copy and information-hierarchy alignment only |
| Product truth sources | PD-005, PD-006, PD-007, PD-009, PD-010, PD-011; North Star; BRAND.md |

## 1. Purpose

Align the existing public acquisition and customer-facing messaging to one truthful Pilot experience without changing working booking behavior:

> BarberQx is an assisted 30-day Pilot for qualified barber shops. Customers enter from the shop's LINE OA, choose a barber/date/time and book. The shop remains the primary merchant identity and still sees and controls the queue. BarberQx is the booking platform; any platform/system message must identify BarberQx as its actual sender. After the Pilot, the working continuation price to test is 599 THB/month/shop.

This is not a feature or aesthetic-redesign handoff.

## 2. Surface decisions

| Surface | Decision | Required outcome |
|---|---|---|
| Sales Page: offer, CTA, pricing, FAQ, final CTA | **CHANGE** | Replace open Free Trial framing with Assisted 30-Day Pilot truth. |
| Sales Page: outcome and barber-specific differentiation | **CHANGE** | Clarify customer self-books → shop still controls the queue, using shipped capability only. |
| Sales Page: adoption/social-proof copy | **REMOVE** | Remove wording equivalent to “Why barbershops choose BarberQx.” |
| `/trial`: pre-submit, form, success state | **CHANGE** | Make qualification and assisted setup clear; submitting is not instant account access. |
| Booking success: Add Friend/system-message card | **CHANGE** | Identify BarberQx as platform/system-message sender. |
| My Bookings: Add Friend prompt | **CHANGE** | Remove reminder/notification implication; describe confirmation from BarberQx system only. |
| Trial Lead / Super Admin visible wording | **CHANGE** | Use Pilot terminology only; preserve workflow/data model. |
| Customer flow: shop → barber → date → time → confirm | **KEEP** | No workflow redesign. |
| Shop-first customer branding | **KEEP** | Merchant identity remains primary; BarberQx is subtle platform signature. |
| Booking/auth/LIFF/tenant/LINE architecture | **KEEP** | Technical behavior is protected and out of scope. |

## 3. Proposed UX and copy direction

### A. Sales Page

**Change all public open-trial language** to **Assisted 30-Day Pilot**.

Primary CTA:

> สมัครเข้าร่วม Pilot 30 วัน

Expectation near primary CTA or pricing:

> ทีม BarberQx จะติดต่อเพื่อช่วยดูว่าร้านเหมาะกับ Pilot และช่วยตั้งค่าให้พร้อมใช้งาน

Preserve the core outcome:

> ให้ลูกค้าจองคิวร้านคุณเอง ผ่าน LINE

Make the causal story explicit in existing supporting content:

> ลูกค้าเลือกช่าง วัน และเวลาเองได้  
> ร้านยังเห็นและจัดการคิวของแต่ละช่างได้เหมือนเดิม

Replace unsupported social proof:

> From: ทำไมร้านตัดผมเลือก BarberQx  
> To: BarberQx ช่วยให้ร้านจัดการคิวง่ายขึ้นอย่างไร

Pricing:
- Preserve `฿599 / เดือน / ร้าน`.
- Do not present it as validated willingness to pay.
- Add clear continuation expectation:

> หลังจบ Pilot หากเลือกใช้งานต่อ ราคาอยู่ที่ ฿599 / เดือน / ร้าน

Remove:
- visible public “up to 10 barbers” pricing/package promise;
- any FAQ answer that presents ten barbers as validated plan packaging;
- all Free Trial labels in final CTA/trust copy.

Use a final-CTA support statement such as:

> Pilot 30 วันแบบมีทีมช่วยตั้งค่า

### B. `/trial`

Use a qualifying, assisted-Pilot hierarchy.

H1:

> สมัครเข้าร่วม Pilot 30 วันกับ BarberQx

Supporting text:

> สำหรับร้านตัดผมที่ต้องการให้ลูกค้าจองคิวเองผ่าน LINE โดยทีม BarberQx จะช่วยดูแลการตั้งค่าและเริ่มใช้งานกับร้านของคุณ

Pre-submit expectation:

> ส่งข้อมูลร้านแล้ว ทีมเราจะติดต่อเพื่อพูดคุยความเหมาะสมของ Pilot และช่วยวางขั้นตอนเริ่มต้น  
> การส่งฟอร์มยังไม่ใช่การสร้างบัญชีหรือเปิดใช้งานระบบทันที

Trust points:
- Pilot 30 วันแบบมีทีมช่วยดูแล
- ใช้กับ LINE OA ของร้านที่มีอยู่แล้ว
- ช่วยตั้งค่าร้าน ทีมช่าง และปุ่มจอง
- เราไม่ขอรหัสผ่าน LINE OA ของร้าน

Price expectation:

> หลังจบ Pilot หากเลือกใช้งานต่อ ราคาอยู่ที่ ฿599 / เดือน / ร้าน

Submit CTA:

> ส่งข้อมูลเพื่อสมัคร Pilot 30 วัน

Success state:

> เราได้รับข้อมูลร้านแล้ว  
> ทีม BarberQx จะติดต่อเพื่อพูดคุยความเหมาะสมของ Pilot และช่วยวางขั้นตอนตั้งค่าร้านของคุณ

### C. Booking success and My Bookings

Keep booking success, booking details, shop name, and customer action order unchanged.

Where an optional Add Friend/system-message card is shown, use:

Heading:

> รับข้อความยืนยันจาก BarberQx ผ่าน LINE

Body:

> เพิ่มเพื่อน BarberQx เพื่อรับข้อความยืนยันการจองจากระบบ BarberQx

CTA:

> เพิ่มเพื่อน BarberQx

Reassurance:

> ไม่บังคับ • คิวของคุณยืนยันแล้ว

Replace any Add Friend wording that says or implies “แจ้งเตือน” with:

> รับข้อความยืนยันการจองจากระบบ BarberQx

Do not imply that messages are from the shop's LINE OA. Do not claim pre-appointment reminders, no-show prevention, or automatic alerts.

### D. Trial Lead / Super Admin wording

Change visible terminology only:

| Current | Proposed |
|---|---|
| Trial Leads | Pilot Applications |
| Trial Lead | Pilot Applicant |
| Trial form | Pilot application |
| ทดลองใช้ | Pilot 30 วัน |

Do not change statuses, fields, data model, filters, notes, automation, or create a CRM/evidence database.

## 4. User expectation after change

- A prospect understands they are applying for a small, assisted Pilot—not receiving unattended self-service access.
- A qualified shop owner expects contact, qualification, and help with setup before activation.
- The shop's own LINE OA is the entry point for booking.
- A customer understands the booking is with the shop; optional system confirmation messaging comes from BarberQx as the platform.
- The shop continues to own its identity and control each barber’s queue.
- `฿599/month/shop` is the working post-Pilot continuation price to test, not proven market pricing.

## 5. Responsive requirements

Verify all changed surfaces at **375px, 390px, 430px, and desktop**.

- Preserve the current mobile-first hierarchy and CTA destinations.
- Primary Pilot CTAs remain at least 48px high and full width where existing mobile treatment is full width.
- Do not make Pilot wording so long that Hero or CTA layouts become unreadable.
- Booking details and merchant/shop context remain visually above optional BarberQx platform-message UI.
- No horizontal overflow or logo-cropping regression.

## 6. Accessibility requirements

- Preserve semantic labels, focus states, and keyboard-accessible controls.
- Present Pilot expectations and after-submit state as text, not icon-only treatment.
- Nearby text must identify BarberQx as the sender of optional platform/system messages; color alone must not carry this distinction.
- Ensure muted copy remains readable on dark surfaces.
- Preserve existing booking validation, conflict, and cancellation feedback.

## 7. Explicit out of scope

- Customer booking-flow redesign
- Booking confirmation sender-behavior change
- Tenant-specific LINE messaging architecture
- LINE auth, LIFF identity, or tenant-resolution changes
- Reminders, no-show automation, service selection, variable service duration
- Configurable booking horizon or cancellation policy
- Payments/subscriptions
- Stats/navigation redesign
- New CRM, outreach automation, qualification database, or research platform
- Booking transaction/concurrency behavior, authorization, or tenant isolation
- Product Decision changes, new Sprint creation, or Sprint-state transition

## 8. Protected technical boundaries

Do not change:
- booking transaction and double-booking protection;
- shop-scoped data access and tenant isolation;
- customer booking ownership;
- owner/barber authorization or Super Admin separation;
- LINE identity/auth verification or LIFF return flow;
- existing booking create/cancel reliability;
- barber availability and schedule logic;
- merchant-first customer branding;
- existing CTA destination unless a later approved review identifies a contradiction.

## 9. Acceptance criteria

1. Public acquisition uses one coherent **Assisted 30-Day Pilot** model and no longer presents open self-service Free Trial access.
2. `/trial` makes qualification and assisted setup clear before submit and after successful submission.
3. Public price language preserves **฿599/month/shop** as a working continuation price without validating willingness to pay.
4. Public pricing and FAQ do not use “up to 10 barbers” as plan proof, differentiation, or validated packaging.
5. Unsupported customer-adoption/social-proof claims are removed.
6. Existing product mechanisms communicate: customer chooses barber/date/time; shop still sees and controls the queue.
7. Shop LINE OA remains the stated booking entry point; merchant identity remains primary on customer surfaces.
8. Customer-facing Add Friend/system-message wording explicitly identifies BarberQx as the platform/system sender.
9. No reminder, pre-appointment alert, or no-show-reduction claim appears.
10. No code change is required to booking logic, LINE/LIFF/auth, sender behavior, tenancy, authorization, or protected technical boundaries.
11. All affected screens are reviewed at 375px, 390px, 430px, and desktop before QA.

## 10. Product blocker

**None identified.**

PD-009, PD-010, and PD-011 resolve the Product decisions required for this UX proposal. If implementation review finds that sender identity cannot be represented truthfully without changing actual LINE behavior or architecture, return that issue to Product as `NEEDS_PRODUCT_REVIEW`; do not expand SPR-001.
