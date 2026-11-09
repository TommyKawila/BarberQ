/**
 * Shop-facing billing UI/API gate (phase 6).
 * On only when NEXT_PUBLIC_ENABLE_BILLING is exactly "true".
 * Unset or any other value → off (default).
 */
export function isBillingEnabled(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): boolean {
  return env.NEXT_PUBLIC_ENABLE_BILLING === "true";
}
