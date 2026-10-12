import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { verifyLineSignature } from "@/lib/line/signature";

describe("verifyLineSignature", () => {
  it("accepts valid HMAC", () => {
    const body = '{"events":[]}';
    const secret = "channel-secret";
    const sig = createHmac("sha256", secret).update(body).digest("base64");
    assert.equal(verifyLineSignature(body, secret, sig), true);
  });

  it("rejects invalid signature", () => {
    assert.equal(verifyLineSignature("{}", "secret", "nope"), false);
    assert.equal(verifyLineSignature("{}", "secret", null), false);
  });
});
