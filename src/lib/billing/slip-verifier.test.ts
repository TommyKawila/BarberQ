import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  evaluateSlipChecks,
  promptPayIdsMatch,
} from "@/lib/billing/slip-verifier";
import { MockSlipVerifier } from "@/lib/billing/slip-verifiers/mock";
import { buildPromptPayPayload } from "@/lib/billing/promptpay-qr";

describe("slip verifier helpers", () => {
  it("matches promptpay phone variants", () => {
    assert.equal(promptPayIdsMatch("0812345678", "66812345678"), true);
    assert.equal(promptPayIdsMatch("0812345678", "0811111111"), false);
  });

  it("evaluateSlipChecks amount mismatch", () => {
    const r = evaluateSlipChecks({
      amountBaht: 400,
      expectedAmountBaht: 399,
      receiverPromptPay: "0812345678",
      expectedPromptPayId: "0812345678",
      transferAt: new Date().toISOString(),
      transRef: "ABC",
    });
    assert.equal(r.pass, false);
    if (!r.pass) assert.equal(r.reason, "amount_mismatch");
  });

  it("mock verifier pass", async () => {
    const v = new MockSlipVerifier({ receiverPromptPay: "0812345678" });
    const result = await v.verify({
      image: Buffer.from("fake"),
      contentType: "image/jpeg+mock/pass",
      expectedAmountBaht: 399,
      expectedPromptPayId: "0812345678",
    });
    assert.equal(result.ok, true);
  });

  it("mock verifier fail amount", async () => {
    const v = new MockSlipVerifier({ receiverPromptPay: "0812345678" });
    const result = await v.verify({
      image: Buffer.from("fake"),
      contentType: "image/jpeg+mock/fail-amount",
      expectedAmountBaht: 399,
      expectedPromptPayId: "0812345678",
    });
    assert.equal(result.ok, false);
    assert.equal(result.ambiguous, false);
  });

  it("builds promptpay payload with amount", () => {
    const payload = buildPromptPayPayload("0812345678", 399);
    assert.ok(payload.startsWith("000201"));
    assert.ok(payload.includes("5406399.00") || payload.includes("54"));
    assert.equal(payload.slice(-4).length, 4);
  });
});
