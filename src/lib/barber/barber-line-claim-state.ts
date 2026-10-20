import { buildLiffLoginRedirectUri } from "@/lib/line/liff-return";

export type BarberLineAuthPhase =
  | "initializing"
  | "needs_login"
  | "authenticated"
  | "init_failed";

export const LIFF_INIT_TIMEOUT_MS = 15_000;

export function resolveBarberLineAuthPhaseAfterLiffInit(input: {
  isLoggedIn: boolean;
  accessToken: string | null;
}): "needs_login" | "authenticated" {
  if (!input.isLoggedIn || !input.accessToken?.trim()) {
    return "needs_login";
  }
  return "authenticated";
}

export function shouldAutoClaimBarberLine(input: {
  authPhase: BarberLineAuthPhase;
  previewReady: boolean;
  claimed: boolean;
  claimAttempted: boolean;
}): boolean {
  if (input.claimAttempted || input.claimed) return false;
  if (input.authPhase !== "authenticated") return false;
  return input.previewReady;
}

export function shouldShowBarberLineLoginCta(input: {
  authPhase: BarberLineAuthPhase;
  claiming: boolean;
}): boolean {
  return input.authPhase === "needs_login" && !input.claiming;
}

export function canStartBarberLineLogin(input: {
  authPhase: BarberLineAuthPhase;
  inviteCode: string | null;
  mockMode: boolean;
}): boolean {
  if (input.mockMode || !input.inviteCode) return false;
  return input.authPhase === "needs_login";
}

/**
 * Registered LIFF callback = site origin (same as admin login).
 * Invite token is carried in cookie/session, not in redirect_uri.
 */
export function buildBarberLineLiffLoginRedirectUri(input: {
  pageOrigin: string;
  appUrl?: string | undefined;
  inviteCode?: string;
}): string {
  void input.appUrl;
  void input.inviteCode;
  return buildLiffLoginRedirectUri(input.pageOrigin);
}
