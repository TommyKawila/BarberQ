import { readBarberqEnv } from "@/lib/founder-qa/env";
import {
  hostnameFromAppUrl,
  isProductionHostname,
} from "@/lib/qa-e2e/allowlist";

/**
 * Capture/review routes under `/preview/*` (hero booking + booking-success).
 *
 * Default:
 * - enabled on local (`BARBERQ_ENV=local` or non-production NODE_ENV)
 * - enabled on founder QA (`BARBERQ_ENV=founder_qa`)
 * - disabled when `BARBERQ_ENV=production` or NEXT_PUBLIC_APP_URL is a production host
 *
 * Override with `ENABLE_PREVIEW_ROUTES=true|false` (explicit wins).
 * The sales hero uses static `/sale/hero-screens/*` images and does not call these routes.
 */
export function arePreviewRoutesEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  const flag = env.ENABLE_PREVIEW_ROUTES?.trim().toLowerCase();
  if (flag === "true" || flag === "1") return true;
  if (flag === "false" || flag === "0") return false;

  if (isProductionHostname(hostnameFromAppUrl(env.NEXT_PUBLIC_APP_URL))) {
    return false;
  }

  const barberqEnv = readBarberqEnv(env as NodeJS.ProcessEnv);
  if (barberqEnv === "production") return false;
  if (barberqEnv === "local" || barberqEnv === "founder_qa") return true;

  // next dev / unit tests without BARBERQ_ENV
  if (env.NODE_ENV !== "production") return true;

  return false;
}
