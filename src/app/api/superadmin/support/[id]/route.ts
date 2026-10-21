import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { BookingError } from "@/lib/services/booking-service";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";
import { getSupportTicketStore } from "@/lib/support/ticket-store";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const { id } = await params;
    const store = getSupportTicketStore();
    const ticket = await store.getTicket(id);
    if (!ticket) throw new BookingError("NOT_FOUND", "TICKET_NOT_FOUND", 404);
    const replies = await store.listReplies(id);
    const shops = await getStore().listShops();
    const shop = shops.find((s) => s.id === ticket.shop_id);
    return NextResponse.json({
      ticket: {
        ...ticket,
        shopName: shop?.name ?? ticket.shop_id,
        shopSlug: shop?.slug ?? null,
      },
      replies,
    });
  } catch (error) {
    return jsonError(error);
  }
}
