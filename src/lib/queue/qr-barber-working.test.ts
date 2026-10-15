import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { fromZonedTime } from "date-fns-tz";
import { isBarberWorkingAt } from "@/lib/queue/qr-barber-working";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";
import type { ShopHours } from "@/lib/shop/shop-hours";

const OPEN: ShopHours = Array.from({ length: 7 }, () => ({
  closed: false,
  open: "10:00",
  close: "20:00",
}));

describe("isBarberWorkingAt", () => {
  const wedAfternoon = fromZonedTime("2026-10-14T15:00:00", SHOP_TIMEZONE); // Wed

  it("true when active, bookable, working day, within hours", () => {
    assert.equal(
      isBarberWorkingAt(
        { off_days: [0], is_active: true, is_bookable: true },
        wedAfternoon,
        OPEN,
      ),
      true,
    );
  });

  it("false on off_days (board หยุด / no slots)", () => {
    assert.equal(
      isBarberWorkingAt(
        { off_days: [3], is_active: true, is_bookable: true }, // Wed=3
        wedAfternoon,
        OPEN,
      ),
      false,
    );
  });

  it("false when queue closed (is_bookable false)", () => {
    assert.equal(
      isBarberWorkingAt(
        { off_days: [], is_active: true, is_bookable: false },
        wedAfternoon,
        OPEN,
      ),
      false,
    );
  });

  it("false when inactive", () => {
    assert.equal(
      isBarberWorkingAt(
        { off_days: [], is_active: false, is_bookable: true },
        wedAfternoon,
        OPEN,
      ),
      false,
    );
  });

  it("false outside shop hours or shop closed day", () => {
    const early = fromZonedTime("2026-10-14T08:00:00", SHOP_TIMEZONE);
    assert.equal(
      isBarberWorkingAt(
        { off_days: [], is_active: true, is_bookable: true },
        early,
        OPEN,
      ),
      false,
    );
    const closedDay: ShopHours = OPEN.map((d, i) =>
      i === 3 ? { closed: true, open: "10:00", close: "20:00" } : { ...d },
    );
    assert.equal(
      isBarberWorkingAt(
        { off_days: [], is_active: true, is_bookable: true },
        wedAfternoon,
        closedDay,
      ),
      false,
    );
  });

  it("false during recurring break", () => {
    assert.equal(
      isBarberWorkingAt(
        { off_days: [], is_active: true, is_bookable: true },
        wedAfternoon,
        OPEN,
        [
          {
            id: "br1",
            barberId: "b1",
            weekday: 3,
            startTime: "14:00",
            endTime: "16:00",
            createdAt: new Date(),
          },
        ],
      ),
      false,
    );
  });
});
