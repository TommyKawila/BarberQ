import { NextResponse } from "next/server";
import { assertStaffForShop } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { BookingError } from "@/lib/services/booking-service";
import { resolveShopParam } from "@/lib/shop/api-route";
import { getAppVersionLabel } from "@/lib/support/env";
import { notifyOperatorNewTicket } from "@/lib/support/operator-notify";
import { MAX_SUPPORT_SCREENSHOTS } from "@/lib/support/screenshot-storage";
import { getSupportTicketStore } from "@/lib/support/ticket-store";
import {
  SUPPORT_TICKET_TYPES,
  type SupportTicketType,
} from "@/lib/support/types";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    await assertStaffForShop(req, shop.id);
    const tickets = await getSupportTicketStore().listTicketsForShop(shop.id);
    return NextResponse.json({ tickets });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);

    const body = await readJson<{
      type?: string;
      body?: string;
      pagePath?: string;
      deviceInfo?: string;
      errorMessage?: string;
      errorDigest?: string;
      appVersion?: string;
      screenshotPaths?: string[];
    }>(req);

    const type = body.type as SupportTicketType | undefined;
    if (!type || !SUPPORT_TICKET_TYPES.includes(type) || type === "crash") {
      // crash goes through /crash endpoint for dedupe
      if (type === "crash") {
        throw new BookingError("INVALID_INPUT", "USE_CRASH_ENDPOINT", 400);
      }
      throw new BookingError("INVALID_INPUT", "INVALID_TICKET_TYPE", 400);
    }

    const text = String(body.body ?? "").trim();
    if (type !== "setup_help" && text.length < 3) {
      throw new BookingError("INVALID_INPUT", "BODY_REQUIRED", 400);
    }
    if (text.length > 4000) {
      throw new BookingError("INVALID_INPUT", "BODY_TOO_LONG", 400);
    }

    const paths = Array.isArray(body.screenshotPaths)
      ? body.screenshotPaths.filter((p) => typeof p === "string" && p.length > 0)
      : [];
    if (paths.length > MAX_SUPPORT_SCREENSHOTS) {
      throw new BookingError("INVALID_INPUT", "TOO_MANY_SCREENSHOTS", 400);
    }

    const lineId = staff.lineId?.trim();
    if (!lineId) {
      throw new BookingError("UNAUTHORIZED", "LINE_REQUIRED", 401);
    }

    const ticket = await getSupportTicketStore().createTicket({
      shopId: shop.id,
      reporterLineUserId: lineId,
      reporterStaffId: staff.staffId,
      reporterName: staff.name,
      type,
      body: text || (type === "setup_help" ? "ขอให้ทีมช่วยตั้งค่าร้าน" : ""),
      pagePath: body.pagePath?.trim() || null,
      deviceInfo: body.deviceInfo?.trim() || null,
      errorMessage: body.errorMessage?.trim() || null,
      errorDigest: body.errorDigest?.trim() || null,
      appVersion: body.appVersion?.trim() || getAppVersionLabel(),
      screenshotPaths: paths,
    });

    void notifyOperatorNewTicket({
      ticket,
      shopName: shop.name,
      shopSlug: shop.slug,
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
