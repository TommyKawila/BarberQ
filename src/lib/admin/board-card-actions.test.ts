import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getBookedCardActions } from "@/lib/admin/board-card-actions";
import { dictionary } from "@/lib/i18n/dictionary";
import type { AdminSlot } from "@/types/booking";

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

describe("board card actions", () => {
  it("LINE confirmed booking can open sheet with cancel + complete", () => {
    const flags = getBookedCardActions(bookedSlot(), {
      canEdit: true,
      nowMs: Date.parse("2026-10-14T05:00:00.000Z"),
    });
    assert.equal(flags.canOpenSheet, true);
    assert.equal(flags.canCancel, true);
    assert.equal(flags.canComplete, true);
    assert.equal(flags.canCall, true);
    assert.equal(flags.canLeft, false);
    assert.equal(flags.canNoShow, false);
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

  it("non-editable staff cannot open sheet", () => {
    const flags = getBookedCardActions(bookedSlot(), { canEdit: false });
    assert.equal(flags.canOpenSheet, false);
    assert.equal(flags.canCancel, false);
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

  it("sheet has confirm dialog copy in TH/EN", () => {
    assert.match(dictionary.th["admin.confirmCancelTitle"], /ยกเลิก/);
    assert.match(dictionary.en["admin.confirmCancelTitle"], /Cancel/i);
    assert.match(dictionary.th["admin.confirmCancelBody"], /LINE/);
    assert.match(dictionary.en["admin.confirmCancelBody"], /LINE/);
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
});
