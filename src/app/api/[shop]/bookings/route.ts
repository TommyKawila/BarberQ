import { NextResponse } from "next/server";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { bookingConfirmTriggerText } from "@/lib/line/booking-code";
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
    }>(req);
    const appointment = await createBookingForShop(shop.id, {
      barberId: body.barberId ?? "",
      startTime: body.startTime ?? "",
      customerName: body.customerName ?? "",
      customerPhone: body.customerPhone ?? "",
      customerRef: customer.userId,
      customerLineId: customer.userId,
    });
    // LINE confirmation is reply/non-quota via client liff.sendMessages → webhook.
    // Staff alerts use Web Push (not LINE).
    void notifyStaffWebPush({
      shopId: shop.id,
      shopSlug,
      shopName: shop.name,
      appointment,
      event: "new_booking",
    }).catch(() => {});
    return NextResponse.json(
      {
        appointment,
        lineReplyHint: {
          triggerText: bookingConfirmTriggerText(appointment.id),
          mode: "liff_send_messages_then_reply",
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
