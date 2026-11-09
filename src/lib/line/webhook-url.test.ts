import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { shopLineSetupEmail } from "@/lib/line/webhook-url";

const ENV_KEY = "CLIPPERQ_SETUP_EMAIL";
let saved: string | undefined;

function setSetupEmail(value: string | undefined) {
  if (value === undefined) delete process.env[ENV_KEY];
  else process.env[ENV_KEY] = value;
}

afterEach(() => {
  setSetupEmail(saved);
});

describe("shopLineSetupEmail", () => {
  saved = process.env[ENV_KEY];

  it("inserts +shopId immediately before @ for a full email", () => {
    setSetupEmail("setup@example.com");
    const shopId = "c0a1b2c3-d4e5-4f60-8a11-00000000f001";
    assert.equal(
      shopLineSetupEmail(shopId),
      `setup+${shopId}@example.com`,
    );
  });

  it("still inserts before @ when the base local-part already has a + tag", () => {
    setSetupEmail("setup+ops@example.com");
    const shopId = "shop-abc";
    assert.equal(
      shopLineSetupEmail(shopId),
      "setup+ops+shop-abc@example.com",
    );
  });

  it("returns null when env is unset or blank", () => {
    setSetupEmail(undefined);
    assert.equal(shopLineSetupEmail("shop-1"), null);
    setSetupEmail("");
    assert.equal(shopLineSetupEmail("shop-1"), null);
    setSetupEmail("   ");
    assert.equal(shopLineSetupEmail("shop-1"), null);
  });

  it("never falls back to barberqx.com or a bare @gmail.com", () => {
    setSetupEmail(undefined);
    const result = shopLineSetupEmail("shop-1");
    assert.equal(result, null);
    assert.doesNotMatch(String(result ?? ""), /barberqx\.com/);
    assert.doesNotMatch(String(result ?? ""), /@gmail\.com$/);
  });

  it("source uses CLIPPERQ_SETUP_EMAIL and not BARBERQX_SETUP_EMAIL_DOMAIN", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/line/webhook-url.ts"),
      "utf8",
    );
    assert.match(src, /CLIPPERQ_SETUP_EMAIL/);
    assert.doesNotMatch(src, /BARBERQX_SETUP_EMAIL_DOMAIN/);
    assert.doesNotMatch(src, /barberqx\.com/);
  });

  it("line-channel route forwards shopLineSetupEmail (including null)", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/app/api/[shop]/line-channel/route.ts"),
      "utf8",
    );
    assert.match(src, /shopLineSetupEmail/);
    assert.doesNotMatch(src, /function setupEmail/);
    assert.doesNotMatch(src, /BARBERQX_SETUP_EMAIL_DOMAIN/);
  });

  it("LINE settings UI: email step or support link; hide when both missing", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/app/admin/settings/line/page.tsx"),
      "utf8",
    );
    assert.match(
      src,
      /NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL/,
    );
    assert.match(src, /const SUPPORT_LINE_URL = process\.env\.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL/);
    assert.match(src, /setupEmail \? \(/);
    assert.match(src, /SUPPORT_LINE_URL \? \(/);
    assert.match(src, /href=\{SUPPORT_LINE_URL\}/);
    assert.match(src, /min-h-11/);
    assert.match(src, /lineConnect\.contactTeamViaLine/);
    assert.match(src, /: null\}/);
    assert.doesNotMatch(src, /barberqx\.com/);
    assert.doesNotMatch(src, /setup@[a-z0-9.-]+\.(com|net|org)/i);
  });
});
