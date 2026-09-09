import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "@/lib/data/memory-store";
import {
  bookingErrorI18nKey,
  canSubmitBooking,
  defaultBookableBarberId,
  isCustomerDateDisabled,
  isShopClosedOnDate,
  isValidCustomerPhone,
  maskPhone,
  normalizeCustomerPhone,
  sortAppointmentsUpcomingFirst,
} from "@/lib/booking/customer-flow";
import {
  BookingError,
  createBooking,
  createBookingForShop,
  getAvailableSlots,
  listBookableBarbers,
  listCustomerBookingsForShop,
} from "@/lib/services/booking-service";
import { getBookableDates } from "@/lib/services/slot-service";
import { DEFAULT_SHOP_HOURS } from "@/lib/shop/shop-hours";

const PHINX_SHOP = "00000000-0000-0000-0000-000000000001";
const SAEB_ID = "11111111-1111-4111-8111-111111111111";
const TIDE_ID = "22222222-2222-4222-8222-222222222222";
const CUSTOMER_REF = "line-customer-test-001";

describe("customer flow helpers", () => {
  it("single bookable barber auto-selects id", async () => {
    const barbers = await listBookableBarbers(PHINX_SHOP);
    const single = barbers.filter((b) => b.id === SAEB_ID);
    assert.equal(defaultBookableBarberId(single), SAEB_ID);
  });

  it("multiple barbers do not force default id", async () => {
    const barbers = await listBookableBarbers(PHINX_SHOP);
    assert.ok(barbers.length > 1);
    assert.equal(defaultBookableBarberId(barbers), null);
  });

  it("non-bookable barber hidden from listBookableBarbers", async () => {
    const hidden = await memoryStore.createBarber({
      shopId: PHINX_SHOP,
      name: "HiddenFlow",
      slotDuration: 30,
      isBookable: false,
    });
    const bookable = await listBookableBarbers(PHINX_SHOP);
    assert.ok(!bookable.some((b) => b.id === hidden.id));
  });

  it("closed shop day disables date selection", () => {
    const closedHours = DEFAULT_SHOP_HOURS.map((d, i) =>
      i === 0 ? { ...d, closed: true } : { ...d },
    );
    assert.equal(isShopClosedOnDate(closedHours, "2026-01-04"), true);
    assert.equal(isCustomerDateDisabled("2026-01-04", closedHours, []), true);
  });

  it("barber off-day disables date", () => {
    assert.equal(isCustomerDateDisabled("2026-01-05", DEFAULT_SHOP_HOURS, [1]), true);
  });

  it("booking conflict maps to i18n key not raw message", () => {
    assert.equal(bookingErrorI18nKey("SLOT_TAKEN"), "booking.slotTaken");
    assert.equal(bookingErrorI18nKey("SLOT_BLOCKED"), "booking.slotTaken");
    assert.notEqual(bookingErrorI18nKey("SLOT_TAKEN"), "This slot is already booked");
  });

  it("invalid phone maps to i18n key", () => {
    assert.equal(bookingErrorI18nKey("INVALID_PHONE"), "booking.invalidPhone");
  });

  it("canSubmitBooking blocks duplicate submit", () => {
    assert.equal(canSubmitBooking(false), true);
    assert.equal(canSubmitBooking(true), false);
  });

  it("normalizeCustomerPhone strips spaces and dashes", () => {
    assert.equal(normalizeCustomerPhone("081-234 5678"), "0812345678");
    assert.equal(isValidCustomerPhone("081-234 5678"), true);
  });

  it("maskPhone hides middle digits", () => {
    assert.equal(maskPhone("0812345678"), "081-xxx-678");
  });

  it("sortAppointmentsUpcomingFirst puts future first", () => {
    const sorted = sortAppointmentsUpcomingFirst(
      [
        { start_time: "2020-01-01T10:00:00.000Z" },
        { start_time: "2099-01-01T10:00:00.000Z" },
      ],
      new Date("2026-01-01T00:00:00Z"),
    );
    assert.equal(sorted[0].start_time, "2099-01-01T10:00:00.000Z");
  });
});

describe("customer booking service", () => {
  async function firstFutureSlot(barberId: string) {
    const dates = getBookableDates();
    for (const dateISO of dates) {
      const slots = await getAvailableSlots(barberId, dateISO);
      const available = slots.find((s) => s.available);
      if (available) return available;
    }
    return null;
  }

  it("valid booking creates appointment", async () => {
    const available = await firstFutureSlot(SAEB_ID);
    assert.ok(available);
    const apt = await createBookingForShop(PHINX_SHOP, {
      barberId: SAEB_ID,
      startTime: available!.startTime,
      customerName: "Tommy",
      customerPhone: "0812345678",
      customerRef: CUSTOMER_REF,
      customerLineId: CUSTOMER_REF,
    });
    assert.equal(apt.customer_name, "Tommy");
    assert.equal(apt.barber_id, SAEB_ID);
  });

  it("conflict rejects second booking on same slot", async () => {
    const available = await firstFutureSlot(TIDE_ID);
    assert.ok(available);
    await createBooking({
      barberId: TIDE_ID,
      startTime: available!.startTime,
      customerName: "First",
      customerPhone: "0811111111",
      customerRef: "line-first",
      customerLineId: "line-first",
    });
    await assert.rejects(
      () =>
        createBooking({
          barberId: TIDE_ID,
          startTime: available!.startTime,
          customerName: "Second",
          customerPhone: "0822222222",
          customerRef: "line-second",
          customerLineId: "line-second",
        }),
      (err: unknown) => err instanceof BookingError && err.code === "SLOT_TAKEN",
    );
  });

  it("createBookingForShop rejects barber from another shop", async () => {
    const otherShop = await memoryStore.createShop({
      name: "Other Shop Flow",
      subscriptionMonths: 1,
    });
    const otherBarber = await memoryStore.createBarber({
      shopId: otherShop.id,
      name: "OtherBarber",
      slotDuration: 30,
    });
    const available = await firstFutureSlot(otherBarber.id);
    assert.ok(available);
    await assert.rejects(
      () =>
        createBookingForShop(PHINX_SHOP, {
          barberId: otherBarber.id,
          startTime: available!.startTime,
          customerName: "Cross",
          customerPhone: "0833333333",
          customerRef: CUSTOMER_REF,
        }),
      (err: unknown) => err instanceof BookingError && err.code === "BARBER_NOT_FOUND",
    );
  });

  it("listCustomerBookingsForShop does not leak other shops", async () => {
    const otherShop = await memoryStore.createShop({
      name: "Leak Test Shop",
      subscriptionMonths: 1,
    });
    const otherBarber = await memoryStore.createBarber({
      shopId: otherShop.id,
      name: "LeakBarber",
      slotDuration: 30,
    });
    const available = await firstFutureSlot(otherBarber.id);
    assert.ok(available);
    await createBooking({
      barberId: otherBarber.id,
      startTime: available!.startTime,
      customerName: "Leak",
      customerPhone: "0844444444",
      customerRef: CUSTOMER_REF,
    });
    const phinxOnly = await listCustomerBookingsForShop(CUSTOMER_REF, PHINX_SHOP);
    assert.ok(!phinxOnly.some((a) => a.barber_id === otherBarber.id));
  });
});
