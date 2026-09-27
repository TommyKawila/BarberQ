import { hoursMatch, ordinaryBarberFixtures } from "@/lib/founder-qa/fixtures";
import { evaluateGuards } from "@/lib/founder-qa/guards";
import { FOUNDER_QA_MANIFEST, type FounderQaManifest } from "@/lib/founder-qa/manifest";
import type { ObservedTarget, QaCheck, QaVerifyResult } from "@/lib/founder-qa/types";

function check(id: string, pass: boolean, message: string): QaCheck {
  return { id, pass, message };
}

export function evaluateVerify(
  observed: ObservedTarget,
  manifest: FounderQaManifest = FOUNDER_QA_MANIFEST,
  mode: "daily" | "owner-claim" = "daily",
): QaVerifyResult {
  const guards = evaluateGuards(observed, observed.extraArgs, manifest);
  const expectedBarbers = ordinaryBarberFixtures();
  const qaBarbers = observed.barbers.filter((b) => b.shopId === manifest.shop.id);
  const owner = qaBarbers.filter((b) => b.role === "owner");
  const ordinary = expectedBarbers.map((fixture) =>
    qaBarbers.find((b) => b.id === fixture.id && b.name === fixture.name),
  );
  const ordinaryOk = ordinary.every(
    (b) =>
      b &&
      b.role === "barber" &&
      b.isActive &&
      b.isBookable &&
      !b.lineLinked,
  );
  const sentinelOk = Boolean(
    observed.sentinel &&
      observed.sentinel.id === manifest.sentinel.id &&
      observed.sentinel.slug === manifest.sentinel.slug &&
      observed.sentinel.name === manifest.sentinel.name,
  );

  const checks: QaCheck[] = [
    ...guards.checks,
    check(
      "canonical-exists",
      Boolean(observed.shop),
      observed.shop ? "Canonical QA tenant exists" : "Canonical QA tenant is missing",
    ),
    check(
      "shop-status",
      mode === "owner-claim"
        ? observed.shop?.status === "pending"
        : observed.shop?.status === "active",
      mode === "owner-claim"
        ? observed.shop?.status === "pending"
          ? "Shop is pending for Owner claim"
          : "Shop is not in pending Owner-claim state"
        : observed.shop?.status === "active"
          ? "Canonical shop is active"
          : "Canonical shop is not active",
    ),
    check(
      "sentinel",
      sentinelOk,
      sentinelOk
        ? "Isolation sentinel exists with expected identity"
        : "Isolation sentinel missing or identity mismatch",
    ),
    check(
      "manager-schema",
      observed.managerSchemaPresent,
      observed.managerSchemaPresent
        ? "Manager schema is present"
        : "Manager schema / migration 0025 is missing",
    ),
    check(
      "fixture-version",
      ordinaryOk && sentinelOk && hoursMatch(observed.hours),
      ordinaryOk && sentinelOk && hoursMatch(observed.hours)
        ? `Fixture baseline ${manifest.fixtureVersion} compatible`
        : `Fixture baseline ${manifest.fixtureVersion} incompatible`,
    ),
    check(
      "owner-baseline",
      mode === "owner-claim"
        ? owner.length === 0 || owner.every((b) => !b.lineLinked)
        : owner.length === 1 && owner[0].lineLinked && owner[0].isActive,
      mode === "owner-claim"
        ? owner.every((b) => !b.lineLinked)
          ? "Owner-claim baseline has no active Owner relationship"
          : "Owner-claim baseline still has a linked Owner"
        : owner.length === 1 && owner[0].lineLinked
          ? "Founder Owner baseline is present"
          : "Expected single linked Founder Owner is missing",
    ),
    check(
      "ordinary-barbers",
      ordinaryOk,
      ordinaryOk
        ? "Johnny / Peter / Jack fixtures are valid"
        : "Johnny / Peter / Jack fixtures are missing or unexpected",
    ),
    check(
      "no-active-manager",
      observed.activeManagerCount === 0,
      observed.activeManagerCount === 0
        ? "No unexpected active Manager"
        : "Unexpected active Manager in daily baseline",
    ),
    check(
      "no-stale-invite",
      observed.pendingInviteCount === 0,
      observed.pendingInviteCount === 0
        ? "No stale Manager invite"
        : "Stale pending Manager invite present",
    ),
    check(
      "appointments-clean",
      observed.appointmentCount === 0,
      observed.appointmentCount === 0
        ? "Appointment baseline is clean"
        : "Appointments remain on the QA tenant",
    ),
    check(
      "hours",
      hoursMatch(observed.hours),
      hoursMatch(observed.hours)
        ? "Expected QA shop hours exist"
        : "QA shop hours/settings mismatch",
    ),
    check(
      "supabase-connectivity",
      observed.supabaseConnected,
      observed.supabaseConnected
        ? "Supabase service connectivity works"
        : "Supabase service connectivity failed",
    ),
    check(
      "liff",
      observed.liffConfigured,
      observed.liffConfigured
        ? "Dedicated LINE/LIFF QA configuration exists"
        : "LINE/LIFF QA configuration is missing",
    ),
    check(
      "not-memory",
      !observed.usingMemoryStore,
      observed.usingMemoryStore
        ? "Application is using memory store"
        : "Application is not using memory store",
    ),
    check(
      "not-line-mock",
      !observed.usingLineMock,
      observed.usingLineMock
        ? "Application is using LINE mock auth"
        : "Application is not using LINE mock auth",
    ),
  ];

  return { ok: checks.every((c) => c.pass), checks };
}
