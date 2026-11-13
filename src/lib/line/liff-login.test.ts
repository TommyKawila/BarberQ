import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  clearStaleLiffSession,
  retryCustomerLiffLogin,
  startPathAwareLiffLogin,
  type LiffLoginApi,
} from "@/lib/line/liff-login";

function fakeLiff(partial: Partial<LiffLoginApi> & {
  loggedIn?: boolean;
  inClient?: boolean;
} = {}): LiffLoginApi & {
  loginCalls: Array<{ redirectUri?: string } | undefined>;
  logoutCalls: number;
} {
  let loggedIn = partial.loggedIn ?? false;
  const loginCalls: Array<{ redirectUri?: string } | undefined> = [];
  let logoutCalls = 0;
  return {
    loginCalls,
    get logoutCalls() {
      return logoutCalls;
    },
    isLoggedIn: () => loggedIn,
    isInClient: () => partial.inClient ?? false,
    logout: () => {
      logoutCalls += 1;
      loggedIn = false;
      partial.logout?.();
    },
    login: (opts) => {
      loginCalls.push(opts);
      partial.login?.(opts);
    },
  };
}

const memory = new Map<string, string>();

afterEach(() => {
  memory.clear();
  delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
  delete (globalThis as { window?: unknown }).window;
  delete (globalThis as { document?: unknown }).document;
});

function installBrowserShims(pathname = "/barberqpilottest") {
  memory.clear();
  (globalThis as { sessionStorage?: Storage }).sessionStorage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memory.set(k, v);
    },
    removeItem: (k: string) => {
      memory.delete(k);
    },
    clear: () => memory.clear(),
    key: () => null,
    get length() {
      return memory.size;
    },
  } as Storage;
  (globalThis as { window?: { location: { pathname: string; protocol: string; origin: string } } }).window =
    {
      location: {
        pathname,
        protocol: "https:",
        origin: "https://barberq-qa.vercel.app",
      },
    };
  (globalThis as { document?: { cookie: string } }).document = { cookie: "" };
}

describe("path-aware LIFF login wiring", () => {
  it("customer login uses retryCustomerLiffLogin (in-LIFF reload path)", () => {
    const customer = readFileSync(
      resolve(process.cwd(), "src/lib/line/use-line-auth.ts"),
      "utf8",
    );
    const admin = readFileSync(
      resolve(process.cwd(), "src/lib/admin/use-admin-line-auth.tsx"),
      "utf8",
    );
    const qr = readFileSync(
      resolve(process.cwd(), "src/components/customer/QrQueueJoin.tsx"),
      "utf8",
    );
    assert.match(customer, /retryCustomerLiffLogin/);
    assert.match(customer, /isInClient/);
    assert.match(admin, /startPathAwareLiffLogin/);
    assert.match(admin, /ADMIN_NO_SHOP_ACCESS_TH/);
    assert.match(qr, /ล็อกอิน LINE อีกครั้ง/);
    assert.match(qr, /onClick=\{\(\) => login\(\)\}/);
  });

  it("failed shared LIFF init can be retried", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/line/liff-init.ts"),
      "utf8",
    );
    assert.match(src, /sharedLiffInit = null/);
    assert.match(src, /resetSharedLiffInit/);
  });
});

describe("startPathAwareLiffLogin (fake liff)", () => {
  it("clears stuck logged-in session then calls liff.login with path redirectUri", () => {
    installBrowserShims("/barberqpilottest");
    const api = fakeLiff({ loggedIn: true });
    startPathAwareLiffLogin("/barberqpilottest", api);
    assert.equal(api.logoutCalls, 1);
    assert.equal(api.loginCalls.length, 1);
    assert.equal(
      api.loginCalls[0]?.redirectUri,
      "https://barberq-qa.vercel.app/barberqpilottest",
    );
  });

  it("expired / stuck login outside LIFF still starts OAuth (not reload)", () => {
    installBrowserShims("/barberqpilottest/q");
    const api = fakeLiff({ loggedIn: true, inClient: false });
    let reloads = 0;
    const mode = retryCustomerLiffLogin({
      isInClient: false,
      pathname: "/barberqpilottest/q",
      api,
      reload: () => {
        reloads += 1;
      },
    });
    assert.equal(mode, "login");
    assert.equal(reloads, 0);
    assert.equal(api.logoutCalls, 1);
    assert.equal(api.loginCalls.length, 1);
  });
});

describe("retryCustomerLiffLogin in LIFF (fake liff)", () => {
  it("expired token in LIFF: clearStale + resetInit + reload — never liff.login", () => {
    const api = fakeLiff({ loggedIn: true, inClient: true });
    let reloads = 0;
    let resets = 0;
    const mode = retryCustomerLiffLogin({
      isInClient: true,
      api,
      reload: () => {
        reloads += 1;
      },
      resetInit: () => {
        resets += 1;
      },
    });
    assert.equal(mode, "reload");
    assert.equal(api.logoutCalls, 1);
    assert.equal(resets, 1);
    assert.equal(reloads, 1);
    assert.equal(api.loginCalls.length, 0);
  });

  it("clearStaleLiffSession no-ops when already logged out", () => {
    const api = fakeLiff({ loggedIn: false });
    clearStaleLiffSession(api);
    assert.equal(api.logoutCalls, 0);
  });
});
