import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { extraArgs, runQaVerify } from "@/lib/founder-qa/cli";
import { evaluateGuards, isPhinxIdentity } from "@/lib/founder-qa/guards";
import { FOUNDER_QA_HOURS, FOUNDER_QA_MANIFEST } from "@/lib/founder-qa/manifest";
import { ordinaryBarberFixtures } from "@/lib/founder-qa/fixtures";
import { looksLikeSecret } from "@/lib/founder-qa/parse";
import { formatVerifyFailure, formatVerifySuccess } from "@/lib/founder-qa/output";
import type { ObservedTarget } from "@/lib/founder-qa/types";
import { evaluateVerify } from "@/lib/founder-qa/verify";

function validObserved(overrides: Partial<ObservedTarget> = {}): ObservedTarget {
  const fixtures = ordinaryBarberFixtures();
  return {
    barberqEnv: "founder_qa",
    supabaseProjectRef: FOUNDER_QA_MANIFEST.qaSupabaseProjectRef,
    appHostname: FOUNDER_QA_MANIFEST.qaAppHostname,
    extraArgs: [],
    supabaseConnected: true,
    managerSchemaPresent: true,
    usingMemoryStore: false,
    usingLineMock: false,
    liffConfigured: true,
    shop: { ...FOUNDER_QA_MANIFEST.shop, status: "active" },
    sentinel: { ...FOUNDER_QA_MANIFEST.sentinel, status: "active" },
    barbers: [
      {
        id: "c0a1b2c3-d4e5-4f60-8a11-00000000a001",
        name: "Founder Owner",
        role: "owner",
        shopId: FOUNDER_QA_MANIFEST.shop.id,
        isActive: true,
        isBookable: false,
        lineLinked: true,
        slotDuration: 30,
        offDays: [],
      },
      ...fixtures.map((b) => ({
        id: b.id,
        name: b.name,
        role: b.role,
        shopId: FOUNDER_QA_MANIFEST.shop.id,
        isActive: b.isActive,
        isBookable: b.isBookable,
        lineLinked: false,
        slotDuration: b.slotDuration,
        offDays: b.offDays,
      })),
    ],
    sentinelBarbers: [],
    activeManagerCount: 0,
    pendingInviteCount: 0,
    appointmentCount: 0,
    hours: FOUNDER_QA_HOURS.map((d) => ({ ...d })),
    ...overrides,
  };
}

