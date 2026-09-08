const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID?.trim() ?? "";

function appBase(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "";
}

export function buildShopWebUrl(slug: string): string {
  const path = `/${slug}`;
  const base = appBase();
  return base ? `${base}${path}` : path;
}

export function buildShopLiffUrl(slug: string): string | null {
  if (!LIFF_ID) return null;
  return `https://liff.line.me/${LIFF_ID}/${slug}`;
}
