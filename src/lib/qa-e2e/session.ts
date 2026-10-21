import { createHmac, timingSafeEqual } from "node:crypto";
import {
  QA_E2E_TOKEN_PREFIX,
} from "@/lib/qa-e2e/allowlist";
import { getQaE2eSecret, isQaE2eEnabled } from "@/lib/qa-e2e/guards";

export interface QaE2ePayload {
  lineUserId: string;
  shopSlug: string;
  role: "owner" | "barber" | "manager";
  exp: number;
}

const DEFAULT_TTL_MS = 2 * 60 * 60 * 1000;

function b64url(input: Buffer | string): string {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(input: string): Buffer {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, "base64");
}

function sign(body: string, secret: string): string {
  return b64url(createHmac("sha256", secret).update(body).digest());
}

export function isQaE2eBearerToken(token: string): boolean {
  return token.startsWith(QA_E2E_TOKEN_PREFIX);
}

export function mintQaE2eToken(
  input: Omit<QaE2ePayload, "exp"> & { ttlMs?: number },
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string | null {
  const secret = getQaE2eSecret(env);
  if (!secret || !isQaE2eEnabled(env)) return null;
  const payload: QaE2ePayload = {
    lineUserId: input.lineUserId,
    shopSlug: input.shopSlug,
    role: input.role,
    exp: Date.now() + (input.ttlMs ?? DEFAULT_TTL_MS),
  };
  const body = b64url(JSON.stringify(payload));
  const sig = sign(body, secret);
  return `${QA_E2E_TOKEN_PREFIX}${body}.${sig}`;
}

export function verifyQaE2eToken(
  token: string,
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): QaE2ePayload | null {
  if (!isQaE2eEnabled(env)) return null;
  const secret = getQaE2eSecret(env);
  if (!secret || !isQaE2eBearerToken(token)) return null;

  const raw = token.slice(QA_E2E_TOKEN_PREFIX.length);
  const dot = raw.lastIndexOf(".");
  if (dot <= 0) return null;
  const body = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expected = sign(body, secret);
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(fromB64url(body).toString("utf8")) as QaE2ePayload;
    if (!payload?.lineUserId || !payload.shopSlug || !payload.exp) return null;
    if (Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
