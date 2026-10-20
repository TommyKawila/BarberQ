import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("admin nav stays mounted across tabs", () => {
  it("layouts wrap AdminChrome + AdminAuthProvider", () => {
    const root = readFileSync(resolve(process.cwd(), "src/app/admin/layout.tsx"), "utf8");
    const shop = readFileSync(
      resolve(process.cwd(), "src/app/[shop]/admin/layout.tsx"),
      "utf8",
    );
    assert.match(root, /AdminAuthProvider/);
    assert.match(root, /AdminChrome/);
    assert.match(shop, /AdminAuthProvider/);
    assert.match(shop, /AdminChrome/);
  });

  it("AdminShell no longer mounts AdminNav (chrome owns nav)", () => {
    const shell = readFileSync(
      resolve(process.cwd(), "src/components/admin/AdminShell.tsx"),
      "utf8",
    );
    assert.doesNotMatch(shell, /AdminNav/);
    assert.match(shell, /admin-thumb-bar/);
  });

  it("AdminNav uses Link prefetch + optimistic pendingPath + cq-press", () => {
    const nav = readFileSync(
      resolve(process.cwd(), "src/components/admin/AdminNav.tsx"),
      "utf8",
    );
    assert.match(nav, /pendingPath/);
    assert.match(nav, /setPendingPath/);
    assert.match(nav, /prefetch/);
    assert.match(nav, /cq-press/);
    assert.match(nav, /activePath/);
  });

  it("loading.tsx uses content skeleton (not full-page loader)", () => {
    const loading = readFileSync(resolve(process.cwd(), "src/app/admin/loading.tsx"), "utf8");
    assert.match(loading, /AdminContentSkeleton/);
    assert.doesNotMatch(loading, /common\.loading|กำลังโหลด/);
  });

  it("Team page shows skeleton instead of ช่างในร้าน (0) while loading", () => {
    const page = readFileSync(resolve(process.cwd(), "src/app/admin/staff/page.tsx"), "utf8");
    assert.match(page, /TeamListSkeleton/);
    assert.match(page, /loadingBarbers \? \(\s*<TeamListSkeleton/);
    // Count label only after load
    assert.match(page, /admin\.teamInShop/);
    assert.doesNotMatch(page, /loadingBarbers \? <p[^>]*>\{t\("common\.loading"\)\}/);
  });
});