describe("qa:verify environment guards", () => {
  it("passes a complete founder_qa target", () => {
    const result = evaluateVerify(validObserved());
    assert.equal(result.ok, true);
  });

  it("rejects production BARBERQ_ENV", () => {
    const result = evaluateGuards(validObserved({ barberqEnv: "production" }));
    assert.equal(result.ok, false);
    assert.equal(result.mutated, false);
    assert.ok(result.checks.some((c) => c.id === "env" && !c.pass));
  });

  it("rejects wrong BARBERQ_ENV", () => {
    const result = evaluateGuards(validObserved({ barberqEnv: "local" }));
    assert.equal(result.ok, false);
  });

  it("rejects unknown environment", () => {
    const result = evaluateGuards(validObserved({ barberqEnv: "unknown" }));
    assert.equal(result.ok, false);
  });

  it("rejects missing environment", () => {
    const result = evaluateGuards(validObserved({ barberqEnv: "missing" }));
    assert.equal(result.ok, false);
  });

  it("rejects wrong Supabase project", () => {
    const result = evaluateGuards(validObserved({ supabaseProjectRef: "other-project" }));
    assert.equal(result.ok, false);
    assert.ok(result.checks.some((c) => c.id === "qa-project" && !c.pass));
  });

  it("rejects known Production project", () => {
    const result = evaluateGuards(
      validObserved({
        supabaseProjectRef: FOUNDER_QA_MANIFEST.productionDenylist.supabaseProjectRef,
      }),
    );
    assert.equal(result.ok, false);
    assert.ok(result.checks.some((c) => c.id === "not-production-project" && !c.pass));
  });

  it("rejects Production hostname", () => {
    const result = evaluateGuards(
      validObserved({
        appHostname: FOUNDER_QA_MANIFEST.productionDenylist.appHostname,
      }),
    );
    assert.equal(result.ok, false);
    assert.ok(result.checks.some((c) => c.id === "not-production-hostname" && !c.pass));
  });

  it("rejects wrong QA hostname", () => {
    const result = evaluateGuards(validObserved({ appHostname: "barber-q-pi.vercel.app" }));
    assert.equal(result.ok, false);
  });

  it("rejects wrong canonical tenant UUID", () => {
    const result = evaluateGuards(
      validObserved({
        shop: { ...FOUNDER_QA_MANIFEST.shop, id: FOUNDER_QA_MANIFEST.phinx.id, status: "active" },
      }),
    );
    assert.equal(result.ok, false);
  });

  it("rejects wrong canonical slug", () => {
    const result = evaluateGuards(
      validObserved({
        shop: { ...FOUNDER_QA_MANIFEST.shop, slug: "phinxstudio", status: "active" },
      }),
    );
    assert.equal(result.ok, false);
  });

  it("rejects wrong canonical name", () => {
    const result = evaluateGuards(
      validObserved({
        shop: { ...FOUNDER_QA_MANIFEST.shop, name: "PHINX STUDIO", status: "active" },
      }),
    );
    assert.equal(result.ok, false);
  });

  it("rejects PHINX slug", () => {
    assert.equal(isPhinxIdentity({ slug: "phinxstudio" }), true);
    const result = evaluateGuards(
      validObserved({
        shop: {
          id: FOUNDER_QA_MANIFEST.shop.id,
          name: FOUNDER_QA_MANIFEST.shop.name,
          slug: "phinxstudio",
          status: "active",
        },
      }),
    );
    assert.equal(result.ok, false);
    assert.ok(result.checks.some((c) => c.id === "not-phinx" && !c.pass));
  });

  it("rejects known PHINX identity", () => {
    const result = evaluateGuards(
      validObserved({
        shop: { ...FOUNDER_QA_MANIFEST.phinx, status: "active" },
      }),
    );
    assert.equal(result.ok, false);
  });

  it("rejects arbitrary target parameters", () => {
    assert.ok(extraArgs(["--shop", "phinxstudio"]).length > 0);
    const result = evaluateGuards(validObserved({ extraArgs: ["--shop=abc"] }));
    assert.equal(result.ok, false);
    assert.ok(result.checks.some((c) => c.id === "no-arbitrary-target" && !c.pass));
  });
});

describe("qa:verify daily invariants", () => {
  it("rejects memory store", () => {
    const result = evaluateVerify(validObserved({ usingMemoryStore: true }));
    assert.equal(result.ok, false);
    assert.ok(result.checks.some((c) => c.id === "not-memory" && !c.pass));
  });

  it("rejects LINE mock auth", () => {
    const result = evaluateVerify(validObserved({ usingLineMock: true }));
    assert.equal(result.ok, false);
    assert.ok(result.checks.some((c) => c.id === "not-line-mock" && !c.pass));
  });

  it("rejects missing manager schema", () => {
    const result = evaluateVerify(validObserved({ managerSchemaPresent: false }));
    assert.equal(result.ok, false);
  });

  it("is read-only: evaluateVerify does not mutate the observed snapshot", () => {
    const observed = validObserved({ appointmentCount: 3 });
    const before = JSON.stringify(observed);
    evaluateVerify(observed);
    assert.equal(JSON.stringify(observed), before);
  });
});

describe("qa:verify output is secret-safe", () => {
  it("success and failure copy contain no secret-like values", () => {
    const pass = formatVerifySuccess(evaluateVerify(validObserved()).checks);
    const fail = formatVerifyFailure(
      evaluateVerify(validObserved({ barberqEnv: "production" })).checks,
    );
    assert.equal(looksLikeSecret(pass), false);
    assert.equal(looksLikeSecret(fail), false);
    assert.ok(!pass.includes("eyJ"));
    assert.ok(!fail.includes("Bearer "));
    assert.equal(looksLikeSecret("Founder QA reset: PASS"), false);
  });
});

describe("qa:verify CLI is read-only against env", () => {
  let saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    saved = {
      BARBERQ_ENV: process.env.BARBERQ_ENV,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_LIFF_ID: process.env.NEXT_PUBLIC_LIFF_ID,
    };
  });

  afterEach(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  it("exits non-zero for production env without writing", async () => {
    process.env.BARBERQ_ENV = "production";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://lbnlsdkpajvczndodvjn.supabase.co";
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    process.env.NEXT_PUBLIC_APP_URL = "https://barber-q-pi.vercel.app";
    const code = await runQaVerify([]);
    assert.equal(code, 1);
  });
});
