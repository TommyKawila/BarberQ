/**
 * Prod ClipperQ LIFF endpoint (LINE Developers).
 * Used as fallback for customer message links when NEXT_PUBLIC_LIFF_ID is
 * unset but NEXT_PUBLIC_APP_URL points at production — so confirm/reminder
 * Flex never send plain barber-q-pi.vercel.app/…/bookings (opens logged-out).
 */
export const CLIPPERQ_PROD_LIFF_ID = "2011489694-gV1vPUNC";

const PROD_APP_HOSTS = new Set([
  "barber-q-pi.vercel.app",
  "barber-q.vercel.app",
  "www.barber-q.vercel.app",
]);

function hostnameFromAppUrl(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/**
 * LIFF id for customer deep links in LINE messages.
 * Prefer env; on production app hosts fall back to known prod LIFF.
 */
export function resolveCustomerLiffId(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string {
  const fromEnv = env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
  if (fromEnv) return fromEnv;
  const host = hostnameFromAppUrl(env.NEXT_PUBLIC_APP_URL);
  if (host && PROD_APP_HOSTS.has(host)) return CLIPPERQ_PROD_LIFF_ID;
  return "";
}

function liffId(): string {
  return resolveCustomerLiffId();
}

function appBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
}

function normalizeSuffix(pathSuffix = ""): string {
  if (!pathSuffix) return "";
  return pathSuffix.startsWith("/") ? pathSuffix : `/${pathSuffix}`;
}

export function buildShopWebUrl(slug: string, pathSuffix = ""): string {
  const path = `/${slug}${normalizeSuffix(pathSuffix)}`;
  const base = appBase();
  return base ? `${base}${path}` : path;
}

export function buildShopLiffUrl(slug: string, pathSuffix = ""): string | null {
  const id = liffId();
  if (!id) return null;
  return `https://liff.line.me/${id}/${slug}${normalizeSuffix(pathSuffix)}`;
}

/**
 * Customer-facing URIs inside LINE Flex / push messages.
 * Prefer LIFF so taps stay in LINE (logged in); fall back to web only when
 * LIFF id cannot be resolved (non-prod without env).
 */
export function buildShopCustomerUrl(slug: string, pathSuffix = ""): string {
  return buildShopLiffUrl(slug, pathSuffix) ?? buildShopWebUrl(slug, pathSuffix);
}

/** My Bookings destination used by confirm + reminder Flex CTAs. */
export function buildShopBookingsCustomerUrl(slug: string): string {
  return buildShopCustomerUrl(slug, "/bookings");
}

/**
 * Cancel / reschedule page is global `src/app/(app)/c/[token]` → `/c/{token}`.
 * Do NOT nest under `/{shop}` — that path 404s.
 */
export function buildCustomerCancelUrl(cancelToken: string): string {
  const token = cancelToken.trim().replace(/^\/+/, "");
  const path = `/c/${token}`;
  const id = liffId();
  if (id) return `https://liff.line.me/${id}${path}`;
  const base = appBase();
  return base ? `${base}${path}` : path;
}
