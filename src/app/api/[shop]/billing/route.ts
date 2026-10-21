import { NextResponse } from "next/server";
import { assertShopOwner, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { computePlanState } from "@/lib/billing/plan-state";
import { priceForBarberCount, PLAN_PRICE_TABLE } from "@/lib/billing/pricing";
import { getPaymentStore } from "@/lib/billing/payment-store";
import { getShopForAdminBilling } from "@/lib/billing/resolve-shop-billing";
import { getOptionalPromptPayId } from "@/lib/billing/env";
import { getStore } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await getShopForAdminBilling(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);

    const barbers = await getStore().listBarbersByShop(shop.id);
    const bookableCount = barbers.filter(
      (b) => b.is_active !== false && b.is_bookable !== false,
    ).length;
    const price = priceForBarberCount(Math.max(bookableCount, 1));
    const plan = computePlanState(shop);
    const payments = await getPaymentStore().listPaymentsForShop(shop.id);

    return NextResponse.json({
      shop: {
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        status: shop.status,
        subscribed_until: shop.subscribed_until,
      },
      plan,
      barberCount: bookableCount,
      price,
      priceTable: PLAN_PRICE_TABLE,
      promptPayConfigured: Boolean(getOptionalPromptPayId()),
      payments: payments.slice(0, 20),
    });
  } catch (err) {
    return jsonError(err);
  }
}
