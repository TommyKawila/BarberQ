import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { deviceLabelFromUa } from "@/lib/webpush/device-label";

describe("deviceLabelFromUa", () => {
  it("detects iPadOS desktop UA with touch", () => {
    assert.equal(
      deviceLabelFromUa(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
        5,
      ),
      "iPad Safari",
    );
  });

  it("keeps iPhone label for iPhone UA", () => {
    assert.equal(
      deviceLabelFromUa(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        5,
      ),
      "iPhone Safari",
    );
  });

  it("labels explicit iPad UA", () => {
    assert.equal(
      deviceLabelFromUa(
        "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        5,
      ),
      "iPad Safari",
    );
  });
});
