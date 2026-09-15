# North star

**Positioning (desired direction), not validated outcomes.**

BarberQx is a **booking system for barbershops via LINE**.

**Buyer / economic decision-maker:** the shop owner. Their customer is meant to pick a barber, date, and time and book through the shop’s LINE OA.

## Desired outcomes (not empirically proven)

These are north-star **goals**, not measured results.

**Customer North Star:** จองได้เองโดยไม่ต้องถามร้าน

**Owner North Star:** จัดการคิวได้ง่าย โดยไม่ต้องเป็นผู้เชี่ยวชาญ software

We **want** the shop to spend less time on repetitive queue questions, and the customer to book without waiting for a chat reply. That is the intended value, not a validated impact metric.

## Design around this

- Intended customer flow: choose barber → date → time → confirm.
- Intended owner/staff flow: see and control the queue.
- Staff-assisted booking may still exist when operationally useful. The goal is to **reduce unnecessary manual booking coordination**, not prohibit staff from creating customer bookings.
- Merchant identity stays first on shop customer pages. BarberQx is the platform, not the shop. See [`../BRAND.md`](../BRAND.md).

## Primary ICP

Independent Thai barbershops, initially approximately **2–8 barbers**, where customers book ahead and often choose a specific barber.

## Pricing hypothesis

**HYP-004:** 599 THB / month / shop. Not validated pricing truth. See [01-MARKET-POSITIONING.md](./01-MARKET-POSITIONING.md) and [PD-005](./04-PRODUCT-DECISIONS.md).

## Validation target

Approximately **5** initial Pilot shops. **3–4** willingly continuing at 599 THB/month would be a **strong early commercial signal**, not full PMF.

## Not currently BarberQx

BarberQx is **not** currently:

- POS
- inventory
- payroll
- accounting
- marketplace
- large CRM
- AI chatbot platform
- all-in-one salon management suite

Feature-count leadership is not the strategy.
