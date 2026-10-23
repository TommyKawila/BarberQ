import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EXAMPLE_PROMPTPAY_ID,
  PROMPTPAY_ENV_KEY,
  buildPromptPayPayload,
  crc16CcittFalse,
  formatPromptPayAmount,
  getPromptPayIdFromEnv,
  normalizePromptPayTarget,
} from "@/lib/billing/promptpay";

describe("promptpay payload", () => {
  it("uses labeled example id only in tests (never a real national ID)", () => {
    assert.equal(EXAMPLE_PROMPTPAY_ID, "0000000000000");
    assert.match(EXAMPLE_PROMPTPAY_ID, /^0+$/);
  });

  it("normalizes mobile 0xxxxxxxxx → 0066…", () => {
    // example fake mobile — labeled example for tests
    assert.equal(normalizePromptPayTarget("0812345678"), "0066812345678");
  });

  it("keeps 13-digit example tax id", () => {
    assert.equal(normalizePromptPayTarget(EXAMPLE_PROMPTPAY_ID), EXAMPLE_PROMPTPAY_ID);
  });

  it("formats amount to 2 decimals", () => {
    assert.equal(formatPromptPayAmount(399), "399.00");
    assert.equal(formatPromptPayAmount(599.5), "599.50");
  });

  it("builds EMVCo payload with amount and valid CRC", () => {
    const payload = buildPromptPayPayload(EXAMPLE_PROMPTPAY_ID, 399);
    assert.match(payload, /^000201/);
    assert.match(payload, /5406399\.00/);
    assert.match(payload, /5802TH/);
    assert.match(payload, /6304[0-9A-F]{4}$/);
    const withoutCrc = payload.slice(0, -4);
    assert.equal(payload.slice(-4), crc16CcittFalse(withoutCrc));
  });

  it("reads PromptPay id only from BARBERQ_PROMPTPAY_ID env", () => {
    assert.equal(PROMPTPAY_ENV_KEY, "BARBERQ_PROMPTPAY_ID");
    assert.equal(getPromptPayIdFromEnv({}), null);
    assert.equal(
      getPromptPayIdFromEnv({ BARBERQ_PROMPTPAY_ID: EXAMPLE_PROMPTPAY_ID }),
      EXAMPLE_PROMPTPAY_ID,
    );
  });
});
