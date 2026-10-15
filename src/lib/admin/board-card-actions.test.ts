import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  BOARD_CANCEL_SOURCES,
  getBookedCardActions,
} from "@/lib/admin/board-card-actions";
import { shouldSendLineCancelPush } from "@/lib/line/shop-cancel-notify";
import { dictionary } from "@/lib/i18n/dictionary";
import type { AdminSlot, AppointmentSource } from "@/types/booking";

const root = resolve(import.meta.dirname, "../..");

function bookedSlot(overrides: Partial<AdminSlot> = {}): AdminSlot {
  return {
    startTime: "2026-10-14T06:30:00.000Z",
    endTime: "2026-10-14T07:00:00.000Z",
    available: false,
    kind: "booked",
    status: "confirmed",
    appointmentId: "apt-1",
    customerName: "Tommy",
    customerPhone: "0897553362",
    source: "line",
    ...overrides,
  };
}

describe("board card cancel for every source", () => {
  for (const source of BOARD_CANCEL_SOURCES) {
    it(`cancel available for ${source} bookings`, () => {
      const flags = getBookedCardActions(
        bookedSlot({
          source,
          customerLineId: source === "line" ? "U-customer" : null,
        }),
        { canEdit: true, nowMs: Date.parse("2026-10-14T05:00:00.000Z") },
      );
      assert.equal(flags.canOpenSheet, true);
      assert.equal(flags.canCancel, true);
      assert.equal(flags.canReschedule, true);
      assert.equal(flags.cancelNotifiesLine, source === "line");
      assert.equal(flags.rescheduleNotifiesLine, source === "line");
    });
  }

  it("covers line, walk_in, phone, and chat", () => {
    assert.deepEqual([...BOARD_CANCEL_SOURCES].sort(), [
      "chat",
      "line",
      "phone",
      "walk_in",
    ]);
  });

  it("no-show appears after end time for LINE bookings", () => {
    const flags = getBookedCardActions(bookedSlot(), {
      canEdit: true,
      nowMs: Date.parse("2026-10-14T08:00:00.000Z"),
    });
    assert.equal(flags.canNoShow, true);
    assert.equal(flags.canCancel, true);
  });

  it("walk-in can mark left instead of no-show", () => {
    const flags = getBookedCardActions(bookedSlot({ source: "walk_in" }), {
      canEdit: true,
      nowMs: Date.parse("2026-10-14T05:00:00.000Z"),
    });
    assert.equal(flags.canLeft, true);
    assert.equal(flags.canNoShow, false);
    assert.equal(flags.canCancel, true);
  });

  it("phone and chat can open sheet with cancel (no LINE notify flag)", () => {
    for (const source of ["phone", "chat"] as AppointmentSource[]) {
      const flags = getBookedCardActions(
        bookedSlot({ source, customerLineId: null }),
        { canEdit: true },
      );
      assert.equal(flags.canCancel, true);
      assert.equal(flags.cancelNotifiesLine, false);
    }
  });

  it("non-editable staff cannot open sheet", () => {
    const flags = getBookedCardActions(bookedSlot(), { canEdit: false });
    assert.equal(flags.canOpenSheet, false);
    assert.equal(flags.canCancel, false);
  });
});

describe("LINE cancel push gating", () => {
  it("sends LINE push only when customer_line_id is present", () => {
    assert.equal(shouldSendLineCancelPush({ customer_line_id: "U123" }), true);
    assert.equal(shouldSendLineCancelPush({ customer_line_id: "  " }), false);
    assert.equal(shouldSendLineCancelPush({ customer_line_id: null }), false);
    assert.equal(shouldSendLineCancelPush({ customer_line_id: undefined }), false);
  });
});

describe("board cancel UX wiring", () => {
  it("grid opens action sheet; cancel is not gated behind !markable", () => {
    const grid = readFileSync(
      resolve(root, "components/admin/QuickBlockGrid.tsx"),
      "utf8",
    );
    assert.match(grid, /BookedSlotActionsSheet/);
    assert.match(grid, /getBookedCardActions/);
    assert.match(grid, /admin\.tapForActions/);
    assert.doesNotMatch(grid, /staffCancellable && !markable/);
  });

  it("sheet picks LINE vs non-LINE confirm copy", () => {
    const sheet = readFileSync(
      resolve(root, "components/admin/BookedSlotActionsSheet.tsx"),
      "utf8",
    );
    assert.match(sheet, /confirmCancelBodyLine/);
    assert.match(sheet, /confirmCancelBodyNoLine/);
    assert.match(dictionary.th["admin.confirmCancelBodyNoLine"], /ไม่ส่งข้อความ LINE/);
    assert.match(dictionary.en["admin.confirmCancelBodyNoLine"], /no LINE message/i);
  });

  it("staff cancel route notifies LINE + Web Push", () => {
    const route = readFileSync(
      resolve(root, "app/api/appointments/[id]/cancel/route.ts"),
      "utf8",
    );
    assert.match(route, /notifyCustomerShopCancel/);
    assert.match(route, /notifyStaffWebPush/);
    assert.match(route, /event:\s*"cancel"/);
  });

  it("shop-cancel-notify skips push without LINE user", () => {
    const notify = readFileSync(
      resolve(root, "lib/line/shop-cancel-notify.ts"),
      "utf8",
    );
    assert.match(notify, /shouldSendLineCancelPush/);
    assert.match(notify, /if \(!shouldSendLineCancelPush/);
  });

  it("sheet exposes reschedule action", () => {
    const sheet = readFileSync(
      resolve(root, "components/admin/BookedSlotActionsSheet.tsx"),
      "utf8",
    );
    assert.match(sheet, /admin\.rescheduleBooking/);
    assert.match(sheet, /"reschedule"/);
  });

  it("staff reschedule route notifies LINE flex + Web Push", () => {
    const route = readFileSync(
      resolve(root, "app/api/appointments/[id]/reschedule/route.ts"),
      "utf8",
    );
    assert.match(route, /notifyCustomerShopReschedule/);
    assert.match(route, /notifyStaffWebPush/);
    assert.match(route, /event:\s*"reschedule"/);
  });
});
