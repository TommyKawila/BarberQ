/**
 * Resolve LIFF secondary redirect / path (`liff.state` or appended path)
 * when Endpoint URL already includes the shop slug
 * (e.g. https://…/barberqpilottest + liff.line.me/{id}/bookings).
 */

const RESERVED_FIRST_SEGMENTS = new Set([
  "admin",
  "bookings",
  "guide",
  "trial",
  "pilot",
  "open",
  "owner",
  "manager",
  "superadmin",
  "api",
  "c",
  "_next",
  "favicon.ico",
]);

export function shopSlugFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/([^/]+)/);
  if (!match) return null;
  const seg = match[1] ?? "";
  if (!seg || RESERVED_FIRST_SEGMENTS.has(seg)) return null;
  return seg;
}

export function normalizeLiffStatePath(liffState: string): string {
  const trimmed = liffState.trim();
  if (!trimmed || trimmed === "/") return "/";
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  // Collapse trailing slashes except root
  return withSlash.replace(/\/+$/, "") || "/";
}

/**
 * Map liff.state onto the correct app path.
 * When already on /{shop} (LIFF endpoint includes shop), relative states like
 * "bookings" or "/bookings" become /{shop}/bookings — not bare /bookings.
 */
export function resolveLiffStateTarget(currentPath: string, liffState: string): string {
  const state = normalizeLiffStatePath(liffState);
  const shop = shopSlugFromPath(currentPath);

  if (shop) {
    if (state === `/${shop}` || state.startsWith(`/${shop}/`)) {
      return state;
    }
    if (state === "/") return `/${shop}`;
    return `/${shop}${state}`;
  }

  return state;
}

/** Bare /bookings (and /admin) need a shop — prefer last-visited, else default. */
export function resolveBareShopPath(
  barePath: string,
  lastShopSlug: string | null | undefined,
  defaultShop: string,
): string {
  const normalized = normalizeLiffStatePath(barePath);
  const shop =
    lastShopSlug && !RESERVED_FIRST_SEGMENTS.has(lastShopSlug)
      ? lastShopSlug
      : defaultShop;
  if (normalized === "/") return `/${shop}`;
  return `/${shop}${normalized}`;
}
