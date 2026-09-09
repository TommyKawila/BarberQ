import { NextResponse } from "next/server";
import { formatInTimeZone } from "date-fns-tz";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { buildShopWebUrl } from "@/lib/line/liff-url";
import { pushText } from "@/lib/line/push-message";
import { resolveShopParam } from "@/lib/shop/api-route";
import {
  createBookingForShop,
  listCustomerBookingsForShop,
} from "@/lib/services/booking-service";
import { SHOP_TIMEZONE } from "@/lib/services/slot-service";
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
    void sendBookingConfirm(shop, shopSlug, appointment).catch(() => {});
    return NextResponse.json({ appointment }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}

async function sendBookingConfirm(shop: Shop, shopSlug: string, appointment: Appointment) {
  const lineId = appointment.customer_line_id?.trim();
  if (!lineId) return;
  const barber = await getStore().getBarber(appointment.barber_id);
  const when = formatInTimeZone(
    new Date(appointment.start_time),
    SHOP_TIMEZONE,
    "d MMM HH:mm",
  );
  const bookingsUrl = `${buildShopWebUrl(shopSlug)}/bookings`;
  const text = `จองคิว ${shop.name} แล้ว ${when} ช่าง ${barber?.name ?? "—"} ดูคิว: ${bookingsUrl}`;
  await pushText(lineId, text);
}
