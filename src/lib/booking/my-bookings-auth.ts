/**
 * Auth / list loading phases for customer My Bookings.
 * List loading must never block the LINE login CTA when there is no profile.
 */
export type MyBookingsAuthPhase =
  | "auth-loading"
  | "login"
  | "list-loading"
  | "content";

export function myBookingsAuthPhase(input: {
  ready: boolean;
  hasProfile: boolean;
  mockMode: boolean;
  listLoading: boolean;
}): MyBookingsAuthPhase {
  if (!input.ready) return "auth-loading";
  if (!input.hasProfile && !input.mockMode) return "login";
  if (!input.hasProfile) return "auth-loading";
  if (input.listLoading) return "list-loading";
  return "content";
}
