/**
 * Pure helpers for customer LINE session gating (testable without LIFF SDK).
 */

/** Booking API requires a Bearer LINE access token — profile alone is not enough. */
export function hasLineAccessToken(token: string | null | undefined): boolean {
  return Boolean(token?.trim());
}

/**
 * Outside a real LIFF session, `getProfile()` can still succeed from a stale
 * cookie while `getAccessToken()` is empty — submit then fails as UNAUTHORIZED
 * or INTERNAL. Treat missing token as logged out so the UI shows login.
 */
export function canUseCustomerBookingSession(input: {
  mockMode: boolean;
  loggedIn: boolean;
  accessToken: string | null | undefined;
}): boolean {
  if (input.mockMode) return true;
  if (!input.loggedIn) return false;
  return hasLineAccessToken(input.accessToken);
}
