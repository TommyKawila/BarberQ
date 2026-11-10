const RETURN_KEY = "barberq_liff_return";
export const LIFF_RETURN_COOKIE = RETURN_KEY;
/** Session flag: at most one automatic OAuth callback redirect per tab (bound to OAuth `code`). */
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

function writeLiffReturnCookie(pathname: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${RETURN_KEY}=${encodeURIComponent(pathname)}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

function clearLiffReturnCookie() {
  if (typeof document === "undefined") return;
  document.cookie = `${RETURN_KEY}=; Path=/; Max-Age=0`;
}

/** Cookie fallback when sessionStorage is unavailable (Safari Private). */
export function readLiffReturnCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${RETURN_KEY}=([^;]*)`));
  if (!match?.[1]) return null;
  try {
    const path = decodeURIComponent(match[1]);
    if (path && isSafeReturnPath(path) && path !== "/") return path;
  } catch {
    /* ignore */
  }
  return null;
}

/** Last shop slug cookie set by middleware — recover booking flow when return path is lost. */
export const LAST_SHOP_COOKIE = "barberq_last_shop";

export function peekLastShopReturnPath(
  cookieValue?: string | null,
): string | null {
  const raw =
    cookieValue ??
    (typeof document !== "undefined"
      ? document.cookie.match(new RegExp(`(?:^|; )${LAST_SHOP_COOKIE}=([^;]*)`))?.[1]
      : null);
  if (!raw) return null;
  let slug = raw;
  try {
    slug = decodeURIComponent(raw);
  } catch {
    return null;
  }
  slug = slug.trim();
  if (!slug || slug.includes("/") || slug.includes(".")) return null;
  const path = `/${slug}`;
  return isSafeReturnPath(path) ? path : null;
}

export function saveLiffReturnPath(pathname: string) {
  if (!isSafeReturnPath(pathname)) return;
  // New login attempt — drop any prior callback guard so a later hop can forward.
  clearLiffCallbackGuard();
  try {
    sessionStorage.setItem(RETURN_KEY, pathname);
  } catch {
    /* ignore — Safari Private may throw */
  }
  writeLiffReturnCookie(pathname);
}

export function peekLiffReturnPath(): string | null {
  try {
    const stored = sessionStorage.getItem(RETURN_KEY);
    if (stored && isSafeReturnPath(stored) && stored !== "/") return stored;
  } catch {
    /* ignore */
  }
  return readLiffReturnCookie();
}

/** Consume stored return path (session first, then cookie). Returns null when missing. */
export function consumeLiffReturnPath(): string | null {
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem(RETURN_KEY);
    sessionStorage.removeItem(RETURN_KEY);
  } catch {
    /* ignore */
  }
  if (stored && isSafeReturnPath(stored) && stored !== "/") {
    clearLiffReturnCookie();
    return stored;
  }
  const fromCookie = readLiffReturnCookie();
  clearLiffReturnCookie();
  return fromCookie;
}

export function isLiffOAuthCallback(search: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return Boolean(params.get("code") && params.get("liffClientId"));
}

/** OAuth `code` from a LIFF callback query string (or null). */
export function oauthCodeFromSearch(search: string): string | null {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return params.get("code");
}

/**
 * True when this tab already auto-forwarded the same OAuth `code`.
 * Bound to `code` so a later login (new code) in the same tab can still forward.
 */
export function hasLiffCallbackGuard(oauthCode?: string | null): boolean {
  try {
    const stored = sessionStorage.getItem(LIFF_CALLBACK_GUARD_KEY);
    if (!stored) return false;
    if (oauthCode) return stored === oauthCode;
    return true;
  } catch {
    return false;
  }
}

/** Record that we already auto-forwarded this OAuth `code` (max one hop per code). */
export function setLiffCallbackGuard(oauthCode?: string | null): void {
  if (!oauthCode) return;
  try {
    sessionStorage.setItem(LIFF_CALLBACK_GUARD_KEY, oauthCode);
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

/** Owner-only mismatch URL — used when `/owner` OAuth cannot complete cross-browser. */
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
 *
 * Prefer stored return path; else last-shop path (Private mode recovery).
 * Still never invent `/owner` for customer/admin flows.
 */
export function resolveLiffCallbackAction(input: {
  search: string;
  returnPath: string | null;
  guardAlreadySet: boolean;
  /** e.g. `/{shopSlug}` from barberq_last_shop when return path was lost. */
  fallbackShopPath?: string | null;
}): LiffCallbackAction {
  if (!isLiffOAuthCallback(input.search)) return { type: "stop" };
  if (input.guardAlreadySet) return { type: "stop" };

  const path =
    input.returnPath && input.returnPath !== "/"
      ? input.returnPath
      : input.fallbackShopPath && input.fallbackShopPath !== "/"
        ? input.fallbackShopPath
        : null;

  if (path) {
    const params = new URLSearchParams(
      input.search.startsWith("?") ? input.search.slice(1) : input.search,
    );
    const qs = params.toString();
    return { type: "forward", href: qs ? `${path}?${qs}` : path };
  }

  // Missing cookie/session/last-shop on `/`: stop without self-replace loop.
  return { type: "stop" };
}
