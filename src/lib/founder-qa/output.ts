import { looksLikeSecret } from "@/lib/founder-qa/parse";
import type { QaCheck } from "@/lib/founder-qa/types";

export function assertSecretSafe(text: string): void {
  if (looksLikeSecret(text)) {
    throw new Error("Refusing to print a secret-like value");
  }
}

export function formatChecks(checks: QaCheck[]): string {
  return checks
    .map((c) => `${c.pass ? "PASS" : "FAIL"} ${c.id}: ${c.message}`)
    .join("\n");
}

export function formatVerifySuccess(checks: QaCheck[]): string {
  const fixture = checks.find((c) => c.id === "fixture-version");
  return [
    "Founder QA verification: PASS",
    "Environment: founder_qa",
    "Target shop: BarberQ Pilot Test (barberqpilottest)",
    `Fixture baseline: ${fixture?.pass ? "compatible" : "incompatible"}`,
  ].join("\n");
}

export function formatVerifyFailure(checks: QaCheck[]): string {
  const failed = checks.filter((c) => !c.pass).map((c) => c.id);
  return [
    "Founder QA verification: FAIL",
    "Founder QA environment: NOT READY",
    `Failed checks: ${failed.join(", ") || "unknown"}`,
    "No data was changed.",
  ].join("\n");
}

export function printSafe(text: string, write: (s: string) => void = console.log): void {
  assertSecretSafe(text);
  write(text);
}
