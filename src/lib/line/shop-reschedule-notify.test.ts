import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  shopRescheduleBookingsUrl,
  shouldSendLineReschedulePush,
} from "@/lib/line/shop-reschedule-notify";
import { buildCustomerCancelUrl } from "@/lib/line/liff-url";

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
    assert.equal(shouldSendLineReschedulePush({ customer_line_id: "U1" }), true);
  });
});
