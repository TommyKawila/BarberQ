import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { memoryStore } from "@/lib/data/memory-store";
import { startSelfServeTrial, TrialAbuseError } from "@/lib/billing/start-trial";

const LINE = `trial-line-${Date.now()}`;

describe("startSelfServeTrial", () => {
  beforeEach(async () => {
    // Create unique LINE each test via random suffix in it()
  });

  it("creates trialing shop + linked lead", async () => {
    const lineId = `${LINE}-a`;
    const { shop, leadId } = await startSelfServeTrial({
      shopName: `Trial Shop ${Date.now()}`,
      ownerLineId: lineId,
      ownerName: "Owner A",
      barberCount: 2,
    });
    assert.equal(shop.status, "trialing");
    assert.ok(shop.subscribed_until);
    const until = new Date(shop.subscribed_until!).getTime();
    const days = (until - Date.now()) / 86_400_000;
    assert.ok(days > 28 && days < 32);

    const owner = await memoryStore.getBarberByLineId(lineId);
    assert.ok(owner);
    assert.equal(owner!.role, "owner");
    assert.equal(owner!.shop_id, shop.id);

    const leads = await memoryStore.listTrialLeads();
    const lead = leads.find((l) => l.id === leadId);
    assert.ok(lead);
    assert.equal(lead!.status, "CONVERTED");
    assert.equal(lead!.shop_id, shop.id);
  });

  it("blocks second trial for same LINE", async () => {
    const lineId = `${LINE}-b`;
    await startSelfServeTrial({
      shopName: `Trial Shop B ${Date.now()}`,
      ownerLineId: lineId,
      ownerName: "Owner B",
    });
    await assert.rejects(
      () =>
        startSelfServeTrial({
          shopName: `Trial Shop B2 ${Date.now()}`,
          ownerLineId: lineId,
          ownerName: "Owner B",
        }),
      (err: unknown) => err instanceof TrialAbuseError && err.code === "ALREADY_HAS_SHOP",
    );
  });
});
