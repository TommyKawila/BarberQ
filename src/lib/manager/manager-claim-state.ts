export type ManagerAuthPhase =
  | "initializing"
  | "needs_login"
  | "authenticated"
  | "init_failed";

export const LIFF_INIT_TIMEOUT_MS = 15_000;

export function resolveManagerAuthPhaseAfterLiffInit(input: {
  isLoggedIn: boolean;
  accessToken: string | null;
}): "needs_login" | "authenticated" {
  if (!input.isLoggedIn || !input.accessToken?.trim()) {
    return "needs_login";
  }
  return "authenticated";
}

export function shouldAutoClaimManager(input: {
  authPhase: ManagerAuthPhase;
  previewReady: boolean;
  claimed: boolean;
  claimAttempted: boolean;
}): boolean {
  if (input.claimAttempted || input.claimed) return false;
  if (input.authPhase !== "authenticated") return false;
  return input.previewReady;
}

export function shouldShowManagerLoginCta(input: {
  authPhase: ManagerAuthPhase;
  claiming: boolean;
}): boolean {
  return input.authPhase === "needs_login" && !input.claiming;
}

export function canStartManagerLineLogin(input: {
  authPhase: ManagerAuthPhase;
  inviteCode: string | null;
  mockMode: boolean;
}): boolean {
  if (input.mockMode || !input.inviteCode) return false;
  return input.authPhase === "needs_login";
}

export function buildManagerLiffLoginRedirectUri(input: {
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
  return `${httpsOrigin}/manager/join?invite=${invite}`;
}
