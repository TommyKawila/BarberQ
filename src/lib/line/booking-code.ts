/** Short booking code for LIFF → webhook reply path (e.g. A12F3B). */
export function bookingShortCode(appointmentId: string): string {
  const hex = appointmentId.replace(/-/g, "").toUpperCase();
  return hex.slice(0, 6) || "XXXXXX";
}

export function bookingConfirmTriggerText(appointmentId: string): string {
  return `จอง #${bookingShortCode(appointmentId)}`;
}

export function parseBookingCodeFromText(text: string): string | null {
  const match = text.trim().match(/(?:จอง\s*)?#([A-Za-z0-9]{4,12})/);
  return match?.[1]?.toUpperCase() ?? null;
}

export function appointmentMatchesCode(appointmentId: string, code: string): boolean {
  return bookingShortCode(appointmentId) === code.toUpperCase();
}
