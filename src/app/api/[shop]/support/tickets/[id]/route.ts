import { NextResponse } from "next/server";
import { assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { BookingError } from "@/lib/services/booking-service";
import { resolveShopParam } from "@/lib/shop/api-route";
import { getSupportTicketStore } from "@/lib/support/ticket-store";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string; id: string }> },
) {
  try {
    const { shop: shopSlug, id } = await params;
    const shop = await resolveShopParam(shopSlug);
    await assertStaffForShop(req, shop.id);
    const store = getSupportTicketStore();
    const ticket = await store.getTicket(id);
    if (!ticket || ticket.shop_id !== shop.id) {
      throw new BookingError("NOT_FOUND", "TICKET_NOT_FOUND", 404);
    }
    const replies = await store.listReplies(ticket.id);
    return NextResponse.json({ ticket, replies });
  } catch (error) {
    return jsonError(error);
  }
}
