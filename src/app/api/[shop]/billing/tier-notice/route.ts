import { NextResponse } from "next/server";
import { assertShopOperator, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { countBookableBarberSeats } from "@/lib/billing/barber-tier";
import {
  buildOverdueBillingNotice,
  buildTierBillingNoticeCopy,
  shouldShowTierBillingNotice,
} from "@/lib/billing/tier-notice";
import { getStore } from "@/lib/data";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Soft billing notice for owners/managers (admin UI only — no LINE). */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOperator(staff);

    const barbers = await getStore().listBarbersByShop(shop.id);
    const bookableCount = countBookableBarberSeats(barbers);
    const show = shouldShowTierBillingNotice(shop);
    const copy = buildTierBillingNoticeCopy(bookableCount);
    const overdue = buildOverdueBillingNotice(shop);

    return NextResponse.json({
      show: show || overdue.overdue,
      ...copy,
      overdue: overdue.overdue,
      graceDaysLeft: overdue.graceDaysLeft,
      overdueHeadline: overdue.headline,
      overdueMessage: overdue.message,
    });
  } catch (error) {
    return jsonError(error);
  }
}
