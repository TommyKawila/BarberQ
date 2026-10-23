import { NextResponse } from "next/server";
import { assertShopOperator, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import {
  isCancelFeedbackReason,
} from "@/lib/billing/cancel-feedback";
import { countBookableBarberSeats } from "@/lib/billing/barber-tier";
import {
  buildTierBillingNoticeCopy,
} from "@/lib/billing/tier-notice";
import { getStore } from "@/lib/data";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Owner/manager 「ไม่ใช้บริการต่อ」 feedback.
 * Stores a response only — never disables the shop or deletes data.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOperator(staff);

    const body = await readJson<{ reason?: string; detail?: string }>(req);
    if (!isCancelFeedbackReason(body.reason)) {
      return NextResponse.json(
        { error: "Invalid reason" },
        { status: 400 },
      );
    }

    const barbers = await getStore().listBarbersByShop(shop.id);
    const bookableCount = countBookableBarberSeats(barbers);
    const copy = buildTierBillingNoticeCopy(bookableCount);

    const feedback = await getStore().createShopCancelFeedback({
      shopId: shop.id,
      reason: body.reason,
      detail: body.detail ?? null,
      bookableCount,
      recommendedTier: copy.recommendedTier,
      createdByBarberId: staff.barberId,
    });

    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
