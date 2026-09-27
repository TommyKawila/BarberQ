import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { extraArgs, runQaReset } from "@/lib/founder-qa/cli";
import { evaluateGuards } from "@/lib/founder-qa/guards";
import { FOUNDER_QA_HOURS, FOUNDER_QA_MANIFEST } from "@/lib/founder-qa/manifest";
import { ordinaryBarberFixtures } from "@/lib/founder-qa/fixtures";
import { looksLikeSecret } from "@/lib/founder-qa/parse";
import { OWNER_CLAIM_BANNER, RESET_BANNER } from "@/lib/founder-qa/cli";
import {
  applyDailyReset,
  applyOwnerClaimReset,
  seedDirtyState,
  stateToObserved,
} from "@/lib/founder-qa/state";
import { evaluateVerify } from "@/lib/founder-qa/verify";

describe("qa:reset guard refusals", () => {
  it("arbitrary target parameters are unavailable", () => {
    assert.ok(extraArgs(["--shop", FOUNDER_QA_MANIFEST.phinx.slug]).length > 0);
    assert.ok(extraArgs(["postgres://example"]).length > 0);
  });

  it("CLI reset refuses production identity before mutation", async () => {
    const previous = process.env.BARBERQ_ENV;
    process.env.BARBERQ_ENV = "production";
    const code = await runQaReset(["--shop=phinxstudio"]);
    if (previous === undefined) delete process.env.BARBERQ_ENV;
    else process.env.BARBERQ_ENV = previous;
    assert.equal(code, 1);
  });
});

describe("qa:reset daily fixture restore", () => {
  it("preserves Owner, clears managers/invites/appointments, restores Johnny/Peter/Jack and hours", () => {
    const dirty = seedDirtyState();
    const sentinelBefore = JSON.stringify(
      dirty.barbers.filter((b) => b.shopId === FOUNDER_QA_MANIFEST.sentinel.id),
    );
    const ownerBefore = dirty.barbers.find((b) => b.role === "owner")?.lineLinked;
    const reset = applyDailyReset(dirty);
    assert.equal(ownerBefore, true);
    assert.equal(reset.barbers.find((b) => b.role === "owner")?.lineLinked, true);
    assert.equal(
      reset.managers.filter((m) => m.shopId === FOUNDER_QA_MANIFEST.shop.id).length,
      0,
    );
    assert.equal(
      reset.invites.filter((m) => m.shopId === FOUNDER_QA_MANIFEST.shop.id).length,
      0,
    );
    const qaIds = new Set(
      reset.barbers.filter((b) => b.shopId === FOUNDER_QA_MANIFEST.shop.id).map((b) => b.id),
    );
    assert.equal(reset.appointments.filter((a) => qaIds.has(a.barberId)).length, 0);
    for (const fixture of ordinaryBarberFixtures()) {
      const row = reset.barbers.find((b) => b.id === fixture.id);
      assert.equal(row?.name, fixture.name);
      assert.equal(row?.role, "barber");
      assert.equal(row?.isBookable, true);
    }
    assert.deepEqual(reset.hoursByShop[FOUNDER_QA_MANIFEST.shop.id], FOUNDER_QA_HOURS);
    assert.equal(
      JSON.stringify(
        reset.barbers.filter((b) => b.shopId === FOUNDER_QA_MANIFEST.sentinel.id),
      ),
      sentinelBefore,
    );
    assert.equal(
      reset.appointments.some((a) => a.barberId === FOUNDER_QA_MANIFEST.sentinelBarber.id),
      true,
    );
    const observed = stateToObserved(reset);
    assert.equal(evaluateVerify(observed).ok, true);
  });

  it("does not mutate the isolation sentinel shop identity", () => {
    const reset = applyDailyReset(seedDirtyState());
    const sentinel = reset.shops.find((s) => s.id === FOUNDER_QA_MANIFEST.sentinel.id);
    assert.equal(sentinel?.slug, FOUNDER_QA_MANIFEST.sentinel.slug);
    assert.equal(sentinel?.name, FOUNDER_QA_MANIFEST.sentinel.name);
  });

  it("is idempotent and requires post-reset verification", () => {
    const once = applyDailyReset(seedDirtyState());
    const twice = applyDailyReset(once);
    assert.deepEqual(
      twice.barbers.filter((b) => b.shopId === FOUNDER_QA_MANIFEST.shop.id).map((b) => b.name).sort(),
      once.barbers.filter((b) => b.shopId === FOUNDER_QA_MANIFEST.shop.id).map((b) => b.name).sort(),
    );
    assert.equal(evaluateVerify(stateToObserved(twice)).ok, true);
  });

  it("does not log secrets", () => {
    const reset = applyDailyReset(seedDirtyState());
    for (const line of reset.logs) {
      assert.equal(looksLikeSecret(line), false);
    }
    assert.equal(looksLikeSecret(RESET_BANNER), false);
  });
});

describe("qa:reset:owner-claim", () => {
  it("clears Owner relationship and prepares pending claim without logging tokens", () => {
    const reset = applyOwnerClaimReset(seedDirtyState());
    assert.equal(reset.barbers.find((b) => b.role === "owner")?.lineLinked, false);
    assert.equal(reset.shops.find((s) => s.id === FOUNDER_QA_MANIFEST.shop.id)?.status, "pending");
    assert.equal(reset.ownerInvitePrepared, true);
    for (const line of reset.logs) {
      assert.equal(looksLikeSecret(line), false);
      assert.ok(!line.includes("invite_token"));
    }
    assert.equal(looksLikeSecret(OWNER_CLAIM_BANNER), false);
    assert.ok(OWNER_CLAIM_BANNER.includes("This is not the normal daily reset."));
    assert.equal(
      evaluateVerify(stateToObserved(reset), FOUNDER_QA_MANIFEST, "owner-claim").ok,
      true,
    );
    assert.equal(evaluateVerify(stateToObserved(reset)).ok, false);
  });
});

describe("qa:reset negative identities", () => {
  it("PHINX and production snapshots never pass reset guards", () => {
    const observed = stateToObserved(seedDirtyState());
    observed.supabaseProjectRef = FOUNDER_QA_MANIFEST.productionDenylist.supabaseProjectRef;
    observed.appHostname = FOUNDER_QA_MANIFEST.productionDenylist.appHostname;
    observed.shop = { ...FOUNDER_QA_MANIFEST.phinx, status: "active" };
    observed.barberqEnv = "production";
    const guards = evaluateGuards(observed);
    assert.equal(guards.ok, false);
    assert.equal(guards.mutated, false);
  });
});
