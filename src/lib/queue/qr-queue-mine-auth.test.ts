import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("QrQueueMine LINE auth error UI", () => {
  const src = readFileSync(
    resolve(process.cwd(), "src/components/customer/QrQueueMine.tsx"),
    "utf8",
  );

  it("shows useLineAuth error near login retry (role=alert, QrQueueJoin pattern)", () => {
    assert.match(src, /error:\s*authError/);
    assert.match(src, /if\s*\(\s*authError\s*\)/);
    assert.match(src, /role="alert"/);
    assert.match(src, /text-red-400/);
    assert.match(src, /data-testid="qr-queue-mine-auth-error"/);
    assert.match(src, /\{authError\}/);
    assert.match(src, /ล็อกอิน LINE อีกครั้ง/);
  });

  it("never couples queue loading to the login CTA", () => {
    assert.doesNotMatch(src, /if\s*\(\s*!ready\s*\|\|\s*loading\s*\)/);
    assert.match(src, /if\s*\(\s*!ready\s*\)/);
    assert.match(src, /if\s*\(\s*!profile\s*\)/);
    assert.match(src, /if\s*\(\s*loading\s*\)/);
  });
});
