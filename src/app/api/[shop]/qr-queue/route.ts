import { NextResponse } from "next/server";
import { assertStaffForShop, isShopOperatorRole } from "@/lib/admin-auth";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { resolveShopParam } from "@/lib/shop/api-route";
import {
  joinQrQueue,
  listShopWaitingQueue,
} from "@/lib/queue/qr-queue-service";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Staff: list waiting QR queue. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    if (!isShopOperatorRole(staff.role) && staff.role !== "barber") {
      throw new BookingError("FORBIDDEN", "Forbidden", 403);
    }
    const entries = await listShopWaitingQueue(shop.id);
    return NextResponse.json(
      { entries },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}

/** Customer: join QR queue (LINE login required). */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const customer = await assertVerifiedCustomer(req);
    const body = await readJson<{
      preferredBarberId?: string | null;
      customerName?: string;
    }>(req);

    const name =
      (body.customerName ?? "").trim() ||
      customer.displayName?.trim() ||
      "ลูกค้า";

    const view = await joinQrQueue({
      shopId: shop.id,
      customerLineId: customer.userId,
      customerName: name,
      preferredBarberId: body.preferredBarberId ?? null,
    });
    return NextResponse.json(view, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
