/**
 * Auth / shop-list phases for /owner (OwnerEntry).
 * Shop list loading must never block the LINE login CTA when there is no session.
 */
export type OwnerEntryPhase =
  | "auth-loading"
  | "login"
  | "shops-loading"
  | "empty"
  | "pick"
  | "redirecting"
  | "error";

/** If in-client LIFF auto-login never returns, unblock UI for a tap CTA. */
export const OWNER_LIFF_LOGIN_HANDOFF_TIMEOUT_MS = 8_000;

/** Cap LIFF init so /owner never spins forever on a hung SDK. */
export const OWNER_LIFF_INIT_TIMEOUT_MS = 15_000;

export function ownerEntryPhase(input: {
  ready: boolean;
  loggedIn: boolean;
  mockMode: boolean;
  shopsLoading: boolean;
  shopCount: number | null;
  error: string | null;
  redirecting: boolean;
}): OwnerEntryPhase {
  if (input.error) return "error";
  if (!input.ready) return "auth-loading";
  if (!input.loggedIn && !input.mockMode) return "login";
  if (input.redirecting) return "redirecting";
  if (input.shopsLoading || input.shopCount === null) return "shops-loading";
  if (input.shopCount === 0) return "empty";
  if (input.shopCount === 1) return "redirecting";
  return "pick";
}
