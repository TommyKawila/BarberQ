import { timingSafeEqual } from "crypto";
import { getOptionalEnv } from "@/lib/env";
import { BookingError } from "@/lib/services/booking-service";

export function assertAdmin(req: Request): void {
  const expected = getOptionalEnv("ADMIN_SECRET_KEY");
  if (!expected) return;

  const provided = req.headers.get("x-admin-key") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  const match = a.length === b.length && timingSafeEqual(a, b);
  if (!match) {
    throw new BookingError("UNAUTHORIZED", "Invalid admin key", 401);
  }
}
