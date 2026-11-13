import liff from "@line/liff";
import { resetSharedLiffInit } from "@/lib/line/liff-init";
import {
  buildLiffLoginRedirectUriForPath,
  saveLiffReturnPath,
} from "@/lib/line/liff-return";

export type LiffLoginRetryMode = "reload" | "login";

/** Minimal LIFF surface used by login helpers (injectable for tests). */
export type LiffLoginApi = {
  isLoggedIn?: () => boolean;
  isInClient?: () => boolean;
  logout?: () => void;
  login?: (opts?: { redirectUri?: string }) => void;
};

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
 * Customer re-login after expiry / error.
 * Inside real LIFF (`isInClient`), `liff.login()` is a no-op when a stale
 * session still looks logged-in — clear, reset shared init, and reload instead.
 * Outside LIFF (Safari / plain LINE WebView), start path-aware OAuth.
 */
export function retryCustomerLiffLogin(input: {
  isInClient: boolean;
  pathname?: string;
  api?: LiffLoginApi;
  reload?: () => void;
  resetInit?: () => void;
}): LiffLoginRetryMode {
  const api = input.api ?? liff;
  if (input.isInClient) {
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
