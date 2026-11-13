import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("path-aware LIFF login wiring", () => {
  it("clears stale session before liff.login (expired-token re-login)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/line/liff-login.ts"),
      "utf8",
    );
    assert.match(src, /clearStaleLiffSession/);
    assert.match(src, /liff\.isLoggedIn/);
    assert.match(src, /liff\.logout/);
    assert.match(src, /buildLiffLoginRedirectUriForPath/);
    assert.match(src, /saveLiffReturnPath/);
  });

  it("customer + admin + QrQueueJoin use recoverable login path", () => {
    const customer = readFileSync(
      resolve(process.cwd(), "src/lib/line/use-line-auth.ts"),
      "utf8",
    );
    const admin = readFileSync(
      resolve(process.cwd(), "src/lib/admin/use-admin-line-auth.tsx"),
      "utf8",
    );
    const qr = readFileSync(
      resolve(process.cwd(), "src/components/customer/QrQueueJoin.tsx"),
      "utf8",
    );
    assert.match(customer, /startPathAwareLiffLogin/);
    assert.match(customer, /thaiLiffAuthError/);
    assert.match(customer, /isExpiredLiffTokenError/);
    assert.match(admin, /startPathAwareLiffLogin/);
    assert.match(admin, /thaiLiffAuthError/);
    assert.match(qr, /ล็อกอิน LINE อีกครั้ง/);
    assert.match(qr, /onClick=\{\(\) => login\(\)\}/);
  });

  it("failed shared LIFF init can be retried", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/line/liff-init.ts"),
      "utf8",
    );
    assert.match(src, /sharedLiffInit = null/);
    assert.match(src, /resetSharedLiffInit/);
  });
});
