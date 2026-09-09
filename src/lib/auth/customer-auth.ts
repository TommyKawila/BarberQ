import { BookingError } from "@/lib/services/booking-service";
import {
  getBearerToken,
  isLineAuthMockMode,
  verifyLineAccessToken,
  type VerifiedLineUser,
} from "@/lib/auth/line-verify";

export async function assertVerifiedCustomer(req: Request): Promise<VerifiedLineUser> {
  const token = getBearerToken(req);
  if (!token) {
    if (isLineAuthMockMode()) {
      throw new BookingError("UNAUTHORIZED", "Missing authorization", 401);
    }
    throw new BookingError("UNAUTHORIZED", "Missing authorization", 401);
  }

  const user = await verifyLineAccessToken(token);
  if (!user) {
    throw new BookingError("UNAUTHORIZED", "Invalid LINE session", 401);
  }
  return user;
}
