import liff from "@line/liff";
import {
  buildLiffLoginRedirectUriForPath,
  saveLiffReturnPath,
} from "@/lib/line/liff-return";

/**
 * Drop a stale LIFF session so `liff.login()` actually redirects.
 * When an expired access token is still present, `liff.login()` is a no-op
 * because `isLoggedIn()` stays true — the re-login button then does nothing.
 */
export function clearStaleLiffSession(): void {
  try {
    if (typeof liff.isLoggedIn === "function" && liff.isLoggedIn()) {
      liff.logout();
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
export function startPathAwareLiffLogin(pathname?: string): void {
  const path =
    pathname ??
    (typeof window !== "undefined" ? window.location.pathname : "/");
  saveLiffReturnPath(path);
  clearStaleLiffSession();
  liff.login({ redirectUri: buildLiffLoginRedirectUriForPath(path) });
}
