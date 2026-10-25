import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { OWNER_WEB_MANIFEST_PATH, ownerPwaMetadata } from "@/lib/pwa/owner-manifest";

describe("owner PWA manifest", () => {
  it("owner.webmanifest starts at /owner (not sale page /)", () => {
    const raw = readFileSync(resolve(process.cwd(), "public/owner.webmanifest"), "utf8");
    const json = JSON.parse(raw) as {
      start_url: string;
      scope: string;
      display: string;
      id?: string;
    };
    assert.equal(json.start_url, "/owner");
    assert.equal(json.scope, "/");
    assert.equal(json.display, "standalone");
    assert.equal(json.id, "/owner");
  });

  it("public site.webmanifest keeps start_url / for marketing/customers", () => {
    const raw = readFileSync(resolve(process.cwd(), "public/site.webmanifest"), "utf8");
    const json = JSON.parse(raw) as { start_url: string };
    assert.equal(json.start_url, "/");
  });

  it("owner + admin layouts link the owner manifest only", () => {
    assert.equal(OWNER_WEB_MANIFEST_PATH, "/owner.webmanifest");
    assert.equal(ownerPwaMetadata.manifest, OWNER_WEB_MANIFEST_PATH);
    for (const rel of [
      "src/app/owner/layout.tsx",
      "src/app/[shop]/admin/layout.tsx",
      "src/app/admin/layout.tsx",
    ]) {
      const src = readFileSync(resolve(process.cwd(), rel), "utf8");
      assert.match(src, /ownerPwaMetadata/);
    }
    const root = readFileSync(resolve(process.cwd(), "src/app/layout.tsx"), "utf8");
    assert.match(root, /site\.webmanifest/);
    assert.doesNotMatch(root, /owner\.webmanifest/);
  });
});
