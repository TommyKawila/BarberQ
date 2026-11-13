import liff from "@line/liff";
import { resetSharedLiffInit } from "@/lib/line/liff-init";
import {
  buildLiffLoginRedirectUriForPath,
  saveLiffReturnPath,
} from "@/lib/line/liff-return";

export type LiffLoginRetryMode = "reload" | "login" | "guarded";

/** Session flag: at most one init-fail reload per tab (avoids infinite loops). */
export const LIFF_INIT_FAIL_RELOAD_KEY = "barberq_liff_init_fail_reload";

/** Minimal LIFF surface used by login helpers (injectable for tests). */
export type LiffLoginApi = {
  isLoggedIn?: () => boolean;
  isInClient?: () => boolean;
  logout?: () => void;
  login?: (opts?: { redirectUri?: string }) => void;
};

export type LiffLoginStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
};

function defaultSessionStorage(): LiffLoginStorage | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

/** True when this tab already reloaded once for a LIFF init failure. */
export function hasLiffInitFailReloadGuard(
  storage?: LiffLoginStorage | null,
): boolean {
  const store = storage === undefined ? defaultSessionStorage() : storage;
  if (!store) return false;
  try {
    return store.getItem(LIFF_INIT_FAIL_RELOAD_KEY) === "1";
  } catch {
    return false;
  }
}

/** Mark that we are about to reload for a LIFF init failure. */
export function markLiffInitFailReloadGuard(
  storage?: LiffLoginStorage | null,
): void {
  const store = storage === undefined ? defaultSessionStorage() : storage;
  if (!store) return;
  try {
    store.setItem(LIFF_INIT_FAIL_RELOAD_KEY, "1");
  } catch {
    /* Private / blocked storage */
  }
}

/**
 * Clear the init-fail reload guard (call when LIFF init succeeds so a later
 * network drop in the same tab can reload again).
 */
export function clearLiffInitFailReloadGuard(
  storage?: LiffLoginStorage | null,
): void {
  const store = storage === undefined ? defaultSessionStorage() : storage;
  if (!store?.removeItem) return;
  try {
    store.removeItem(LIFF_INIT_FAIL_RELOAD_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Drop a stale LIFF session so `liff.login()` actually redirects.
 * When an expired access token is still present, `liff.login()` is a no-op
 * because `isLoggedIn()` stays true — the re-login button then does nothing.
 */
export function clearStaleLiffSession(api: LiffLoginApi = liff): void {
  try {
    if (typeof api.isLoggedIn === "function" && api.isLoggedIn()) {
      api.logout?.();
    }
  } catch {
    /* ignore — storage / SDK edge cases in Private / in-app */
  }
}

/**
 * Start LINE Login with a path-specific redirectUri so Safari Private / app
 * switches still land on the page the user started from (not marketing `/`),
 * even when sessionStorage + return-path cookies are lost.
 */
export function startPathAwareLiffLogin(
  pathname?: string,
  api: LiffLoginApi = liff,
): void {
  const path =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "/");
  saveLiffReturnPath(path);
  clearStaleLiffSession(api);
  api.login?.({ redirectUri: buildLiffLoginRedirectUriForPath(path) });
}

/**
 * Customer / admin re-login after expiry / error / init failure.
 *
 * - Inside LIFF (`isInClient`): clear, reset shared init, reload.
 * - Init failed (`initOk: false`): reload to re-init — `liff.login()` throws
 *   when the SDK never initialised. Guarded once per session to avoid loops.
 * - Outside LIFF with init OK: path-aware OAuth.
 */
export function retryCustomerLiffLogin(input: {
  isInClient: boolean;
  /** False when LIFF init failed / never finished. Defaults to true. */
  initOk?: boolean;
  pathname?: string;
  api?: LiffLoginApi;
  reload?: () => void;
  resetInit?: () => void;
  storage?: LiffLoginStorage | null;
}): LiffLoginRetryMode {
  const api = input.api ?? liff;
  const initOk = input.initOk !== false;
  const needsReload = input.isInClient || !initOk;

  if (needsReload) {
    if (!initOk) {
      if (hasLiffInitFailReloadGuard(input.storage)) {
        return "guarded";
      }
      markLiffInitFailReloadGuard(input.storage);
    }
    clearStaleLiffSession(api);
    (input.resetInit ?? resetSharedLiffInit)();
    const reload =
      input.reload ??
      (() => {
        if (typeof window !== "undefined") window.location.reload();
      });
    reload();
    return "reload";
  }
  startPathAwareLiffLogin(input.pathname, api);
  return "login";
}
