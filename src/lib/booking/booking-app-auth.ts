/**
 * Auth / success gate phases for the customer BookingApp.
 * Never show the LINE login CTA while LIFF is still resolving, during submit,
 * or once a booking has already committed (success UI).
 */
export type BookingAppAuthPhase =
  | "auth-loading"
  | "login"
  | "success"
  | "content";

export function bookingAppAuthPhase(input: {
  ready: boolean;
  hasProfile: boolean;
  mockMode: boolean;
  /** Booking row committed — prefer success over any auth gate. */
  hasSuccess: boolean;
  /** In-flight submit — never flash login if profile blips. */
  submitting?: boolean;
}): BookingAppAuthPhase {
  if (input.hasSuccess) return "success";
  if (!input.ready) return "auth-loading";
  if (input.submitting && !input.hasProfile) return "auth-loading";
  if (!input.hasProfile && !input.mockMode) return "login";
  if (!input.hasProfile) return "auth-loading";
  return "content";
}
