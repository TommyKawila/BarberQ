import { NextResponse } from "next/server";
import { assertStaffForShop } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { BookingError } from "@/lib/services/booking-service";
import { resolveShopParam } from "@/lib/shop/api-route";
import {
  buildCrashFingerprint,
  shouldNotifyCrashOccurrence,
} from "@/lib/support/crash-fingerprint";
import { getAppVersionLabel } from "@/lib/support/env";
import { notifyOperatorNewTicket } from "@/lib/support/operator-notify";
import { getSupportTicketStore } from "@/lib/support/ticket-store";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);

    const body = await readJson<{
      message?: string;
      digest?: string;
      pagePath?: string;
      deviceInfo?: string;
      appVersion?: string;
      stack?: string;
    }>(req);

    const message = String(body.message ?? "").trim() || "Unknown error";
    const fingerprint = buildCrashFingerprint({
      message,
      digest: body.digest,
      pagePath: body.pagePath,
    });

    const lineId = staff.lineId?.trim() || "unknown";
    const store = getSupportTicketStore();
    const existing = await store.findOpenCrashByFingerprint(shop.id, fingerprint);

    if (existing) {
      const updated = await store.incrementCrashOccurrence(existing.id);
      const notify = shouldNotifyCrashOccurrence(updated.occurrence_count);
      if (notify) {
        void notifyOperatorNewTicket({
          ticket: updated,
          shopName: shop.name,
          shopSlug: shop.slug,
          frequent: true,
        });
      }
      return NextResponse.json({
        ticket: updated,
        deduped: true,
        notified: notify,
      });
    }

    const ticket = await store.createTicket({
      shopId: shop.id,
      reporterLineUserId: lineId,
      reporterStaffId: staff.staffId,
      reporterName: staff.name,
      type: "crash",
      body: message.slice(0, 2000),
      pagePath: body.pagePath?.trim() || null,
      deviceInfo: body.deviceInfo?.trim() || null,
      errorMessage: message.slice(0, 2000),
      errorDigest: body.digest?.trim() || null,
      appVersion: body.appVersion?.trim() || getAppVersionLabel(),
      errorFingerprint: fingerprint,
    });

    void notifyOperatorNewTicket({
      ticket,
      shopName: shop.name,
      shopSlug: shop.slug,
    });

    return NextResponse.json({ ticket, deduped: false, notified: true }, { status: 201 });
  } catch (error) {
    // Auth failures still return proper errors; never throw BookingError for crash spam
    if (error instanceof BookingError) return jsonError(error);
    return jsonError(error);
  }
}
