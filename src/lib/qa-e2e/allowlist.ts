import { FOUNDER_QA_MANIFEST } from "@/lib/founder-qa/manifest";

/** Live barberq-qa Supabase project ref (not a secret). */
export const QA_E2E_ALLOWED_SUPABASE_REF = "lzvhoozwvnxxqdxhqspw";

/** Approved QA app hostnames for E2E (not secrets). */
export const QA_E2E_ALLOWED_HOSTNAMES = [
  "barberq-qa.vercel.app",
  "localhost",
  "127.0.0.1",
] as const;

/** Production hosts — crawl + E2E must hard-fail on these. */
export const QA_E2E_PRODUCTION_HOSTNAMES = [
  FOUNDER_QA_MANIFEST.productionDenylist.appHostname,
  "barber-q.vercel.app",
  "www.barber-q.vercel.app",
  "barber-q-pi.vercel.app",
] as const;

export const QA_E2E_FIXTURE_SHOP_SLUG = FOUNDER_QA_MANIFEST.shop.slug;

export const QA_E2E_COOKIE = "barberq_qa_e2e";
export const QA_E2E_CLIENT_STORAGE_KEY = "barberq_qa_e2e_token";
export const QA_E2E_TOKEN_PREFIX = "qa-e2e.v1.";

export type QaE2eClientSession = {
  token: string;
  lineUserId: string;
  shopSlug: string;
  role: "owner" | "barber" | "manager";
};

export function extractSupabaseProjectRef(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    const m = /^([a-z0-9-]+)\.supabase\.co$/.exec(host);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

export function hostnameFromAppUrl(url: string | undefined): string | null {
  if (!url?.trim()) return null;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isProductionHostname(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  return (QA_E2E_PRODUCTION_HOSTNAMES as readonly string[]).includes(host);
}

export function isAllowedQaHostname(hostname: string | null | undefined): boolean {
  if (!hostname) return false;
  const host = hostname.toLowerCase();
  if (isProductionHostname(host)) return false;
  return (QA_E2E_ALLOWED_HOSTNAMES as readonly string[]).includes(host);
}
