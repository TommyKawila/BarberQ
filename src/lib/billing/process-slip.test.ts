import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "@/lib/data/memory-store";
import { processPaymentSlip } from "@/lib/billing/process-slip";
import { resetMemoryPaymentStore } from "@/lib/billing/payment-store";

describe("processPaymentSlip with mock verifier", () => {
  const prevPromptPay = process.env.PROMPTPAY_ID;
  const prevVerifier = process.env.SLIP_VERIFIER;

  beforeEach(() => {
    process.env.PROMPTPAY_ID = "0812345678";
    process.env.SLIP_VERIFIER = "mock";
    resetMemoryPaymentStore();
  });

  afterEach(() => {
    if (prevPromptPay === undefined) delete process.env.PROMPTPAY_ID;
    else process.env.PROMPTPAY_ID = prevPromptPay;
    if (prevVerifier === undefined) delete process.env.SLIP_VERIFIER;
    else process.env.SLIP_VERIFIER = prevVerifier;
  });

  it("verifies slip and extends subscription", async () => {
    const shop = await memoryStore.createShop({
      name: `Pay Shop ${Date.now()}`,
      ownerLineId: `pay-owner-${Date.now()}`,
      ownerName: "Pay Owner",
      subscriptionDays: 1,
      status: "trialing",
    });
    const before = shop.subscribed_until!;

    const payment = await processPaymentSlip({
      shop,
      amountBaht: 399,
      planTier: "1-2",
      image: new Uint8Array([1, 2, 3]).buffer,
      contentType: "image/jpeg+mock/pass",
      submittedByLineId: "pay-owner",
    });

    assert.equal(payment.status, "verified");
    assert.ok(payment.trans_ref);

    const updated = (await memoryStore.listShops()).find((s) => s.id === shop.id)!;
    assert.equal(updated.status, "active");
    assert.ok(new Date(updated.subscribed_until!).getTime() > new Date(before).getTime());
  });

  it("marks pending_review on ambiguous", async () => {
    const shop = await memoryStore.createShop({
      name: `Amb Shop ${Date.now()}`,
      ownerLineId: `amb-owner-${Date.now()}`,
      ownerName: "Amb",
      subscriptionMonths: 1,
    });

    const payment = await processPaymentSlip({
      shop,
      amountBaht: 399,
      planTier: "1-2",
      image: new Uint8Array([1]).buffer,
      contentType: "image/jpeg+mock/ambiguous",
      submittedByLineId: "amb",
    });
    assert.equal(payment.status, "pending_review");
  });

  it("rejects reused transRef", async () => {
    const shop = await memoryStore.createShop({
      name: `Reuse Shop ${Date.now()}`,
      ownerLineId: `reuse-owner-${Date.now()}`,
      ownerName: "Reuse",
      subscriptionMonths: 1,
    });

    const first = await processPaymentSlip({
      shop,
      amountBaht: 399,
      planTier: "1-2",
      image: new Uint8Array([1]).buffer,
      contentType: "image/jpeg+mock/reuse-ref:SAME-REF-1",
      submittedByLineId: "r1",
    });
    assert.equal(first.status, "verified");

    const second = await processPaymentSlip({
      shop,
      amountBaht: 399,
      planTier: "1-2",
      image: new Uint8Array([1]).buffer,
      contentType: "image/jpeg+mock/reuse-ref:SAME-REF-1",
      submittedByLineId: "r2",
    });
    assert.equal(second.status, "failed");
    assert.equal(second.review_note, "trans_ref_reused");
  });
});
