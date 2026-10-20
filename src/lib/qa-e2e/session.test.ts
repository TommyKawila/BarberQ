import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { QA_E2E_ALLOWED_SUPABASE_REF } from "@/lib/qa-e2e/allowlist";
import { evaluateQaE2eGuards } from "@/lib/qa-e2e/guards";
import { mintQaE2eToken, verifyQaE2eToken } from "@/lib/qa-e2e/session";

const BASE_ENV: NodeJS.ProcessEnv = {
  NODE_ENV: "test",
  QA_E2E_SECRET: "test-secret-not-real",
  BARBERQ_ENV: "founder_qa",
  NEXT_PUBLIC_SUPABASE_URL: `https://${QA_E2E_ALLOWED_SUPABASE_REF}.supabase.co`,
  NEXT_PUBLIC_APP_URL: "https://barberq-qa.vercel.app",
};

describe("qa-e2e guards", () => {
  it("enables only for founder_qa + barberq-qa supabase + secret", () => {
    assert.equal(evaluateQaE2eGuards(BASE_ENV).enabled, true);
  });

  it("disables without secret", () => {
    const { enabled, reason } = evaluateQaE2eGuards({ ...BASE_ENV, QA_E2E_SECRET: "" });
    assert.equal(enabled, false);
    assert.equal(reason, "missing_secret");
  });

  it("disables on production BARBERQ_ENV", () => {
    const { enabled, reason } = evaluateQaE2eGuards({
      ...BASE_ENV,
      BARBERQ_ENV: "production",
    });
    assert.equal(enabled, false);
    assert.equal(reason, "wrong_barberq_env");
  });

  it("disables on production supabase ref", () => {
    const { enabled, reason } = evaluateQaE2eGuards({
      ...BASE_ENV,
      NEXT_PUBLIC_SUPABASE_URL: "https://lbnlsdkpajvczndodvjn.supabase.co",
    });
    assert.equal(enabled, false);
    assert.equal(reason, "production_supabase");
  });

  it("disables on production app hostname", () => {
    const { enabled, reason } = evaluateQaE2eGuards({
      ...BASE_ENV,
      NEXT_PUBLIC_APP_URL: "https://barber-q-pi.vercel.app",
    });
    assert.equal(enabled, false);
    assert.equal(reason, "production_hostname");
  });
});

describe("qa-e2e session token", () => {
  const keys = [
    "QA_E2E_SECRET",
    "BARBERQ_ENV",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_APP_URL",
  ] as const;
  const saved: Record<string, string | undefined> = {};

  afterEach(() => {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  function applyEnv(env: NodeJS.ProcessEnv) {
    for (const k of keys) {
      saved[k] = process.env[k];
      const v = env[k];
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }

  it("mints and verifies a token when guards pass", () => {
    applyEnv(BASE_ENV);
    const token = mintQaE2eToken({
      lineUserId: "U_qa_owner",
      shopSlug: "barberqpilottest",
      role: "owner",
    });
    assert.ok(token);
    const payload = verifyQaE2eToken(token!);
    assert.equal(payload?.lineUserId, "U_qa_owner");
    assert.equal(payload?.shopSlug, "barberqpilottest");
  });

  it("rejects forged tokens", () => {
    applyEnv(BASE_ENV);
    const token = mintQaE2eToken({
      lineUserId: "U_qa_owner",
      shopSlug: "barberqpilottest",
      role: "owner",
    });
    assert.ok(token);
    const forged = token!.replace(/\.[^.]+$/, ".deadbeef");
    assert.equal(verifyQaE2eToken(forged), null);
  });

  it("does not mint when disabled", () => {
    applyEnv({ ...BASE_ENV, QA_E2E_SECRET: undefined });
    assert.equal(
      mintQaE2eToken({
        lineUserId: "U_qa_owner",
        shopSlug: "barberqpilottest",
        role: "owner",
      }),
      null,
    );
  });
});
