import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isBillingEnabled } from "@/lib/billing/feature-flag";

describe("isBillingEnabled", () => {
  it("is on only for exact string true", () => {
    assert.equal(isBillingEnabled("true"), true);
  });

  it("is off when unset", () => {
    assert.equal(isBillingEnabled(undefined), false);
  });

  it("is off for any other value", () => {
    assert.equal(isBillingEnabled("True"), false);
    assert.equal(isBillingEnabled("TRUE"), false);
    assert.equal(isBillingEnabled("1"), false);
    assert.equal(isBillingEnabled("false"), false);
    assert.equal(isBillingEnabled(" true"), false);
    assert.equal(isBillingEnabled("true "), false);
    assert.equal(isBillingEnabled(""), false);
  });
});

describe("billing feature flag wiring", () => {
  it("feature-flag.ts contains literal process.env.NEXT_PUBLIC_ENABLE_BILLING", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/billing/feature-flag.ts"),
      "utf8",
    );
    assert.ok(src.includes("process.env.NEXT_PUBLIC_ENABLE_BILLING"));
  });

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
