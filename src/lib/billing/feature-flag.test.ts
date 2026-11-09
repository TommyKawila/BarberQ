import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isBillingEnabled } from "@/lib/billing/feature-flag";

describe("isBillingEnabled", () => {
  it("is on only for exact string true", () => {
    assert.equal(isBillingEnabled({ NEXT_PUBLIC_ENABLE_BILLING: "true" }), true);
  });

  it("is off when unset", () => {
    assert.equal(isBillingEnabled({}), false);
    assert.equal(isBillingEnabled({ NEXT_PUBLIC_ENABLE_BILLING: undefined }), false);
  });

  it("is off for any other value", () => {
    assert.equal(isBillingEnabled({ NEXT_PUBLIC_ENABLE_BILLING: "True" }), false);
    assert.equal(isBillingEnabled({ NEXT_PUBLIC_ENABLE_BILLING: "TRUE" }), false);
    assert.equal(isBillingEnabled({ NEXT_PUBLIC_ENABLE_BILLING: "1" }), false);
    assert.equal(isBillingEnabled({ NEXT_PUBLIC_ENABLE_BILLING: "false" }), false);
    assert.equal(isBillingEnabled({ NEXT_PUBLIC_ENABLE_BILLING: " true" }), false);
    assert.equal(isBillingEnabled({ NEXT_PUBLIC_ENABLE_BILLING: "true " }), false);
    assert.equal(isBillingEnabled({ NEXT_PUBLIC_ENABLE_BILLING: "" }), false);
  });
});

describe("billing feature flag wiring", () => {
  it("AdminChrome gates TierBillingNotice behind isBillingEnabled", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/components/admin/AdminChrome.tsx"),
      "utf8",
    );
    assert.match(src, /isBillingEnabled/);
    assert.match(src, /isBillingEnabled\(\) \? <TierBillingNotice \/> : null/);
  });

  it("shop billing APIs report disabled when flag is off", () => {
    const notice = readFileSync(
      resolve(process.cwd(), "src/app/api/[shop]/billing/tier-notice/route.ts"),
      "utf8",
    );
    const cancel = readFileSync(
      resolve(
        process.cwd(),
        "src/app/api/[shop]/billing/cancel-feedback/route.ts",
      ),
      "utf8",
    );
    assert.match(notice, /isBillingEnabled/);
    assert.match(notice, /disabled:\s*true/);
    assert.match(notice, /show:\s*false/);
    assert.match(cancel, /isBillingEnabled/);
    assert.match(cancel, /disabled:\s*true/);
  });

  it("does not delete TierBillingNotice component or cancel-feedback helpers", () => {
    readFileSync(
      resolve(process.cwd(), "src/components/admin/TierBillingNotice.tsx"),
      "utf8",
    );
    readFileSync(
      resolve(process.cwd(), "src/lib/billing/cancel-feedback.ts"),
      "utf8",
    );
    readFileSync(
      resolve(process.cwd(), "src/lib/billing/tier-notice.ts"),
      "utf8",
    );
  });
});
