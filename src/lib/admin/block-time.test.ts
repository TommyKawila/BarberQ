import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fromZonedTime } from "date-fns-tz";
import {
  blockConfirmSummary,
  blockedSlotLabel,
  blockRangeFromColumn,
  isStaffBlockReason,
  nextBlockStartISO,
  overlappingBookings,
  quickBlockEndISO,
} from "@/lib/admin/block-time";
import { dictionary } from "@/lib/i18n/dictionary";
import { DEFAULT_SHOP_HOURS } from "@/lib/shop/shop-hours";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";
import type { AdminColumn, AdminSlot } from "@/types/booking";

function col(slots: AdminSlot[]): AdminColumn {
  return {
    barber: {
      id: "b1",
      name: "Robert",
      slot_duration_minutes: 30,
      off_days: [],
      created_at: "2026-01-01T00:00:00.000Z",
    },
    slots,
  };
}

function free(startHm: string, endHm: string, date = "2026-10-20"): AdminSlot {
  return {
    startTime: fromZonedTime(`${date}T${startHm}:00`, SHOP_TIMEZONE).toISOString(),
    endTime: fromZonedTime(`${date}T${endHm}:00`, SHOP_TIMEZONE).toISOString(),
    available: true,
    kind: "free",
  };
}

function booked(startHm: string, endHm: string, date = "2026-10-20"): AdminSlot {
  return {
    ...free(startHm, endHm, date),
    kind: "booked",
    customerName: "A",
    status: "confirmed",
  };
}

describe("block-time helpers", () => {
  it("Thai board label never shows raw manual", () => {
    const t = (k: string) => dictionary.th[k as keyof typeof dictionary.th] ?? k;
    assert.equal(blockedSlotLabel("manual", t), "ปิดเวลา");
    assert.equal(blockedSlotLabel("rest", t), "ปิดเวลา · พัก");
    assert.equal(blockedSlotLabel("errand", t), "ปิดเวลา · ธุระ");
    assert.equal(blockedSlotLabel("break", t), "พัก");
    assert.equal(isStaffBlockReason("manual"), true);
    assert.equal(isStaffBlockReason("break"), false);
  });

  it("confirm summary uses barber + range", () => {
    const start = fromZonedTime("2026-10-20T19:30:00", SHOP_TIMEZONE).toISOString();
    const end = fromZonedTime("2026-10-20T20:30:00", SHOP_TIMEZONE).toISOString();
    assert.equal(
      blockConfirmSummary(dictionary.th["admin.blockConfirm"], "Robert", start, end),
      "บล็อก Robert 19:30–20:30",
    );
  });

  it("quick 30m / 1h / noon / restOfDay from next slot", () => {
    const start = fromZonedTime("2026-10-20T10:30:00", SHOP_TIMEZONE).toISOString();
    const end30 = quickBlockEndISO(start, "30m", { shopHours: DEFAULT_SHOP_HOURS });
    const end1h = quickBlockEndISO(start, "1h", { shopHours: DEFAULT_SHOP_HOURS });
    const noon = quickBlockEndISO(start, "noon", { shopHours: DEFAULT_SHOP_HOURS });
    const rest = quickBlockEndISO(start, "restOfDay", { shopHours: DEFAULT_SHOP_HOURS });
    assert.equal(end30, fromZonedTime("2026-10-20T11:00:00", SHOP_TIMEZONE).toISOString());
    assert.equal(end1h, fromZonedTime("2026-10-20T11:30:00", SHOP_TIMEZONE).toISOString());
    assert.equal(noon, fromZonedTime("2026-10-20T12:00:00", SHOP_TIMEZONE).toISOString());
    assert.equal(rest, fromZonedTime("2026-10-20T20:00:00", SHOP_TIMEZONE).toISOString());
  });

  it("default start is covering/next free slot (not whole free stretch)", () => {
    const column = col([
      free("10:00", "10:30"),
      free("10:30", "11:00"),
      free("11:00", "11:30"),
    ]);
    const now = fromZonedTime("2026-10-20T10:05:00", SHOP_TIMEZONE);
    const start = nextBlockStartISO(column, now);
    assert.equal(start, column.slots[0].startTime);
  });

  it("warns when range overlaps bookings", () => {
    const column = col([
      free("19:00", "19:30"),
      booked("19:30", "20:00"),
      free("20:00", "20:30"),
    ]);
    const start = column.slots[0].startTime;
    const end = column.slots[2].endTime;
    const hits = overlappingBookings(column, start, end);
    assert.equal(hits.length, 1);
  });

  it("one blockId spans whole painted range for unblock", () => {
    const blockId = "blk-1";
    const column = col([
      {
        ...free("19:30", "20:00"),
        kind: "blocked",
        blockId,
        reason: "rest",
      },
      {
        ...free("20:00", "20:30"),
        kind: "blocked",
        blockId,
        reason: "rest",
      },
      {
        ...free("20:30", "21:00"),
        kind: "blocked",
        blockId,
        reason: "rest",
      },
    ]);
    const range = blockRangeFromColumn(column, blockId);
    assert.ok(range);
    assert.equal(range!.startTime, column.slots[0].startTime);
    assert.equal(range!.endTime, column.slots[2].endTime);
  });

  it("thumb bar block opens range sheet — never auto-POSTs full freeUntil", () => {
    const page = readFileSync(resolve(process.cwd(), "src/app/admin/page.tsx"), "utf8");
    assert.match(page, /setBlockSheet/);
    assert.match(page, /BlockTimeSheet/);
    assert.match(page, /UnblockConfirmSheet/);
    assert.match(page, /admin\.toast\.blocked/);
    assert.doesNotMatch(
      page,
      /intent === "block"[\s\S]{0,80}onBlockSlot\(row\.barberId, row\.slot\)/,
    );
    // reason must not hardcode English manual for new blocks
    assert.doesNotMatch(page, /reason:\s*"manual"/);
  });

  it("BlockTimeSheet requires confirm and never auto-submits on open", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/admin/BlockTimeSheet.tsx"),
      "utf8",
    );
    assert.match(src, /data-testid="block-confirm"/);
    assert.match(src, /admin\.blockQuick\.30m/);
    assert.match(src, /block-overlap-warn/);
    assert.match(src, /cq-press/);
  });
});
