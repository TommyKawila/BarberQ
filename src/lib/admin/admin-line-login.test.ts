import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ADMIN_NO_SHOP_ACCESS_TH,
  thaiLiffAuthError,
} from "@/lib/line/liff-auth-errors";
import {
  retryCustomerLiffLogin,
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
    },
    login: (opts) => {
      loginCalls.push(opts);
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

function installBrowserShims(pathname: string) {
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
  (globalThis as {
    window?: { location: { pathname: string; protocol: string; origin: string } };
  }).window = {
    location: {
      pathname,
      protocol: "https:",
      origin: "https://barberq-qa.vercel.app",
    },
  };
  (globalThis as { document?: { cookie: string } }).document = { cookie: "" };
}

/** Mirrors admin `login()` — same helper customer uses. */
function adminRetryLogin(input: {
  isInClient: boolean;
  pathname?: string;
  api: LiffLoginApi;
  reload?: () => void;
  resetInit?: () => void;
}) {
  return retryCustomerLiffLogin(input);
}

describe("admin LINE login retry (fake liff)", () => {
  it("wires useAdminLineAuth.login to retryCustomerLiffLogin + isInClient", () => {
    const admin = readFileSync(
      resolve(process.cwd(), "src/lib/admin/use-admin-line-auth.tsx"),
      "utf8",
    );
    assert.match(admin, /retryCustomerLiffLogin/);
    assert.match(admin, /isInClient/);
    assert.match(admin, /ADMIN_NO_SHOP_ACCESS_TH/);
    assert.doesNotMatch(admin, /startPathAwareLiffLogin/);
  });

  it("in-LIFF expiry / stuck login: clear + reset + reload — never liff.login", () => {
    const api = fakeLiff({ loggedIn: true, inClient: true });
    let reloads = 0;
    let resets = 0;
    const mode = adminRetryLogin({
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

  it("outside LIFF: path-aware liff.login (admin login path)", () => {
    installBrowserShims("/barberqpilottest/admin/login");
    const api = fakeLiff({ loggedIn: true, inClient: false });
    let reloads = 0;
    const mode = adminRetryLogin({
      isInClient: false,
      pathname: "/barberqpilottest/admin/login",
      api,
      reload: () => {
        reloads += 1;
      },
    });
    assert.equal(mode, "login");
    assert.equal(reloads, 0);
    assert.equal(api.logoutCalls, 1);
    assert.equal(api.loginCalls.length, 1);
    assert.equal(
      api.loginCalls[0]?.redirectUri,
      "https://barberq-qa.vercel.app/barberqpilottest/admin/login",
    );
  });

  it("Not authorized maps to Thai shop ACL message", () => {
    assert.equal(
      thaiLiffAuthError(new Error("Not authorized")),
      ADMIN_NO_SHOP_ACCESS_TH,
    );
    assert.match(ADMIN_NO_SHOP_ACCESS_TH, /ไม่มีสิทธิ์|หลังบ้าน/);
    const admin = readFileSync(
      resolve(process.cwd(), "src/lib/admin/use-admin-line-auth.tsx"),
      "utf8",
    );
    assert.match(admin, /throw new Error\(ADMIN_NO_SHOP_ACCESS_TH\)/);
  });
});
