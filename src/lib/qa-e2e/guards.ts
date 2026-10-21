import { readBarberqEnv } from "@/lib/founder-qa/env";
import { FOUNDER_QA_MANIFEST } from "@/lib/founder-qa/manifest";
import {
  QA_E2E_ALLOWED_SUPABASE_REF,
  extractSupabaseProjectRef,
  hostnameFromAppUrl,
  isAllowedQaHostname,
  isProductionHostname,
} from "@/lib/qa-e2e/allowlist";

export type QaE2eDisableReason =
  | "missing_secret"
  | "wrong_barberq_env"
  | "production_supabase"
  | "wrong_supabase"
  | "production_hostname"
  | "disallowed_hostname"
  | "ok";

/**
 * QA E2E session is enabled only when ALL are true:
 * - QA_E2E_SECRET is set (never set on Production Vercel)
 * - BARBERQ_ENV=founder_qa
 * - Supabase project ref is the live barberq-qa project
 * - NEXT_PUBLIC_APP_URL host is allowed QA (or unset); never production
 *
 * Production NODE_ENV alone is not enough — Vercel QA also uses production builds.
 */
export function evaluateQaE2eGuards(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): {
  enabled: boolean;
  reason: QaE2eDisableReason;
} {
  const secret = env.QA_E2E_SECRET?.trim();
  if (!secret) return { enabled: false, reason: "missing_secret" };

  if (readBarberqEnv(env as NodeJS.ProcessEnv) !== "founder_qa") {
    return { enabled: false, reason: "wrong_barberq_env" };
  }

  const ref = extractSupabaseProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);
  if (ref === FOUNDER_QA_MANIFEST.productionDenylist.supabaseProjectRef) {
    return { enabled: false, reason: "production_supabase" };
  }
  if (ref !== QA_E2E_ALLOWED_SUPABASE_REF) {
    return { enabled: false, reason: "wrong_supabase" };
  }

  const host = hostnameFromAppUrl(env.NEXT_PUBLIC_APP_URL);
  if (isProductionHostname(host)) {
    return { enabled: false, reason: "production_hostname" };
  }
  if (host && !isAllowedQaHostname(host)) {
    return { enabled: false, reason: "disallowed_hostname" };
  }

  return { enabled: true, reason: "ok" };
}

export function isQaE2eEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return evaluateQaE2eGuards(env).enabled;
}

export function getQaE2eSecret(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): string | null {
  if (!isQaE2eEnabled(env)) return null;
  return env.QA_E2E_SECRET?.trim() || null;
}

/** Hard-fail helper for request Host checks. */
export function assertRequestHostAllowed(hostname: string): void {
  const host = hostname.toLowerCase().split(":")[0] ?? hostname;
  if (isProductionHostname(host)) {
    throw new Error("QA E2E refused: production hostname");
  }
}
