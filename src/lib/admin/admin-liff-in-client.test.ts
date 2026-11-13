import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  readLiffSdkInClient,
  resolveAdminLoginInClient,
} from "@/lib/admin/admin-liff-in-client";
import { retryCustomerLiffLogin, type LiffLoginApi } from "@/lib/line/liff-login";

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

const LINE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Line/13.0.0";
const SAFARI_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

function fakeLiff(partial: {
  loggedIn?: boolean;
  inClient?: boolean;
  inClientThrows?: boolean;
}): LiffLoginApi & {
  loginCalls: number;
  logoutCalls: number;
} {
  let loggedIn = partial.loggedIn ?? false;
  let loginCalls = 0;
  let logoutCalls = 0;
  return {
    get loginCalls() {
      return loginCalls;
    },
    get logoutCalls() {
      return logoutCalls;
    },
    isLoggedIn: () => loggedIn,
    isInClient: () => {
      if (partial.inClientThrows) throw new Error("LIFF not initialized");
      return partial.inClient ?? false;
    },
    logout: () => {
      logoutCalls += 1;
      loggedIn = false;
    },
    login: () => {
      loginCalls += 1;
    },
  };
}

describe("resolveAdminLoginInClient", () => {
  it("init OK: trusts sdk isInClient only (unchanged)", () => {
    assert.equal(
      resolveAdminLoginInClient({ initOk: true, sdkInClient: true, userAgent: LINE_UA }),
      true,
    );
    assert.equal(
      resolveAdminLoginInClient({
        initOk: true,
        sdkInClient: false,
        userAgent: LINE_UA,
      }),
      false,
      "init OK + not in LIFF must not flip to reload via UA",
    );
    assert.equal(
      resolveAdminLoginInClient({
        initOk: true,
        sdkInClient: null,
        userAgent: LINE_UA,
      }),
      false,
    );
  });

  it("init fails inside LINE: reload path (sdk false/null + LINE UA)", () => {
    assert.equal(
      resolveAdminLoginInClient({
        initOk: false,
        sdkInClient: false,
        userAgent: LINE_UA,
      }),
      true,
    );
    assert.equal(
      resolveAdminLoginInClient({
        initOk: false,
        sdkInClient: null,
        userAgent: LINE_UA,
      }),
      true,
    );
    assert.equal(
      resolveAdminLoginInClient({
        initOk: false,
        sdkInClient: true,
        userAgent: SAFARI_UA,
      }),
      true,
    );
  });

  it("init fails outside LINE: web login path", () => {
    assert.equal(
      resolveAdminLoginInClient({
        initOk: false,
        sdkInClient: false,
        userAgent: SAFARI_UA,
      }),
      false,
    );
    assert.equal(
      resolveAdminLoginInClient({
        initOk: false,
        sdkInClient: null,
        userAgent: SAFARI_UA,
      }),
      false,
    );
  });
});

describe("admin login routing after init failure (fake liff)", () => {
  it("init fails inside LINE -> retryCustomerLiffLogin reload (no liff.login)", () => {
    const api = fakeLiff({ loggedIn: true, inClient: false, inClientThrows: true });
    const inClient = resolveAdminLoginInClient({
      initOk: false,
      sdkInClient: readLiffSdkInClient(api),
      userAgent: LINE_UA,
    });
    assert.equal(inClient, true);
    let reloads = 0;
    const mode = retryCustomerLiffLogin({
      isInClient: inClient,
      api,
      reload: () => {
        reloads += 1;
      },
      resetInit: () => {},
    });
    assert.equal(mode, "reload");
    assert.equal(reloads, 1);
    assert.equal(api.loginCalls, 0);
  });

  it("init fails outside LINE -> path-aware web login", () => {
    installBrowserShims("/shop/admin/login");
    const api = fakeLiff({ loggedIn: false, inClient: false });
    const inClient = resolveAdminLoginInClient({
      initOk: false,
      sdkInClient: readLiffSdkInClient(api),
      userAgent: SAFARI_UA,
    });
    assert.equal(inClient, false);
    const mode = retryCustomerLiffLogin({
      isInClient: inClient,
      pathname: "/shop/admin/login",
      api,
      reload: () => {
        throw new Error("should not reload");
      },
    });
    assert.equal(mode, "login");
    assert.equal(api.loginCalls, 1);
  });

  it("init OK -> unchanged (sdk isInClient drives path)", () => {
    installBrowserShims("/shop/admin/login");
    const inLiff = resolveAdminLoginInClient({
      initOk: true,
      sdkInClient: true,
      userAgent: LINE_UA,
    });
    const outLiff = resolveAdminLoginInClient({
      initOk: true,
      sdkInClient: false,
      userAgent: LINE_UA,
    });
    assert.equal(inLiff, true);
    assert.equal(outLiff, false);

    const apiIn = fakeLiff({ loggedIn: true, inClient: true });
    assert.equal(
      retryCustomerLiffLogin({
        isInClient: inLiff,
        api: apiIn,
        reload: () => {},
        resetInit: () => {},
      }),
      "reload",
    );
    assert.equal(apiIn.loginCalls, 0);

    const apiOut = fakeLiff({ loggedIn: false, inClient: false });
    assert.equal(
      retryCustomerLiffLogin({
        isInClient: outLiff,
        pathname: "/shop/admin/login",
        api: apiOut,
      }),
      "login",
    );
    assert.equal(apiOut.loginCalls, 1);
  });

  it("use-admin-line-auth wires resolveAdminLoginInClient on login", () => {
    const src = readFileSync(
      resolve(process.cwd(), "src/lib/admin/use-admin-line-auth.tsx"),
      "utf8",
    );
    assert.match(src, /resolveAdminLoginInClient/);
    assert.match(src, /readLiffSdkInClient/);
    assert.match(src, /liffInitOk/);
    assert.match(src, /retryCustomerLiffLogin/);
  });
});
