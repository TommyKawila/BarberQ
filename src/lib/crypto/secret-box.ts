import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const PREFIX = "v1";

export class SecretBoxError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SecretBoxError";
  }
}

function readEncryptionKey(): Buffer | null {
  const raw = process.env.APP_ENCRYPTION_KEY?.trim();
  if (!raw) return null;
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    return Buffer.from(raw, "hex");
  }
  try {
    const b64 = Buffer.from(raw, "base64");
    if (b64.length === 32) return b64;
  } catch {
    /* fall through */
  }
  // Derive a stable 32-byte key from arbitrary secret strings (dev/QA convenience).
  return createHash("sha256").update(raw, "utf8").digest();
}

export function getAppEncryptionKey(): Buffer {
  const key = readEncryptionKey();
  if (!key) {
    throw new SecretBoxError("Missing APP_ENCRYPTION_KEY");
  }
  return key;
}

export function hasAppEncryptionKey(): boolean {
  return Boolean(readEncryptionKey());
}

/** Encrypt plaintext with AES-256-GCM. Returns `v1:<iv_b64>:<tag_b64>:<ct_b64>`. */
export function encryptSecret(plaintext: string, key = getAppEncryptionKey()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [
    PREFIX,
    iv.toString("base64url"),
    tag.toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(":");
}

export function decryptSecret(payload: string, key = getAppEncryptionKey()): string {
  const parts = payload.split(":");
  if (parts.length !== 4 || parts[0] !== PREFIX) {
    throw new SecretBoxError("Invalid ciphertext format");
  }
  const [, ivB64, tagB64, ctB64] = parts;
  const iv = Buffer.from(ivB64, "base64url");
  const tag = Buffer.from(tagB64, "base64url");
  const ciphertext = Buffer.from(ctB64, "base64url");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function maskSecretLast4(value: string): string {
  const trimmed = value.trim();
  if (trimmed.length <= 4) return trimmed;
  return trimmed.slice(-4);
}
