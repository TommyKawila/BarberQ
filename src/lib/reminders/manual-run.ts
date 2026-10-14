import { readBarberqEnv, type BarberqEnv } from "@/lib/founder-qa/env";

/**
 * Manual "run due reminders now" is for owner QA on Hobby (daily cron only).
 * Owners always allowed; other roles only outside production.
 */
export function canManuallyRunReminders(
  role: string,
  env: BarberqEnv | "missing" | "unknown" = readBarberqEnv(),
): boolean {
  if (role === "owner") return true;
  return env !== "production";
}
