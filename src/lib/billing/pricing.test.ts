import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { priceForBarberCount } from "@/lib/billing/pricing";

describe("priceForBarberCount", () => {
  it("tiers", () => {
    assert.equal(priceForBarberCount(1).amountBaht, 399);
    assert.equal(priceForBarberCount(2).amountBaht, 399);
    assert.equal(priceForBarberCount(3).amountBaht, 599);
    assert.equal(priceForBarberCount(5).amountBaht, 599);
    assert.equal(priceForBarberCount(6).amountBaht, 999);
    assert.equal(priceForBarberCount(10).amountBaht, 999);
    assert.equal(priceForBarberCount(11).amountBaht, null);
    assert.equal(priceForBarberCount(11).tier, "contact");
  });
});
