import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  decryptSecret,
  encryptSecret,
  maskSecretLast4,
} from "@/lib/crypto/secret-box";

describe("secret-box", () => {
  const key = Buffer.from("0123456789abcdef0123456789abcdef");

  it("round-trips plaintext", () => {
    const enc = encryptSecret("super-secret-token", key);
    assert.match(enc, /^v1:/);
    assert.equal(decryptSecret(enc, key), "super-secret-token");
  });

  it("produces different ciphertext each time", () => {
    const a = encryptSecret("same", key);
    const b = encryptSecret("same", key);
    assert.notEqual(a, b);
  });

  it("rejects tampered ciphertext", () => {
    const enc = encryptSecret("hello", key);
    const parts = enc.split(":");
    parts[3] = Buffer.from("tampered").toString("base64url");
    assert.throws(() => decryptSecret(parts.join(":"), key));
  });

  it("masks last 4", () => {
    assert.equal(maskSecretLast4("abcdefgh"), "efgh");
  });
});
