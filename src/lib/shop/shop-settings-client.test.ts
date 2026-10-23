import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  __resetShopSettingsCacheForTests,
  fetchShopSettingsCached,
  readShopSettingsCache,
  SHOP_SETTINGS_CACHE_TTL_MS,
} from "@/lib/shop/shop-settings-client";

afterEach(() => {
  __resetShopSettingsCacheForTests();
});

describe("fetchShopSettingsCached", () => {
  it("dedupes concurrent fetches for the same shop", async () => {
    let calls = 0;
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return new Response(JSON.stringify({ shopName: "Demo", remindersEnabled: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    try {
      const [a, b] = await Promise.all([
        fetchShopSettingsCached("demo"),
        fetchShopSettingsCached("demo"),
      ]);
      assert.equal(calls, 1);
      assert.equal(a.shopName, "Demo");
      assert.equal(b.remindersEnabled, true);
      assert.equal(readShopSettingsCache("demo")?.shopName, "Demo");
    } finally {
      globalThis.fetch = original;
    }
  });

  it("reuses TTL cache without a second network call", async () => {
    let calls = 0;
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(JSON.stringify({ shopName: "Cached" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    try {
      await fetchShopSettingsCached("pilot");
      await fetchShopSettingsCached("pilot");
      assert.equal(calls, 1);
      assert.ok(SHOP_SETTINGS_CACHE_TTL_MS >= 1_000);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("force=true bypasses TTL but joins in-flight", async () => {
    let calls = 0;
    const original = globalThis.fetch;
    globalThis.fetch = (async () => {
      calls += 1;
      return new Response(JSON.stringify({ shopName: `n${calls}` }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    try {
      const first = await fetchShopSettingsCached("x");
      assert.equal(first.shopName, "n1");
      const second = await fetchShopSettingsCached("x", { force: true });
      assert.equal(second.shopName, "n2");
      assert.equal(calls, 2);
    } finally {
      globalThis.fetch = original;
    }
  });
});
