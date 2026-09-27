import { FOUNDER_QA_MANIFEST, type FounderQaManifest } from "@/lib/founder-qa/manifest";
import type { ObservedTarget, QaCheck, QaGuardResult } from "@/lib/founder-qa/types";

function check(id: string, pass: boolean, message: string): QaCheck {
  return { id, pass, message };
}

export function isPhinxIdentity(shop: {
  id?: string | null;
  name?: string | null;
  slug?: string | null;
}, manifest: FounderQaManifest = FOUNDER_QA_MANIFEST): boolean {
  const phinx = manifest.phinx;
  return (
    shop.id === phinx.id ||
    shop.slug?.toLowerCase() === phinx.slug ||
    shop.name?.trim() === phinx.name
  );
}

export function evaluateGuards(
  observed: ObservedTarget,
  extraArgs: string[] = observed.extraArgs,
  manifest: FounderQaManifest = FOUNDER_QA_MANIFEST,
): QaGuardResult {
  const shop = observed.shop;
  const checks: QaCheck[] = [
    check(
      "env",
      observed.barberqEnv === "founder_qa",
      observed.barberqEnv === "founder_qa"
        ? "BARBERQ_ENV is founder_qa"
        : `BARBERQ_ENV is ${observed.barberqEnv}, expected founder_qa`,
    ),
    check(
      "qa-project",
      observed.supabaseProjectRef === manifest.qaSupabaseProjectRef,
      observed.supabaseProjectRef === manifest.qaSupabaseProjectRef
        ? "Supabase project matches checked-in QA identity"
        : "Supabase project does not match checked-in QA identity",
    ),
    check(
      "not-production-project",
      observed.supabaseProjectRef !== manifest.productionDenylist.supabaseProjectRef,
      observed.supabaseProjectRef === manifest.productionDenylist.supabaseProjectRef
        ? "Target matches known Production Supabase project"
        : "Target is not the known Production Supabase project",
    ),
    check(
      "qa-hostname",
      observed.appHostname === manifest.qaAppHostname,
      observed.appHostname === manifest.qaAppHostname
        ? "App hostname matches approved QA hostname"
        : "App hostname does not match approved QA hostname",
    ),
    check(
      "not-production-hostname",
      observed.appHostname !== manifest.productionDenylist.appHostname,
      observed.appHostname === manifest.productionDenylist.appHostname
        ? "Target matches Production hostname"
        : "Target is not the Production hostname",
    ),
    check(
      "canonical-shop",
      Boolean(
        shop &&
          shop.id === manifest.shop.id &&
          shop.slug === manifest.shop.slug &&
          shop.name === manifest.shop.name,
      ),
      shop &&
        shop.id === manifest.shop.id &&
        shop.slug === manifest.shop.slug &&
        shop.name === manifest.shop.name
        ? "Canonical QA tenant identity matches"
        : "Canonical QA tenant UUID/name/slug mismatch or missing",
    ),
    check(
      "not-phinx",
      !isPhinxIdentity(shop ?? {}) &&
        observed.supabaseProjectRef !== manifest.productionDenylist.supabaseProjectRef,
      isPhinxIdentity(shop ?? {})
        ? "Target identifies PHINX / phinxstudio"
        : "Target is not PHINX",
    ),
    check(
      "no-arbitrary-target",
      extraArgs.length === 0,
      extraArgs.length === 0
        ? "No arbitrary tenant/target arguments"
        : "Arbitrary target arguments are not allowed",
    ),
  ];

  return { ok: checks.every((c) => c.pass), mutated: false, checks };
}
