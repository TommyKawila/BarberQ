import { NextResponse } from "next/server";
import { assertStaffForShop, isShopOperatorRole } from "@/lib/admin-auth";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { resolveShopParam } from "@/lib/shop/api-route";
import {
  cancelQrQueueEntry,
  markQrQueueLeft,
  startQrQueueEntry,
} from "@/lib/queue/qr-queue-service";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Action = "cancel" | "start" | "left";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ shop: string; id: string }> },
) {
  try {
    const { shop: shopSlug, id } = await params;
    const shop = await resolveShopParam(shopSlug);
    const body = await readJson<{
      action?: Action;
      endTime?: string;
      allowShorten?: boolean;
    }>(req);
    const action = body.action;
    if (action !== "cancel" && action !== "start" && action !== "left") {
      throw new BookingError("INVALID_ACTION", "Invalid action", 400);
    }

    if (action === "cancel") {
      // Prefer staff cancel when the LINE user is staff; else customer cancel.
      try {
        const staff = await assertStaffForShop(req, shop.id);
        if (isShopOperatorRole(staff.role) || staff.role === "barber") {
          const entry = await cancelQrQueueEntry(shop.id, id, { asStaff: true });
          return NextResponse.json({ entry });
        }
      } catch {
        /* fall through to customer */
      }
      const customer = await assertVerifiedCustomer(req);
      const entry = await cancelQrQueueEntry(shop.id, id, {
        byCustomerLineId: customer.userId,
      });
      return NextResponse.json({ entry });
    }

    const staff = await assertStaffForShop(req, shop.id);
    if (!isShopOperatorRole(staff.role) && staff.role !== "barber") {
      throw new BookingError("FORBIDDEN", "Forbidden", 403);
    }

    if (action === "left") {
      const entry = await markQrQueueLeft(shop.id, id);
      return NextResponse.json({ entry });
    }

    try {
      const result = await startQrQueueEntry(shop.id, id, staff, {
        endTime: body.endTime,
        allowShorten: body.allowShorten,
      });
      return NextResponse.json(result);
    } catch (error) {
      if (
        error instanceof BookingError &&
        error.code === "SLOT_TAKEN" &&
        (error as BookingError & { canShortenUntil?: string }).canShortenUntil
      ) {
        const until = (error as BookingError & { canShortenUntil?: string })
          .canShortenUntil!;
        return NextResponse.json(
          {
            error: {
              code: "SLOT_TAKEN",
              message: error.message,
              canShortenUntil: until,
              nextConflictAt: until,
            },
          },
          { status: 409 },
        );
      }
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
