import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "@/lib/data/memory-store";
import { listBookableBarbers } from "@/lib/services/booking-service";
import {
  DEFAULT_SHOP_HOURS,
  normalizeShopHours,
} from "@/lib/shop/shop-hours";
import {
  generateSlots,
  getBangkokWeekday,
  resolveShopHoursForDate,
} from "@/lib/services/slot-service";

const PHINX_SHOP = "00000000-0000-0000-0000-000000000001";

describe("shop hours", () => {
  it("DEFAULT_SHOP_HOURS matches PHINX legacy", () => {
    assert.equal(DEFAULT_SHOP_HOURS[0].open, "10:00");
    assert.equal(DEFAULT_SHOP_HOURS[1].open, "10:30");
    assert.equal(DEFAULT_SHOP_HOURS[6].open, "10:00");
    assert.equal(DEFAULT_SHOP_HOURS[1].close, "20:00");
  });

  it("different shops can have different hours", () => {
    const shopA = normalizeShopHours(null);
    const shopB = normalizeShopHours([
      { closed: true, open: "09:00", close: "18:00" },
      { closed: false, open: "09:00", close: "18:00" },
      { closed: false, open: "09:00", close: "18:00" },
      { closed: false, open: "09:00", close: "18:00" },
      { closed: false, open: "09:00", close: "18:00" },
      { closed: false, open: "09:00", close: "18:00" },
      { closed: true, open: "09:00", close: "18:00" },
    ]);
    assert.notEqual(shopA[0].open, shopB[1].open);
    assert.equal(resolveShopHoursForDate(shopB, "2026-01-04"), null);
  });

  it("closed day returns no slots", () => {
    const dateISO = "2026-01-06";
    const weekday = getBangkokWeekday(dateISO);
    const closedHours = DEFAULT_SHOP_HOURS.map((d, i) =>
      i === weekday ? { ...d, closed: true } : { ...d },
    );
    const slots = generateSlots({
      dateISO,
      barber: { off_days: [], slot_duration_minutes: 30 },
      busy: [],
      shopHours: closedHours,
      now: new Date("2026-01-01T00:00:00Z"),
    });
    assert.equal(slots.length, 0);
  });

  it("barber off-day returns no slots", () => {
    const weekday = getBangkokWeekday("2026-01-06");
    const slots = generateSlots({
      dateISO: "2026-01-06",
      barber: { off_days: [weekday], slot_duration_minutes: 30 },
      busy: [],
      shopHours: DEFAULT_SHOP_HOURS,
      now: new Date("2026-01-01T00:00:00Z"),
    });
    assert.equal(slots.length, 0);
  });

  it("slot duration respected", () => {
    const slots = generateSlots({
      dateISO: "2026-01-07",
      barber: { off_days: [], slot_duration_minutes: 60 },
      busy: [],
      shopHours: DEFAULT_SHOP_HOURS,
      now: new Date("2026-01-01T00:00:00Z"),
    });
    assert.ok(slots.length > 0);
    const first = slots[0];
    const diff =
      (new Date(first.endTime).getTime() - new Date(first.startTime).getTime()) / 60_000;
    assert.equal(diff, 60);
  });
});

describe("barber management (memory store)", () => {
  it("owner can add barber to own shop", async () => {
    const barber = await memoryStore.createBarber({
      shopId: PHINX_SHOP,
      name: "TestBarber",
      slotDuration: 30,
      isBookable: true,
    });
    assert.equal(barber.shop_id, PHINX_SHOP);
    assert.equal(barber.is_bookable, true);
  });

  it("same name across different shops allowed", async () => {
    const shop = await memoryStore.createShop({
      name: "Other Shop",
      subscriptionMonths: 1,
    });
    const a = await memoryStore.createBarber({
      shopId: PHINX_SHOP,
      name: "Boy",
      slotDuration: 30,
    });
    const b = await memoryStore.createBarber({
      shopId: shop.id,
      name: "Boy",
      slotDuration: 30,
    });
    assert.notEqual(a.shop_id, b.shop_id);
    assert.equal(a.name, b.name);
  });

  it("inactive barber hidden from listBookableBarbers", async () => {
    const barber = await memoryStore.createBarber({
      shopId: PHINX_SHOP,
      name: "HiddenBarber",
      slotDuration: 30,
      isBookable: false,
    });
    const bookable = await listBookableBarbers(PHINX_SHOP);
    assert.ok(!bookable.some((b) => b.id === barber.id));
  });

  it("LINE ID collision rejected", async () => {
    await assert.rejects(
      () =>
        memoryStore.createBarber({
          shopId: PHINX_SHOP,
          name: "DupLine",
          lineId: "mock-owner-line-id",
          slotDuration: 30,
        }),
      (err: unknown) => err instanceof Error && (err as { code?: string }).code === "LINE_ID_TAKEN",
    );
  });
});
