import { NextResponse } from "next/server";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { bookingConfirmTriggerText } from "@/lib/line/booking-code";
import { notifyCustomerBookingConfirm } from "@/lib/line/booking-confirm-notify";
import { resolveShopParam } from "@/lib/shop/api-route";
import {
  createBookingForShop,
  listCustomerBookingsForShop,
} from "@/lib/services/booking-service";
import { notifyStaffWebPush } from "@/lib/webpush/notify";
import type { Appointment, Shop } from "@/types/booking";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const customer = await assertVerifiedCustomer(req);
    const appointments = await listCustomerBookingsForShop(customer.userId, shop.id);
    return NextResponse.json({ appointments });
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
    const customer = await assertVerifiedCustomer(req);
    const body = await readJson<{
      barberId?: string;
      startTime?: string;
      customerName?: string;
      customerPhone?: string;
      reminderLeadMinutes?: number | null;
    }>(req);
    const appointment = await createBookingForShop(shop.id, {
      barberId: body.barberId ?? "",
      startTime: body.startTime ?? "",
      customerName: body.customerName ?? "",
      customerPhone: body.customerPhone ?? "",
      customerRef: customer.userId,
      customerLineId: customer.userId,
      reminderLeadMinutes:
        "reminderLeadMinutes" in body ? body.reminderLeadMinutes : undefined,
    });

    // Staff alerts use Web Push (not LINE).
    void notifyStaffWebPush({
      shopId: shop.id,
      shopSlug,
      shopName: shop.name,
      appointment,
      event: "new_booking",
    }).catch(() => {});

    // LINE confirm/ticket: server push after commit (same Messaging API path as
    // shop-cancel). Must not depend on liff.sendMessages / client confirm-notify —
    // those never reliably fire in LIFF rich-menu. Await so Vercel does not kill
    // the work; errors are logged and never fail the booking response.
    const forPush: Appointment = {
      ...appointment,
      customer_line_id: appointment.customer_line_id ?? customer.userId,
      source: appointment.source ?? "line",
    };
    try {
      const push = await notifyCustomerBookingConfirm(shop, forPush);
      console.warn(
        JSON.stringify({
          event: "booking_confirm_server_push",
          shopId: shop.id,
          appointmentId: appointment.id,
          sent: push.sent,
          skippedReason: push.skippedReason ?? null,
        }),
      );
    } catch (err) {
      console.warn(
        JSON.stringify({
          event: "booking_confirm_server_push_error",
          shopId: shop.id,
          appointmentId: appointment.id,
          message: err instanceof Error ? err.message : String(err),
        }),
      );
    }

    return NextResponse.json(
      {
        appointment,
        lineReplyHint: {
          triggerText: bookingConfirmTriggerText(appointment.id),
          mode: "server_push_confirm",
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}

/** @deprecated Kept for type imports in tests that referenced sendBookingConfirm. */
export type _ShopBookingNotify = { shop: Shop; appointment: Appointment };
