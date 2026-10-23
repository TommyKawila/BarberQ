import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { assertShopOperator, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { resolveBillingAmountForBookableCount } from "@/lib/billing/billing-amount";
import {
  countBookableBarberSeats,
  normalizeBarberTier,
} from "@/lib/billing/barber-tier";
import {
  isBillingOverdue,
  shopBillingDueAt,
  shopTrialEndsAt,
} from "@/lib/billing/due-date";
import {
  buildPromptPayPayload,
  getPromptPayIdFromEnv,
} from "@/lib/billing/promptpay";
import { getStore } from "@/lib/data";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    const storedTier = normalizeBarberTier(shop.barber_tier);
    const { billingTier, rangeLabel, amountThb, priceLabel } =
      resolveBillingAmountForBookableCount(bookableCount);
    const dueAt = shopBillingDueAt(shop);
    const trialEndsAt = shopTrialEndsAt(shop);
    const overdue = isBillingOverdue(shop);

    const promptPayId = getPromptPayIdFromEnv();
    let qrDataUrl: string | null = null;
    let qrError: string | null = null;
    if (!promptPayId) {
      qrError = "PROMPTPAY_NOT_CONFIGURED";
    } else if (amountThb == null) {
      qrError = "CONTACT_FOR_PRICE";
    } else {
      try {
        const payload = buildPromptPayPayload(promptPayId, amountThb);
        qrDataUrl = await QRCode.toDataURL(payload, {
          margin: 1,
          width: 280,
          errorCorrectionLevel: "M",
        });
      } catch {
        qrError = "QR_BUILD_FAILED";
      }
    }

    const slips = await getStore().listPaymentSlipsByShop(shop.id);

    return NextResponse.json({
      shopId: shop.id,
      shopName: shop.name,
      bookableCount,
      /** Stored soft flag only — display/QR use billingTier from bookable count. */
      barberTier: storedTier,
      billingTier,
      rangeLabel,
      amountThb,
      priceLabel,
      dueAt: dueAt.toISOString(),
      trialEndsAt: trialEndsAt.toISOString(),
      paidUntil: shop.subscribed_until,
      overdue,
      qrDataUrl,
      qrError,
      slips: slips.slice(0, 10).map((s) => ({
        id: s.id,
        status: s.status,
        amount_thb: s.amount_thb,
        created_at: s.created_at,
        reviewed_at: s.reviewed_at,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
