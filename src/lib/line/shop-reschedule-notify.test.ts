import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  notifyCustomerShopReschedule,
  shopRescheduleBookingsUrl,
  shouldSendLineReschedulePush,
} from "@/lib/line/shop-reschedule-notify";
import { buildCustomerCancelUrl } from "@/lib/line/liff-url";
import type { Appointment, Shop } from "@/types/booking";

const root = resolve(import.meta.dirname, "../..");

describe("shop-reschedule Flex CTA URLs", () => {
  const prevLiff = process.env.NEXT_PUBLIC_LIFF_ID;
  const prevApp = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (prevLiff === undefined) delete process.env.NEXT_PUBLIC_LIFF_ID;
    else process.env.NEXT_PUBLIC_LIFF_ID = prevLiff;
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
  });

  it("ตกลง / เลือกเวลาอื่น prefer liff.line.me …/bookings (not vercel web)", () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "2011971303-hdy1isos";
    process.env.NEXT_PUBLIC_APP_URL = "https://barberq-qa.vercel.app";
    assert.equal(
      shopRescheduleBookingsUrl("barberqpilottest"),
      "https://liff.line.me/2011971303-hdy1isos/barberqpilottest/bookings",
    );
    assert.doesNotMatch(
      shopRescheduleBookingsUrl("barberqpilottest"),
      /barberq-qa\.vercel\.app/,
    );
  });

  it("ยกเลิกนัด stays on global LIFF /c/{token}", () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "2011971303-hdy1isos";
    process.env.NEXT_PUBLIC_APP_URL = "https://barberq-qa.vercel.app";
    assert.equal(
      buildCustomerCancelUrl("tok123"),
      "https://liff.line.me/2011971303-hdy1isos/c/tok123",
    );
  });

  it("falls back to web bookings when LIFF id unset", () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    process.env.NEXT_PUBLIC_APP_URL = "https://barberq-qa.vercel.app";
    assert.equal(
      shopRescheduleBookingsUrl("barberqpilottest"),
      "https://barberq-qa.vercel.app/barberqpilottest/bookings",
    );
  });

  it("notify wires acceptUrl + pickUrl via shopRescheduleBookingsUrl", () => {
    const src = readFileSync(
      resolve(root, "lib/line/shop-reschedule-notify.ts"),
      "utf8",
    );
    assert.match(src, /acceptUrl:\s*bookingsUrl/);
    assert.match(src, /pickUrl:\s*bookingsUrl/);
    assert.match(src, /buildCustomerCancelUrl/);
    assert.match(src, /before\.customer_line_id/);
    assert.equal(shouldSendLineReschedulePush({ customer_line_id: "U1" }), true);
  });

  it("staff reschedule route keeps notify alive via afterResponse (cross-barber)", () => {
    const route = readFileSync(
      resolve(root, "app/api/appointments/[id]/reschedule/route.ts"),
      "utf8",
    );
    assert.match(route, /notifyCustomerShopReschedule/);
    assert.match(route, /after as afterResponse/);
    assert.match(route, /afterResponse\(async/);
    assert.match(route, /barberChanged/);
  });

  it("notify still attempts push when after omits LINE id but before has it", async () => {
    const shop: Shop = {
      id: "00000000-0000-0000-0000-000000000066",
      name: "Demo",
      slug: "demo",
      status: "active",
      subscribed_until: null,
      created_at: "2030-01-01T00:00:00.000Z",
      updated_at: "2030-01-01T00:00:00.000Z",
    };
    const before: Appointment = {
      id: "00000000-0000-0000-0000-000000000099",
      barber_id: "11111111-1111-4111-8111-111111111111",
      customer_ref: "U1",
      customer_name: "ลูกค้า",
      customer_phone: null,
      customer_line_id: "U-customer",
      start_time: "2030-06-01T12:00:00.000Z",
      end_time: "2030-06-01T12:30:00.000Z",
      status: "confirmed",
      source: "line",
      created_at: "2030-06-01T10:00:00.000Z",
      cancel_token: "tok",
      reschedule_count: 0,
    };
    const after: Appointment = {
      ...before,
      barber_id: "22222222-2222-4222-8222-222222222222",
      customer_line_id: null,
      start_time: "2030-06-01T13:00:00.000Z",
      end_time: "2030-06-01T13:30:00.000Z",
    };
    // Must not throw; LINE id recovered from before.
    await notifyCustomerShopReschedule(shop, before, after);
  });
});
