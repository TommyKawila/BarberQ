import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MOCK_OWNER_LINE_ID } from "@/lib/auth/line-verify";
import { listOwnerShopsForLineId } from "@/lib/owner/owner-shops";
import { GET as ownerShopsGet } from "@/app/api/owner/shops/route";

const root = resolve(import.meta.dirname, "../..");

describe("owner shops entry", () => {
  it("lists the mock owner shop in memory store", async () => {
    const shops = await listOwnerShopsForLineId(MOCK_OWNER_LINE_ID);
    assert.ok(shops.length >= 1);
    assert.equal(shops[0].slug, "phinxstudio");
    assert.equal(shops[0].role, "owner");
  });

  it("returns empty for unknown LINE id", async () => {
    const shops = await listOwnerShopsForLineId("line-unknown-xyz");
    assert.deepEqual(shops, []);
  });

  it("API returns shops for mock bearer", async () => {
    const res = await ownerShopsGet(
      new Request("http://localhost/api/owner/shops", {
        headers: { Authorization: `Bearer ${MOCK_OWNER_LINE_ID}` },
      }),
    );
    assert.equal(res.status, 200);
    const body = (await res.json()) as { shops: { slug: string }[] };
    assert.ok(body.shops.some((s) => s.slug === "phinxstudio"));
  });

  it("API rejects missing auth", async () => {
    const res = await ownerShopsGet(new Request("http://localhost/api/owner/shops"));
    assert.equal(res.status, 401);
  });

  it("owner entry route and guide live outside PhoneShell", () => {
    assert.equal(existsSync(resolve(root, "app/owner/page.tsx")), true);
    assert.equal(existsSync(resolve(root, "app/guide/page.tsx")), true);
    assert.equal(existsSync(resolve(root, "app/(app)/guide/page.tsx")), false);
    const owner = readFileSync(resolve(root, "components/owner/OwnerEntry.tsx"), "utf8");
    assert.match(owner, /\/trial/);
    assert.match(owner, /\/api\/owner\/shops/);
    assert.match(owner, /buildOwnerEntryLoginRedirectUri/);
    assert.match(owner, /browser_mismatch/);
    assert.match(owner, /คนละเบราว์เซอร์/);
  });
});
