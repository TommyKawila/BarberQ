import { NextResponse } from "next/server";
import { assertStaff, assertCanManageAppointment } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { notifyCustomerShopCancel } from "@/lib/line/shop-cancel-notify";
import { staffCancelBooking } from "@/lib/services/booking-service";
import { resolveShopFromAppointment } from "@/lib/shop/shop-from-appointment";
import { notifyStaffWebPush } from "@/lib/webpush/notify";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    const { id } = await context.params;
    const { appointment: before } = await assertCanManageAppointment(staff, id);
    const appointment = await staffCancelBooking(id);
    const shop = await resolveShopFromAppointment(appointment);
    if (shop) {
      // Shop cancel → LINE push to customer (quota) + Web Push to staff (scope rules).
      void notifyCustomerShopCancel(shop, before).catch(() => {});
      void notifyStaffWebPush({
        shopId: shop.id,
        shopSlug: shop.slug,
        shopName: shop.name,
        appointment: before,
        event: "cancel",
      }).catch(() => {});
    }
    return NextResponse.json({ appointment });
  } catch (error) {
    return jsonError(error);
  }
}
