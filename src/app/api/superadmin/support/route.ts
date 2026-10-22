import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { BookingError } from "@/lib/services/booking-service";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";
import {
  notifyOwnerTicketReply,
  notifyOwnerTicketStatus,
} from "@/lib/support/operator-notify";
import { resolveOwnerLineUserId } from "@/lib/support/owner-line";
import { getSupportTicketStore } from "@/lib/support/ticket-store";
import {
  SUPPORT_TICKET_STATUSES,
  SUPPORT_TICKET_TYPES,
  type SupportTicketStatus,
  type SupportTicketType,
} from "@/lib/support/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const url = new URL(req.url);
    const typeRaw = url.searchParams.get("type");
    const statusRaw = url.searchParams.get("status");
    const type =
      typeRaw && SUPPORT_TICKET_TYPES.includes(typeRaw as SupportTicketType)
        ? (typeRaw as SupportTicketType)
        : undefined;
    const status =
      statusRaw &&
      SUPPORT_TICKET_STATUSES.includes(statusRaw as SupportTicketStatus)
        ? (statusRaw as SupportTicketStatus)
        : undefined;

    const store = getSupportTicketStore();
    const tickets = await store.listTickets({ type, status });
    const shops = await getStore().listShops();
    const byId = new Map(shops.map((s) => [s.id, s]));

    const enriched = tickets.map((t) => {
      const shop = byId.get(t.shop_id);
      return {
        ...t,
        shopName: shop?.name ?? t.shop_id,
        shopSlug: shop?.slug ?? null,
      };
    });

    return NextResponse.json({ tickets: enriched });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PATCH(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const body = await readJson<{
      id?: string;
      status?: string;
      reply?: string;
    }>(req);

    const id = body.id?.trim();
    if (!id) throw new BookingError("INVALID_INPUT", "ID_REQUIRED", 400);

    const store = getSupportTicketStore();
    const ticket = await store.getTicket(id);
    if (!ticket) throw new BookingError("NOT_FOUND", "TICKET_NOT_FOUND", 404);

    const shops = await getStore().listShops();
    const shop = shops.find((s) => s.id === ticket.shop_id);
    const shopName = shop?.name ?? ticket.shop_id;
    const ownerLine = await resolveOwnerLineUserId(
      ticket.shop_id,
      ticket.reporter_line_user_id,
    );

    let updated = ticket;
    let reply = null as Awaited<ReturnType<typeof store.addReply>> | null;

    if (body.status) {
      if (
        !SUPPORT_TICKET_STATUSES.includes(body.status as SupportTicketStatus)
      ) {
        throw new BookingError("INVALID_INPUT", "INVALID_STATUS", 400);
      }
      const next = body.status as SupportTicketStatus;
      if (next !== ticket.status) {
        updated = await store.updateTicketStatus(id, next);
        if (ownerLine) {
          void notifyOwnerTicketStatus({
            ownerLineUserId: ownerLine,
            shopName,
            ticketType: ticket.type,
            status: next,
          });
        }
      }
    }

    const replyText = body.reply?.trim();
    if (replyText) {
      if (replyText.length > 4000) {
        throw new BookingError("INVALID_INPUT", "REPLY_TOO_LONG", 400);
      }
      reply = await store.addReply(id, "operator", replyText);
      if (ownerLine) {
        void notifyOwnerTicketReply({
          ownerLineUserId: ownerLine,
          shopName,
          ticketType: ticket.type,
          replyBody: replyText,
        });
      }
    }

    const replies = await store.listReplies(id);
    return NextResponse.json({
      ticket: {
        ...updated,
        shopName,
        shopSlug: shop?.slug ?? null,
      },
      replies,
      reply,
    });
  } catch (error) {
    return jsonError(error);
  }
}
