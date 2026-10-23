import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { isPaymentSlipStatus } from "@/lib/billing/payment-slips";
import { getStore } from "@/lib/data";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const url = new URL(req.url);
    const statusParam = url.searchParams.get("status");
    const status =
      statusParam && isPaymentSlipStatus(statusParam) ? statusParam : "pending";

    const store = getStore();
    const [slips, shops] = await Promise.all([
      store.listPaymentSlips(status),
      store.listShops(),
    ]);
    const byId = new Map(shops.map((s) => [s.id, s]));

    return NextResponse.json({
      slips: slips.map((slip) => {
        const shop = byId.get(slip.shop_id);
        return {
          ...slip,
          shopName: shop?.name ?? "—",
          shopSlug: shop?.slug ?? null,
          paidUntil: shop?.subscribed_until ?? null,
        };
      }),
    });
  } catch (error) {
    return jsonError(error);
  }
}
