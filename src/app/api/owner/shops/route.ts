import { NextResponse } from "next/server";
import {
  getBearerToken,
  isLineAuthMockMode,
  MOCK_OWNER_LINE_ID,
  verifyLineAccessToken,
} from "@/lib/auth/line-verify";
import { listOwnerShopsForLineId } from "@/lib/owner/owner-shops";
import { jsonError } from "@/lib/api-response";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    const token = getBearerToken(req);
    if (!token) {
      throw new BookingError("UNAUTHORIZED", "Missing authorization", 401);
    }

    const lineUser = await verifyLineAccessToken(token);
    if (!lineUser) {
      if (isLineAuthMockMode() && token === MOCK_OWNER_LINE_ID) {
        const shops = await listOwnerShopsForLineId(MOCK_OWNER_LINE_ID);
        return NextResponse.json({ shops });
      }
      throw new BookingError("UNAUTHORIZED", "Invalid LINE token", 401);
    }

    const shops = await listOwnerShopsForLineId(lineUser.userId);
    return NextResponse.json({ shops });
  } catch (error) {
    return jsonError(error);
  }
}
