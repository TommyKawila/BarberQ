import { describe, it, afterEach } from "node:test";
import assert from "node:assert/strict";
import { buildCustomerCancelUrl } from "@/lib/line/liff-url";
import { reminderCancelUrl } from "@/lib/reminders/send-reminder";

describe("reminderCancelUrl matches confirm-flow cancel URL", () => {
  const prevLiff = process.env.NEXT_PUBLIC_LIFF_ID;
  const prevApp = process.env.NEXT_PUBLIC_APP_URL;

  afterEach(() => {
    if (prevLiff === undefined) delete process.env.NEXT_PUBLIC_LIFF_ID;
    else process.env.NEXT_PUBLIC_LIFF_ID = prevLiff;
    if (prevApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prevApp;
  });

  it("equals buildCustomerCancelUrl (global /c/{token}, not /{shop}/c/...)", () => {
    process.env.NEXT_PUBLIC_LIFF_ID = "2011971303-hdy1isos";
    process.env.NEXT_PUBLIC_APP_URL = "https://barberq-qa.vercel.app";
    const token = "79599448a77d4ff28ca3c509d8f8fb5f";
    const confirmFormat = buildCustomerCancelUrl(token);
    const reminderFormat = reminderCancelUrl(token);
    assert.equal(reminderFormat, confirmFormat);
    assert.equal(
      reminderFormat,
      "https://liff.line.me/2011971303-hdy1isos/c/79599448a77d4ff28ca3c509d8f8fb5f",
    );
    assert.ok(!reminderFormat!.includes("/barberqpilottest/c/"));
  });

  it("returns null without cancel_token", () => {
    assert.equal(reminderCancelUrl(null), null);
    assert.equal(reminderCancelUrl("  "), null);
  });
});
