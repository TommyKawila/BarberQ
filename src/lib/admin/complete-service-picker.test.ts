import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  activeShopServices,
  closeQueueConfirmLabel,
  defaultActiveService,
  formatServicePriceBaht,
  shouldPromptServicePicker,
} from "@/lib/admin/complete-service-picker";
import { memoryStore } from "@/lib/data/memory-store";
import {
  createStaffBooking,
  getAvailableSlots,
  markAppointmentOutcome,
} from "@/lib/services/booking-service";
import { getBookableDates } from "@/lib/services/slot-service";
import { dictionary } from "@/lib/i18n/dictionary";
import type { ShopService, Slot } from "@/types/booking";

function svc(
  partial: Partial<ShopService> & Pick<ShopService, "id" | "name" | "price_baht">,
): ShopService {
  return {
    shop_id: "shop",
    is_default: false,
    is_active: true,
    sort_order: 0,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

async function firstFutureSlot(barberId: string) {
  const dates = getBookableDates();
  for (const dateISO of dates) {
    const slots = await getAvailableSlots(barberId, dateISO);
    const available = slots.find((s: Slot) => s.available);
    if (available) return available;
  }
  return null;
}

describe("complete service picker helpers", () => {
  it("prompts only when more than one active service", () => {
    assert.equal(shouldPromptServicePicker([]), false);
    assert.equal(
      shouldPromptServicePicker([svc({ id: "a", name: "A", price_baht: 200 })]),
      false,
    );
    assert.equal(
      shouldPromptServicePicker([
        svc({ id: "a", name: "A", price_baht: 200 }),
        svc({ id: "b", name: "B", price_baht: 250 }),
      ]),
      true,
    );
    assert.equal(
      shouldPromptServicePicker([
        svc({ id: "a", name: "A", price_baht: 200 }),
        svc({ id: "b", name: "B", price_baht: 250, is_active: false }),
      ]),
      false,
    );
  });

  it("prefers default among active services", () => {
    const list = [
      svc({ id: "a", name: "A", price_baht: 200, sort_order: 0 }),
      svc({ id: "b", name: "B", price_baht: 250, is_default: true, sort_order: 1 }),
    ];
    assert.equal(defaultActiveService(list)?.id, "b");
    assert.deepEqual(
      activeShopServices(list).map((s) => s.id),
      ["b", "a"],
    );
  });

  it("Thai confirm CTA includes price", () => {
    assert.equal(
      closeQueueConfirmLabel(dictionary.th["admin.closeQueueConfirm"], 200),
      "ปิดคิว · ฿200",
    );
    assert.equal(formatServicePriceBaht(250), "฿250");
  });

  it("admin page gates complete behind picker when multi-service", () => {
    const page = readFileSync(resolve(process.cwd(), "src/app/admin/page.tsx"), "utf8");
    assert.match(page, /shouldPromptServicePicker/);
    assert.match(page, /CompleteServicePicker/);
    assert.match(page, /requestComplete/);
    assert.match(page, /\/api\/appointments\/\$\{.*\}\/service/);
  });

  it("completed cards can reopen sheet to change service", () => {
    const actions = readFileSync(
      resolve(process.cwd(), "src/lib/admin/board-card-actions.ts"),
      "utf8",
    );
    assert.match(actions, /canChangeService/);
    assert.match(actions, /status === "completed"/);
  });

  it("picker init effect does not depend on unstable active[] (tap must stick)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/admin/CompleteServicePicker.tsx"),
      "utf8",
    );
    // Regression: including `active` in deps reset selection to default after every tap.
    assert.match(src, /\[open, initialServiceId\]/);
    assert.doesNotMatch(src, /\[open, initialServiceId, fallback\?\.id, active\]/);
    assert.match(src, /type="radio"/);
    assert.match(src, /stopPropagation/);
    assert.match(src, /onPointerDown/);
    assert.match(src, /min-h-14/);
    assert.match(src, /touch-manipulation/);
  });

  it("selecting non-default service on complete persists price_baht 250", async () => {
    const shop = await memoryStore.createShop({
      name: `PickerTap ${Date.now()}`,
      subscriptionMonths: 1,
    });
    const barber = await memoryStore.createBarber({
      shopId: shop.id,
      name: `PickerBarber${Date.now()}`,
      slotDuration: 30,
    });
    await memoryStore.createShopService({
      shopId: shop.id,
      name: "ตัดผม + เฟด",
      priceBaht: 200,
      isDefault: true,
    });
    const shave = await memoryStore.createShopService({
      shopId: shop.id,
      name: "ตัด + เฟด + โกนหนวด",
      priceBaht: 250,
      isDefault: false,
    });

    const slot = await firstFutureSlot(barber.id);
    assert.ok(slot, "need a free slot");

    const booking = await createStaffBooking(shop.id, {
      barberId: barber.id,
      startTime: slot!.startTime,
      source: "walk_in",
      customerName: "Walk-in #4",
      customerPhone: "0897553004",
    });

    // Simulate picker confirm of the non-default ฿250 row (not shop default ฿200).
    const choice = {
      serviceId: shave.id,
      priceBaht: shave.price_baht,
      serviceName: shave.name,
    };
    assert.equal(choice.priceBaht, 250);

    const done = await markAppointmentOutcome(booking.id, "completed", {
      serviceId: choice.serviceId,
      priceBaht: choice.priceBaht,
    });
    assert.equal(done.service_id, shave.id);
    assert.equal(done.price_baht, 250);
    // Ensure we did not silently fall back to the default ฿200.
    assert.notEqual(done.price_baht, 200);
  });
});
