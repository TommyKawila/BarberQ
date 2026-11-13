import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { LIFF_INIT_FAIL_GUARD_TH } from "@/lib/line/liff-auth-errors";
import {
  readLiffSdkInClient,
  resolveLiffLoginInClient,
} from "@/lib/line/liff-in-client";
import {
  clearLiffInitFailReloadGuard,
  hasLiffInitFailReloadGuard,
  markLiffInitFailReloadGuard,
  retryCustomerLiffLogin,
  type LiffLoginApi,
} from "@/lib/line/liff-login";

const memory = new Map<string, string>();

afterEach(() => {
  memory.clear();
  clearLiffInitFailReloadGuard({
    getItem: (k) => memory.get(k) ?? null,
    setItem: (k, v) => {
      memory.set(k, v);
    },
    removeItem: (k) => {
      memory.delete(k);
    },
  });
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

function memoryStorage() {
  return {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => {
      memory.set(k, v);
    },
    removeItem: (k: string) => {
      memory.delete(k);
    },
  };
}

describe("resolveLiffLoginInClient", () => {
  it("init OK: trusts sdk isInClient only (unchanged)", () => {
    assert.equal(
      resolveLiffLoginInClient({ initOk: true, sdkInClient: true, userAgent: LINE_UA }),
      true,
    );
    assert.equal(
      resolveLiffLoginInClient({
        initOk: true,
        sdkInClient: false,
        userAgent: LINE_UA,
      }),
      false,
      "init OK + not in LIFF must not flip to reload via UA",
    );
    assert.equal(
      resolveLiffLoginInClient({
        initOk: true,
        sdkInClient: null,
        userAgent: LINE_UA,
      }),
      false,
    );
  });

  it("init fails inside LINE: reload path (sdk false/null + LINE UA)", () => {
    assert.equal(
      resolveLiffLoginInClient({
        initOk: false,
        sdkInClient: false,
        userAgent: LINE_UA,
      }),
      true,
    );
    assert.equal(
      resolveLiffLoginInClient({
        initOk: false,
        sdkInClient: null,
        userAgent: LINE_UA,
      }),
      true,
    );
    assert.equal(
      resolveLiffLoginInClient({
        initOk: false,
        sdkInClient: true,
        userAgent: SAFARI_UA,
      }),
      true,
    );
  });

  it("init fails outside LINE: not in-client (caller still reloads via initOk)", () => {
    assert.equal(
      resolveLiffLoginInClient({
        initOk: false,
        sdkInClient: false,
        userAgent: SAFARI_UA,
      }),
      false,
    );
    assert.equal(
      resolveLiffLoginInClient({
        initOk: false,
        sdkInClient: null,
        userAgent: SAFARI_UA,
      }),
      false,
    );
  });
});

describe("customer / admin login routing after init failure (fake liff)", () => {
  it("customer init fails inside LINE -> reload (no liff.login)", () => {
    const api = fakeLiff({ loggedIn: true, inClient: false, inClientThrows: true });
    const inClient = resolveLiffLoginInClient({
      initOk: false,
      sdkInClient: readLiffSdkInClient(api),
      userAgent: LINE_UA,
    });
    assert.equal(inClient, true);
    let reloads = 0;
    const mode = retryCustomerLiffLogin({
      isInClient: inClient,
      initOk: false,
      api,
      storage: memoryStorage(),
      reload: () => {
        reloads += 1;
      },
      resetInit: () => {},
    });
    assert.equal(mode, "reload");
    assert.equal(reloads, 1);
    assert.equal(api.loginCalls, 0);
  });

  it("customer init fails outside LINE -> reload (not liff.login)", () => {
    installBrowserShims("/barberqpilottest");
    const api = fakeLiff({ loggedIn: false, inClient: false });
    const inClient = resolveLiffLoginInClient({
      initOk: false,
      sdkInClient: readLiffSdkInClient(api),
      userAgent: SAFARI_UA,
    });
    assert.equal(inClient, false);
    let reloads = 0;
    const mode = retryCustomerLiffLogin({
      isInClient: inClient,
      initOk: false,
      pathname: "/barberqpilottest",
      api,
      storage: memoryStorage(),
      reload: () => {
        reloads += 1;
      },
      resetInit: () => {},
    });
    assert.equal(mode, "reload");
    assert.equal(reloads, 1);
    assert.equal(api.loginCalls, 0);
  });

  it("admin init fails outside LINE -> reload (not liff.login)", () => {
    installBrowserShims("/shop/admin/login");
    const api = fakeLiff({ loggedIn: false, inClient: false });
    const inClient = resolveLiffLoginInClient({
      initOk: false,
      sdkInClient: readLiffSdkInClient(api),
      userAgent: SAFARI_UA,
    });
    assert.equal(inClient, false);
    let reloads = 0;
    const mode = retryCustomerLiffLogin({
      isInClient: inClient,
      initOk: false,
      pathname: "/shop/admin/login",
      api,
      storage: memoryStorage(),
      reload: () => {
        reloads += 1;
      },
      resetInit: () => {},
    });
    assert.equal(mode, "reload");
    assert.equal(reloads, 1);
    assert.equal(api.loginCalls, 0);
  });

  it("init OK -> unchanged for both (sdk isInClient drives path)", () => {
    installBrowserShims("/shop/admin/login");
    const inLiff = resolveLiffLoginInClient({
      initOk: true,
      sdkInClient: true,
      userAgent: LINE_UA,
    });
    const outLiff = resolveLiffLoginInClient({
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
        initOk: true,
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
        initOk: true,
        pathname: "/shop/admin/login",
        api: apiOut,
      }),
      "login",
    );
    assert.equal(apiOut.loginCalls, 1);
  });

  it("guard used -> Thai message, no reload, no liff.login", () => {
    const api = fakeLiff({ loggedIn: false, inClient: false });
    const storage = memoryStorage();
    let reloads = 0;
    const first = retryCustomerLiffLogin({
      isInClient: false,
      initOk: false,
      api,
      storage,
      reload: () => {
        reloads += 1;
      },
      resetInit: () => {},
    });
    assert.equal(first, "reload");
    assert.equal(reloads, 1);

    const second = retryCustomerLiffLogin({
      isInClient: false,
      initOk: false,
      api,
      storage,
      reload: () => {
        reloads += 1;
      },
      resetInit: () => {},
    });
    assert.equal(second, "guarded");
    assert.equal(reloads, 1);
    assert.equal(api.loginCalls, 0);
    // Hooks must surface this Thai copy (not go silent like bug k).
    assert.match(LIFF_INIT_FAIL_GUARD_TH, /[\u0E00-\u0E7F]/);
    assert.match(LIFF_INIT_FAIL_GUARD_TH, /ปิด.*เปิด|อินเทอร์เน็ต|ลองอีกครั้ง/);
    assert.equal(
      // Same path customer + admin login() take when mode === "guarded"
      second === "guarded" ? LIFF_INIT_FAIL_GUARD_TH : null,
      LIFF_INIT_FAIL_GUARD_TH,
    );
  });

  it("init success clears once-per-session reload guard", () => {
    const storage = memoryStorage();
    markLiffInitFailReloadGuard(storage);
    assert.equal(hasLiffInitFailReloadGuard(storage), true);
    clearLiffInitFailReloadGuard(storage);
    assert.equal(hasLiffInitFailReloadGuard(storage), false);

    // After clear, a later init-fail can reload again.
    const api = fakeLiff({ loggedIn: false, inClient: false });
    let reloads = 0;
    assert.equal(
      retryCustomerLiffLogin({
        isInClient: false,
        initOk: false,
        api,
        storage,
        reload: () => {
          reloads += 1;
        },
        resetInit: () => {},
      }),
      "reload",
    );
    assert.equal(reloads, 1);
    assert.equal(api.loginCalls, 0);
  });

  it("hooks recompute resolveLiffLoginInClient on login with liffInitOk", () => {
    const customer = readFileSync(
      resolve(process.cwd(), "src/lib/line/use-line-auth.ts"),
      "utf8",
    );
    const admin = readFileSync(
      resolve(process.cwd(), "src/lib/admin/use-admin-line-auth.tsx"),
      "utf8",
    );
    for (const src of [customer, admin]) {
      assert.match(src, /resolveLiffLoginInClient/);
      assert.match(src, /readLiffSdkInClient/);
      assert.match(src, /liffInitOk/);
      assert.match(src, /retryCustomerLiffLogin\(\{[\s\S]*?initOk: liffInitOk/);
      assert.match(src, /LIFF_INIT_FAIL_GUARD_TH/);
      assert.match(src, /mode === "guarded"/);
      assert.match(src, /clearLiffInitFailReloadGuard\(\)/);
    }
  });
});
