import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { addMinutes } from "date-fns";
import { memoryStore } from "@/lib/data/memory-store";
import { StoreConflict } from "@/lib/data/types";
import { dictionary } from "@/lib/i18n/dictionary";
import { shouldSendLineReschedulePush } from "@/lib/line/shop-reschedule-notify";
import {
  BookingError,
  rescheduleBookingByToken,
  staffRescheduleBooking,
} from "@/lib/services/booking-service";
import {
  canCustomerReschedule,
  CANCEL_LEAD_MINUTES,
  MAX_RESCHEDULE_COUNT,
} from "@/lib/services/slot-service";
import { buildWebPushPayload } from "@/lib/webpush/notify";

const root = resolve(import.meta.dirname, "../..");

describe("P6 customer self-reschedule", () => {
  it("exports MAX_RESCHEDULE_COUNT = 1 and shares cancel lead minutes", () => {
    assert.equal(MAX_RESCHEDULE_COUNT, 1);
    assert.equal(CANCEL_LEAD_MINUTES, 60);
  });

  it("canCustomerReschedule requires confirmed + token + count < 1 + 60m lead", () => {
    const start = addMinutes(new Date(), 120).toISOString();
    assert.equal(
      canCustomerReschedule({
        status: "confirmed",
        start_time: start,
        cancel_token: "abc",
        reschedule_count: 0,
      }),
      true,
    );
    assert.equal(
      canCustomerReschedule({
        status: "confirmed",
        start_time: start,
        cancel_token: "abc",
        reschedule_count: 1,
      }),
      false,
    );
    assert.equal(
      canCustomerReschedule({
        status: "confirmed",
        start_time: addMinutes(new Date(), 30).toISOString(),
        cancel_token: "abc",
        reschedule_count: 0,
      }),
      false,
    );
  });

  it("atomic move keeps old booking when new slot is taken", async () => {
    const barbers = await memoryStore.listBarbers();
    const barber = barbers[0];
    assert.ok(barber);

    const startA = addMinutes(new Date(), 24 * 60);
    startA.setSeconds(0, 0);
    const startB = addMinutes(startA, barber.slot_duration_minutes);
    const endA = addMinutes(startA, barber.slot_duration_minutes);
    const endB = addMinutes(startB, barber.slot_duration_minutes);

    const first = await memoryStore.createAppointment({
      barberId: barber.id,
      customerRef: `U-first-${Date.now()}`,
      customerName: "First",
      customerPhone: "0811111111",
      startTime: startA,
      endTime: endA,
      customerLineId: `U-first-${Date.now()}`,
      source: "line",
    });
    const second = await memoryStore.createAppointment({
      barberId: barber.id,
      customerRef: `U-second-${Date.now()}`,
      customerName: "Second",
      customerPhone: "0822222222",
      startTime: startB,
      endTime: endB,
      customerLineId: `U-second-${Date.now()}`,
      source: "line",
    });

    await assert.rejects(
      () =>
        memoryStore.rescheduleAppointmentByToken(
          first.cancel_token!,
          barber.id,
          startB,
          endB,
        ),
      (err: unknown) => err instanceof StoreConflict && err.code === "SLOT_TAKEN",
    );

    const stillFirst = await memoryStore.getAppointment(first.id);
    assert.equal(stillFirst?.start_time, first.start_time);
    assert.equal(stillFirst?.barber_id, first.barber_id);
    assert.equal(stillFirst?.reschedule_count ?? 0, 0);
    assert.equal((await memoryStore.getAppointment(second.id))?.status, "confirmed");
  });

  it("customer reschedule increments count and blocks second move", async () => {
    const barbers = await memoryStore.listBarbers();
    const barber = barbers[0];
    const start = addMinutes(new Date(), 26 * 60);
    start.setSeconds(0, 0);
    const end = addMinutes(start, barber.slot_duration_minutes);
    const nextStart = addMinutes(start, barber.slot_duration_minutes * 2);
    const nextEnd = addMinutes(nextStart, barber.slot_duration_minutes);

    const apt = await memoryStore.createAppointment({
      barberId: barber.id,
      customerRef: `U-r1-${Date.now()}`,
      customerName: "Res",
      customerPhone: "0833333333",
      startTime: start,
      endTime: end,
      customerLineId: `U-r1-${Date.now()}`,
      source: "line",
    });

    const moved = await memoryStore.rescheduleAppointmentByToken(
      apt.cancel_token!,
      barber.id,
      nextStart,
      nextEnd,
    );
    assert.equal(moved.after.reschedule_count, 1);
    assert.equal(moved.after.start_time, nextStart.toISOString());

    const later = addMinutes(nextStart, barber.slot_duration_minutes * 2);
    await assert.rejects(
      () =>
        memoryStore.rescheduleAppointmentByToken(
          apt.cancel_token!,
          barber.id,
          later,
          addMinutes(later, barber.slot_duration_minutes),
        ),
      (err: unknown) => err instanceof StoreConflict && err.code === "RESCHEDULE_LIMIT",
    );
  });

  it("rejects customer reschedule inside 60-minute lead", async () => {
    const barbers = await memoryStore.listBarbers();
    const barber = barbers[0];
    const start = addMinutes(new Date(), 30);
    const end = addMinutes(start, barber.slot_duration_minutes);
    const apt = await memoryStore.createAppointment({
      barberId: barber.id,
      customerRef: `U-late-${Date.now()}`,
      customerName: "Late",
      customerPhone: "0844444444",
      startTime: start,
      endTime: end,
      customerLineId: `U-late-${Date.now()}`,
      source: "line",
    });
    await assert.rejects(
      () =>
        memoryStore.rescheduleAppointmentByToken(
          apt.cancel_token!,
          barber.id,
          addMinutes(start, 60),
          addMinutes(start, 60 + barber.slot_duration_minutes),
        ),
      (err: unknown) => err instanceof StoreConflict && err.code === "TOO_LATE",
    );
  });

  it("staff reschedule does not consume customer reschedule_count", async () => {
    const barbers = await memoryStore.listBarbers();
    const a = barbers[0];
    const b = barbers[1] ?? barbers[0];
    const start = addMinutes(new Date(), 28 * 60);
    start.setSeconds(0, 0);
    const end = addMinutes(start, a.slot_duration_minutes);
    const apt = await memoryStore.createAppointment({
      barberId: a.id,
      customerRef: `U-staff-${Date.now()}`,
      customerName: "StaffMove",
      customerPhone: "0855555555",
      startTime: start,
      endTime: end,
      customerLineId: `U-staff-${Date.now()}`,
      source: "line",
    });
    const nextStart = addMinutes(start, a.slot_duration_minutes);
    const result = await memoryStore.staffRescheduleAppointment(
      apt.id,
      b.id,
      nextStart,
      addMinutes(nextStart, b.slot_duration_minutes),
    );
    assert.equal(result.after.barber_id, b.id);
    assert.equal(result.after.reschedule_count ?? 0, 0);
  });

  it("staffRescheduleBooking still works when customer already used 1-time limit", async () => {
    const barbers = await memoryStore.listBarbers();
    const a = barbers[0];
    const b = barbers[1] ?? barbers[0];
    const start = addMinutes(new Date(), 30 * 60);
    start.setSeconds(0, 0);
    const end = addMinutes(start, a.slot_duration_minutes);
    const apt = await memoryStore.createAppointment({
      barberId: a.id,
      customerRef: `U-quota-${Date.now()}`,
      customerName: "QuotaUsed",
      customerPhone: "0866666666",
      startTime: start,
      endTime: end,
      customerLineId: `U-quota-${Date.now()}`,
      source: "line",
    });
    const afterCustomer = addMinutes(start, a.slot_duration_minutes * 2);
    const customerMove = await memoryStore.rescheduleAppointmentByToken(
      apt.cancel_token!,
      a.id,
      afterCustomer,
      addMinutes(afterCustomer, a.slot_duration_minutes),
    );
    assert.equal(customerMove.after.reschedule_count, 1);

    await assert.rejects(
      () =>
        rescheduleBookingByToken(
          apt.cancel_token!,
          a.id,
          addMinutes(afterCustomer, a.slot_duration_minutes * 2).toISOString(),
        ),
      (err: unknown) =>
        err instanceof BookingError && err.code === "RESCHEDULE_LIMIT",
    );

    const staffTarget = addMinutes(afterCustomer, a.slot_duration_minutes * 3);
    const staffMove = await staffRescheduleBooking(
      apt.id,
      b.id,
      staffTarget.toISOString(),
    );
    assert.equal(staffMove.after.barber_id, b.id);
    assert.equal(staffMove.after.start_time, staffTarget.toISOString());
    assert.equal(staffMove.after.reschedule_count ?? 0, 1);
  });

  it("Thai copy covers slot-taken keep-old and เลื่อนคิว label", () => {
    assert.match(dictionary.th["booking.reschedule"], /เลื่อนคิว/);
    assert.match(dictionary.th["booking.rescheduleSlotTaken"], /คิวเดิมของคุณยังอยู่/);
    assert.match(dictionary.th["marketing.features.5.title"], /แจ้งยกเลิก–เลื่อนผ่าน LINE/);
  });

  it("migration 0034 defines reschedule_count + atomic RPCs", () => {
    const sql = readFileSync(
      resolve(root, "../supabase/migrations/0034_customer_reschedule.sql"),
      "utf8",
    );
    assert.match(sql, /reschedule_count/);
    assert.match(sql, /reschedule_appointment_by_token/);
    assert.match(sql, /staff_reschedule_appointment/);
    assert.match(sql, /interval '60 minutes'/);
    assert.match(sql, /RESCHEDULE_LIMIT/);
  });

  it("My Queue wires เลื่อนคิว + in-LIFF confirm (no native select)", () => {
    const page = readFileSync(resolve(root, "app/(app)/bookings/page.tsx"), "utf8");
    const flow = readFileSync(
      resolve(root, "components/customer/RescheduleFlow.tsx"),
      "utf8",
    );
    assert.match(page, /RescheduleFlow/);
    assert.match(page, /booking\.reschedule/);
    assert.match(flow, /reschedule-confirm/);
    assert.match(flow, /BarberSelector/);
    assert.match(flow, /SlotPicker/);
    assert.doesNotMatch(flow, /<select/);
  });

  it("shop board wires buildShopRescheduleFlex via push_reschedule", () => {
    const notify = readFileSync(
      resolve(root, "lib/line/shop-reschedule-notify.ts"),
      "utf8",
    );
    const route = readFileSync(
      resolve(root, "app/api/appointments/[id]/reschedule/route.ts"),
      "utf8",
    );
    assert.match(notify, /buildShopRescheduleFlex/);
    assert.match(notify, /push_reschedule/);
    assert.match(notify, /shouldSendLineReschedulePush/);
    assert.match(route, /notifyCustomerShopReschedule/);
    assert.equal(shouldSendLineReschedulePush({ customer_line_id: "U1" }), true);
    assert.equal(shouldSendLineReschedulePush({ customer_line_id: null }), false);
  });

  it("customer self-reschedule route pushes ticket (separate from shop flex)", () => {
    const route = readFileSync(resolve(root, "app/api/reschedule/route.ts"), "utf8");
    const notify = readFileSync(
      resolve(root, "lib/line/customer-reschedule-notify.ts"),
      "utf8",
    );
    assert.match(route, /notifyCustomerSelfRescheduleTicket/);
    assert.match(notify, /bookingConfirmPushEnabled/);
    assert.match(notify, /push_reschedule_ticket/);
  });

  it("web push reschedule payload never includes phone", () => {
    const payload = buildWebPushPayload({
      event: "reschedule",
      shopName: "PHINX",
      shopSlug: "phinxstudio",
      appointment: {
        id: "a1",
        barber_id: "b1",
        customer_ref: "U1",
        customer_name: "บี",
        customer_phone: "0812345678",
        start_time: "2026-10-14T08:00:00.000Z",
        end_time: "2026-10-14T08:30:00.000Z",
        status: "confirmed",
        created_at: "2026-10-12T00:00:00.000Z",
        source: "line",
      },
      barberName: "นัท",
      previousStartTime: "2026-10-14T07:00:00.000Z",
    });
    assert.doesNotMatch(payload.body, /0812345678/);
    assert.match(payload.body, /เลื่อนคิว/);
  });
});

describe("P6 service-level reschedule helpers", () => {
  it("BookingError maps RESCHEDULE_LIMIT", () => {
    const err = new BookingError(
      "RESCHEDULE_LIMIT",
      "This booking has already been rescheduled once",
      400,
    );
    assert.equal(err.code, "RESCHEDULE_LIMIT");
  });

  it("reschedule service functions are exported", () => {
    assert.equal(typeof rescheduleBookingByToken, "function");
    assert.equal(typeof staffRescheduleBooking, "function");
  });
});
