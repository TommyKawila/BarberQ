import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  buildCustomerCancelUrl,
  buildShopBookingsCustomerUrl,
  buildShopCustomerUrl,
  buildShopLiffUrl,
  buildShopWebUrl,
  CLIPPERQ_PROD_LIFF_ID,
  resolveCustomerLiffId,
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
      buildShopBookingsCustomerUrl("barberqpilottest"),
      "https://liff.line.me/2011971303-hdy1isos/barberqpilottest/bookings",
    );
    assert.equal(
      buildShopLiffUrl("demo"),
      "https://liff.line.me/2011971303-hdy1isos/demo",
    );
  });

  it("cancel URL is global /c/{token} (not /{shop}/c/{token})", () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "2011971303-hdy1isos";
    process.env.NEXT_PUBLIC_APP_URL = "https://barberq-qa.vercel.app";
    assert.equal(
      buildCustomerCancelUrl("79599448a77d4ff28ca3c509d8f8fb5f"),
      "https://liff.line.me/2011971303-hdy1isos/c/79599448a77d4ff28ca3c509d8f8fb5f",
    );
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    assert.equal(
      buildCustomerCancelUrl("tok"),
      "https://barberq-qa.vercel.app/c/tok",
    );
  });

  it("falls back to web URL when LIFF id is missing on non-prod", () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    process.env.NEXT_PUBLIC_APP_URL = "https://barberq-qa.vercel.app";
    assert.equal(
      buildShopCustomerUrl("demo", "/bookings"),
      "https://barberq-qa.vercel.app/demo/bookings",
    );
    assert.equal(buildShopWebUrl("demo"), "https://barberq-qa.vercel.app/demo");
  });

  it("prod APP_URL without LIFF env still uses prod LIFF for /bookings (not barber-q-pi web)", () => {
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    process.env.NEXT_PUBLIC_APP_URL = "https://barber-q-pi.vercel.app";
    assert.equal(resolveCustomerLiffId(), CLIPPERQ_PROD_LIFF_ID);
    const url = buildShopBookingsCustomerUrl("phinxstudio");
    assert.equal(
      url,
      `https://liff.line.me/${CLIPPERQ_PROD_LIFF_ID}/phinxstudio/bookings`,
    );
    assert.doesNotMatch(url, /barber-q-pi\.vercel\.app/);
  });
});
