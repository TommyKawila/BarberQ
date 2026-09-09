import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  EnvConfigError,
  assertProductionConfig,
  getMissingProductionKeys,
  getOptionalBarberqSupportLineUrl,
  getOptionalLineOaAddUrl,
  getOptionalLinePushToken,
  isProductionRuntime,
} from "@/lib/env";
import { isLineAuthMockMode } from "@/lib/auth/line-verify";
import { isPrototypeMode, getStore } from "@/lib/data";
import { memoryStore } from "@/lib/data/memory-store";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";
import { pushText } from "@/lib/line/push-message";

const PROD_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_LIFF_ID",
  "NEXT_PUBLIC_APP_URL",
  "SUPERADMIN_TOKEN",
] as const;

const FULL_PROD_ENV: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  NEXT_PUBLIC_LIFF_ID: "liff-123",
  NEXT_PUBLIC_APP_URL: "https://app.example.com",
  SUPERADMIN_TOKEN: "super-secret",
};

let savedEnv: Record<string, string | undefined> = {};
let savedNodeEnv: string | undefined;

function saveEnv() {
  savedNodeEnv = process.env.NODE_ENV;
  savedEnv = {};
  for (const key of [
    ...PROD_KEYS,
    "LINE_CHANNEL_ACCESS_TOKEN",
    "NEXT_PUBLIC_LINE_OA_ADD_URL",
    "NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL",
  ]) {
    savedEnv[key] = process.env[key];
  }
}

function setNodeEnv(value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = value;
}

function restoreEnv() {
  setNodeEnv(savedNodeEnv);
  for (const [key, value] of Object.entries(savedEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

function setProductionEnv(overrides: Record<string, string | undefined> = {}) {
  setNodeEnv("production");
  for (const key of PROD_KEYS) {
    if (key in overrides) {
      const value = overrides[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
      continue;
    }
    process.env[key] = FULL_PROD_ENV[key];
  }
}

afterEach(() => {
  restoreEnv();
});

describe("production config hardening", () => {
  it("detects production runtime", () => {
    saveEnv();
    setNodeEnv("production");
    assert.equal(isProductionRuntime(), true);
    setNodeEnv("development");
    assert.equal(isProductionRuntime(), false);
  });

  for (const missingKey of PROD_KEYS) {
    it(`production missing ${missingKey} throws EnvConfigError`, () => {
      saveEnv();
      setProductionEnv({ [missingKey]: undefined });
      assert.throws(() => assertProductionConfig(), EnvConfigError);
      assert.ok(getMissingProductionKeys().includes(missingKey));
    });
  }

  it("production with full config passes assertProductionConfig", () => {
    saveEnv();
    setProductionEnv();
    assert.doesNotThrow(() => assertProductionConfig());
    assert.deepEqual(getMissingProductionKeys(), []);
  });

  it("production must not enable LINE mock", () => {
    saveEnv();
    setProductionEnv();
    assert.equal(isLineAuthMockMode(), false);
  });

  it("production missing LIFF ID throws via isLineAuthMockMode", () => {
    saveEnv();
    setProductionEnv({ NEXT_PUBLIC_LIFF_ID: undefined });
    assert.throws(() => isLineAuthMockMode(), EnvConfigError);
  });

  it("production never uses memory store when configured", () => {
    saveEnv();
    setProductionEnv();
    assert.equal(isPrototypeMode(), false);
    assert.notEqual(getStore(), memoryStore);
  });

  it("production missing Supabase URL throws instead of memory store", () => {
    saveEnv();
    setProductionEnv({ NEXT_PUBLIC_SUPABASE_URL: undefined });
    assert.throws(() => isPrototypeMode(), EnvConfigError);
    assert.throws(() => getStore(), EnvConfigError);
  });

  it("production missing service role throws instead of memory store", () => {
    saveEnv();
    setProductionEnv({ SUPABASE_SERVICE_ROLE_KEY: undefined });
    assert.throws(() => getStore(), EnvConfigError);
  });

  it("production missing SUPERADMIN_TOKEN throws on assertSuperAdminToken", () => {
    saveEnv();
    setProductionEnv({ SUPERADMIN_TOKEN: undefined });
    assert.throws(() => assertSuperAdminToken("any"), EnvConfigError);
  });

  it("production wrong superadmin token still Unauthorized", () => {
    saveEnv();
    setProductionEnv();
    assert.throws(() => assertSuperAdminToken("wrong"), /Unauthorized/);
  });
});

describe("development config allowances", () => {
  it("development may use LINE mock without LIFF ID", () => {
    saveEnv();
    setNodeEnv("development");
    delete process.env.NEXT_PUBLIC_LIFF_ID;
    assert.equal(isLineAuthMockMode(), true);
  });

  it("development may use memory store without Supabase", () => {
    saveEnv();
    setNodeEnv("development");
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.equal(isPrototypeMode(), true);
    assert.equal(getStore(), memoryStore);
  });
});

describe("optional env", () => {
  it("missing LINE push token does not crash pushText", async () => {
    saveEnv();
    delete process.env.LINE_CHANNEL_ACCESS_TOKEN;
    const result = await pushText("U123", "hello");
    assert.equal(result, false);
  });

  it("missing OA add URL is valid", () => {
    saveEnv();
    delete process.env.NEXT_PUBLIC_LINE_OA_ADD_URL;
    assert.equal(getOptionalLineOaAddUrl(), undefined);
    assert.equal(getOptionalLinePushToken(), undefined);
  });

  it("support LINE URL is optional", () => {
    saveEnv();
    delete process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL;
    assert.equal(getOptionalBarberqSupportLineUrl(), undefined);

    process.env.NEXT_PUBLIC_BARBERQ_SUPPORT_LINE_URL = "https://line.me/R/ti/p/@barberq";
    assert.equal(
      getOptionalBarberqSupportLineUrl(),
      "https://line.me/R/ti/p/@barberq",
    );
  });
});
