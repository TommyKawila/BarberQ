import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  shouldShowStatsSampleLabel,
  STATS_SAMPLE_QUERY_KEY,
} from "@/lib/admin/stats-sample-label";

describe("shouldShowStatsSampleLabel", () => {
  it("is false by default (no query)", () => {
    assert.equal(shouldShowStatsSampleLabel(null), false);
    assert.equal(shouldShowStatsSampleLabel(undefined), false);
    assert.equal(shouldShowStatsSampleLabel(""), false);
    assert.equal(shouldShowStatsSampleLabel(new URLSearchParams()), false);
  });

  it("is false for unrelated query params", () => {
    assert.equal(shouldShowStatsSampleLabel("range=week"), false);
    assert.equal(shouldShowStatsSampleLabel("sample=1"), false);
    assert.equal(shouldShowStatsSampleLabel("cqSample=true"), false);
    assert.equal(shouldShowStatsSampleLabel("cqSample=0"), false);
  });

  it("is true only for explicit cqSample=1", () => {
    assert.equal(shouldShowStatsSampleLabel("cqSample=1"), true);
    assert.equal(shouldShowStatsSampleLabel("?cqSample=1&range=week"), true);
    assert.equal(
      shouldShowStatsSampleLabel(new URLSearchParams({ [STATS_SAMPLE_QUERY_KEY]: "1" })),
      true,
    );
  });
});
