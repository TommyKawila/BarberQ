const RETURN_KEY = "barberq_liff_return";
export const LIFF_RETURN_COOKIE = RETURN_KEY;
/** Session flag: at most one automatic OAuth callback redirect per tab. */
export const LIFF_CALLBACK_GUARD_KEY = "barberq_liff_cb_guard";
/** Query flag shown when Safari→Chrome (or any cookie-less) OAuth callback fails. */
export const LIFF_LOGIN_ERROR_PARAM = "login_error";
export const LIFF_LOGIN_ERROR_BROWSER = "browser";

const FALLBACK_MISMATCH_PATH = "/owner";

export function isSafeReturnPath(path: string): boolean {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("://");
}

/**
 * LINE Login / LIFF authorize `redirect_uri` — must match the registered
 * callback (site origin only). Carry return path + invite tokens in
 * cookie/session via {@link saveLiffReturnPath}, not in this URL.
 * Same builder admin + customer login use (`window.location.origin`).
 *
 * Prefer a path-specific redirectUri (e.g. `/owner`) when starting login from
 * that page so a browser switch still lands on the right route without the cookie.
 */
export function buildLiffLoginRedirectUri(pageOrigin?: string): string {
  if (pageOrigin) {
    try {
      return new URL(pageOrigin).origin;
    } catch {
      return pageOrigin.replace(/\/$/, "");
    }
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "";
}

/** Origin + `/owner` redirectUri so OAuth can complete without the return-path cookie. */
export function buildOwnerEntryLoginRedirectUri(pageOrigin?: string): string {
  const origin = buildLiffLoginRedirectUri(pageOrigin);
  return origin ? `${origin}/owner` : "/owner";
}

export function saveLiffReturnPath(pathname: string) {
  if (!isSafeReturnPath(pathname)) return;
  try {
    sessionStorage.setItem(RETURN_KEY, pathname);
  } catch {
    /* ignore */
  }
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${RETURN_KEY}=${encodeURIComponent(pathname)}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

export function peekLiffReturnPath(): string | null {
  try {
    const stored = sessionStorage.getItem(RETURN_KEY);
    if (stored && isSafeReturnPath(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

/** Consume stored return path. Returns null when missing (do NOT invent `/`). */
export function consumeLiffReturnPath(): string | null {
  try {
    const stored = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
    if (stored && isSafeReturnPath(stored)) return stored;
  } catch {
    /* ignore */
  }
  return null;
}

export function isLiffOAuthCallback(search: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return Boolean(params.get("code") && params.get("liffClientId"));
}

export function hasLiffCallbackGuard(): boolean {
  try {
    return sessionStorage.getItem(LIFF_CALLBACK_GUARD_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLiffCallbackGuard(): void {
  try {
    sessionStorage.setItem(LIFF_CALLBACK_GUARD_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearLiffCallbackGuard(): void {
  try {
    sessionStorage.removeItem(LIFF_CALLBACK_GUARD_KEY);
  } catch {
    /* ignore */
  }
}

export function ownerBrowserMismatchHref(): string {
  return `${FALLBACK_MISMATCH_PATH}?${LIFF_LOGIN_ERROR_PARAM}=${LIFF_LOGIN_ERROR_BROWSER}`;
}

export function isOwnerBrowserMismatchSearch(search: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return params.get(LIFF_LOGIN_ERROR_PARAM) === LIFF_LOGIN_ERROR_BROWSER;
}

export type LiffCallbackAction =
  | { type: "forward"; href: string }
  | { type: "browser_mismatch"; href: string }
  | { type: "stop" };

/**
 * Decide navigation for a LIFF OAuth callback landing on `/` (SalesPage).
 * Never forwards to the same URL with the same OAuth query (that loops forever
 * when the return-path cookie is missing after a Safari→Chrome handoff).
 */
export function resolveLiffCallbackAction(input: {
  search: string;
  returnPath: string | null;
  guardAlreadySet: boolean;
}): LiffCallbackAction {
  if (!isLiffOAuthCallback(input.search)) return { type: "stop" };
  if (input.guardAlreadySet) return { type: "stop" };

  const path = input.returnPath;
  if (path && path !== "/") {
    const params = new URLSearchParams(
      input.search.startsWith("?") ? input.search.slice(1) : input.search,
    );
    const qs = params.toString();
    return { type: "forward", href: qs ? `${path}?${qs}` : path };
  }

  // Missing cookie/session (cross-browser) — one-shot escape hatch, no OAuth params.
  return { type: "browser_mismatch", href: ownerBrowserMismatchHref() };
}
