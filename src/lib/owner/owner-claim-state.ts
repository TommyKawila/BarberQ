export type OwnerAuthPhase = "initializing" | "needs_login" | "authenticated" | "init_failed";

export const LIFF_INIT_TIMEOUT_MS = 15_000;

export function resolveOwnerAuthPhaseAfterLiffInit(input: {
  isLoggedIn: boolean;
  accessToken: string | null;
}): "needs_login" | "authenticated" {
  if (!input.isLoggedIn || !input.accessToken?.trim()) {
    return "needs_login";
  }
  return "authenticated";
}

export function shouldAutoClaimOwner(input: {
  authPhase: OwnerAuthPhase;
  previewReady: boolean;
  previewExpired: boolean;
  previewClaimed: boolean;
  claimed: boolean;
  claimAttempted: boolean;
}): boolean {
  if (input.claimAttempted || input.claimed) return false;
  if (input.authPhase !== "authenticated") return false;
  if (!input.previewReady || input.previewExpired || input.previewClaimed) return false;
  return true;
}

export function shouldShowOwnerLoginCta(input: {
  authPhase: OwnerAuthPhase;
  claiming: boolean;
}): boolean {
  return input.authPhase === "needs_login" && !input.claiming;
}

export function canStartOwnerLineLogin(input: {
  authPhase: OwnerAuthPhase;
  inviteCode: string | null;
  mockMode: boolean;
}): boolean {
  if (input.mockMode || !input.inviteCode) return false;
  return input.authPhase === "needs_login";
}

export function buildOwnerLiffLoginRedirectUri(input: {
  pageOrigin: string;
  appUrl: string | undefined;
  inviteCode: string;
}): string {
  const invite = encodeURIComponent(input.inviteCode.trim());
  const app = input.appUrl?.replace(/\/$/, "") ?? "";
  let origin = input.pageOrigin.replace(/\/$/, "");
  try {
    origin = new URL(input.pageOrigin).origin;
  } catch {
    /* keep origin */
  }
  const httpsOrigin = origin.startsWith("https://")
    ? origin
    : app.startsWith("https://")
      ? app
      : origin;
  return `${httpsOrigin}/owner/join?invite=${invite}`;
}
