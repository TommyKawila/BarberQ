/**
 * Shop-facing billing UI/API gate (phase 6).
 * On only when NEXT_PUBLIC_ENABLE_BILLING is exactly "true".
 * Unset or any other value → off (default).
 *
 * Literal `process.env.NEXT_PUBLIC_*` is required so Next.js inlines the
 * value into client bundles (AdminChrome is "use client").
 */
const BILLING_FLAG = process.env.NEXT_PUBLIC_ENABLE_BILLING;

export function isBillingEnabled(
  value: string | undefined = BILLING_FLAG,
): boolean {
  return value === "true";
}
