import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  buildShopCustomerUrl,
  buildShopLiffUrl,
  buildShopWebUrl,
} from "@/lib/line/liff-url";

describe("liff customer URLs", () => {
  const prevLiff = process.env.NEXT_PUBLIC_LIFF_ID;
  const prevApp = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (prevLiff === undefined) delete process.env.NEXT_PUBLIC_LIFF_ID;
    else process.env.NEXT_PUBLIC_LIFF_ID = prevLiff;
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
  });

  it("prefers LIFF URL for customer links when LIFF id is set", () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "2011971303-hdy1isos";
    process.env.NEXT_PUBLIC_APP_URL = "https://barberq-qa.vercel.app";
    assert.equal(
      buildShopCustomerUrl("barberqpilottest", "/bookings"),
      "https://liff.line.me/2011971303-hdy1isos/barberqpilottest/bookings",
    );
    assert.equal(
      buildShopCustomerUrl("barberqpilottest", "c/tok"),
      "https://liff.line.me/2011971303-hdy1isos/barberqpilottest/c/tok",
    );
    assert.equal(
      buildShopLiffUrl("demo"),
      "https://liff.line.me/2011971303-hdy1isos/demo",
    );
  });

  it("falls back to web URL when LIFF id is missing", () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    process.env.NEXT_PUBLIC_APP_URL = "https://barberq-qa.vercel.app";
    assert.equal(
      buildShopCustomerUrl("demo", "/bookings"),
      "https://barberq-qa.vercel.app/demo/bookings",
    );
    assert.equal(buildShopWebUrl("demo"), "https://barberq-qa.vercel.app/demo");
  });
});
