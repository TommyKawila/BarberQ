import { evaluateGuards } from "@/lib/founder-qa/guards";
import { observeFounderQa } from "@/lib/founder-qa/observe";
import {
  formatVerifyFailure,
  formatVerifySuccess,
  printSafe,
} from "@/lib/founder-qa/output";
import { evaluateVerify } from "@/lib/founder-qa/verify";

export const RESET_BANNER = [
  "Founder QA reset",
  "Target: BarberQ Pilot Test (barberqpilottest)",
  "Scope: QA fixture data for this tenant only",
  "Production and PHINX are not targets",
  "Preserves: Founder Owner relationship and isolation sentinel",
].join("\n");

export const OWNER_CLAIM_BANNER = [
  "Founder QA Owner-claim reset",
  "This is not the normal daily reset.",
  "",
  "Target: BarberQ Pilot Test (barberqpilottest)",
  "Resulting state: no active Founder Owner relationship",
  "Next step: complete real Owner claim using Founder Owner LINE",
  "Production and PHINX are not targets",
].join("\n");

export function extraArgs(argv: string[]): string[] {
  return argv.filter(
    (arg) =>
      arg.startsWith("--") ||
      arg.includes("shop") ||
      arg.includes("supabase") ||
      arg.includes("postgres") ||
      arg.includes("="),
  );
}

export async function runQaVerify(argv: string[]): Promise<number> {
  const observed = await observeFounderQa({ extraArgs: extraArgs(argv) });
  const result = evaluateVerify(observed);
  if (result.ok) {
    printSafe(formatVerifySuccess(result.checks));
    return 0;
  }
  printSafe(formatVerifyFailure(result.checks));
  return 1;
}

export async function runQaReset(argv: string[]): Promise<number> {
  const { runDailyReset } = await import("@/lib/founder-qa/reset");
  printSafe(RESET_BANNER);
  const observed = await observeFounderQa({ extraArgs: extraArgs(argv) });
  const guards = evaluateGuards(observed);
  if (!guards.ok) {
    printSafe(
      [
        "Founder QA reset: refused",
        "No data was changed.",
        `Failed checks: ${guards.checks.filter((c) => !c.pass).map((c) => c.id).join(", ")}`,
      ].join("\n"),
    );
    return 1;
  }
  return runDailyReset(observed);
}

export async function runQaOwnerClaimReset(argv: string[]): Promise<number> {
  const { runOwnerClaimReset } = await import("@/lib/founder-qa/reset");
  printSafe(OWNER_CLAIM_BANNER);
  const observed = await observeFounderQa({ extraArgs: extraArgs(argv) });
  const guards = evaluateGuards(observed);
  if (!guards.ok) {
    printSafe(
      [
        "Founder QA Owner-claim reset: refused",
        "No data was changed.",
        `Failed checks: ${guards.checks.filter((c) => !c.pass).map((c) => c.id).join(", ")}`,
      ].join("\n"),
    );
    return 1;
  }
  return runOwnerClaimReset(observed);
}

export async function main(argv: string[]): Promise<number> {
  const command = argv[0];
  if (command === "verify") return runQaVerify(argv.slice(1));
  if (command === "reset") return runQaReset(argv.slice(1));
  if (command === "reset-owner-claim") return runQaOwnerClaimReset(argv.slice(1));
  printSafe(
    "Usage: npm run qa:verify | npm run qa:reset | npm run qa:reset:owner-claim",
  );
  return 1;
}

const invoked = process.argv[1]?.includes("founder-qa/cli");
if (invoked) {
  main(process.argv.slice(2)).then(
    (code) => process.exit(code),
    () => {
      printSafe("Founder QA environment: NOT READY");
      process.exit(1);
    },
  );
}
