function liffId(): string {
  return process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";
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
 * Prefer LIFF so taps stay in LINE; fall back to web when LIFF id unset.
 */
export function buildShopCustomerUrl(slug: string, pathSuffix = ""): string {
  return buildShopLiffUrl(slug, pathSuffix) ?? buildShopWebUrl(slug, pathSuffix);
}
