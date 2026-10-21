import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { assertShopOwner, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { getOptionalPromptPayId } from "@/lib/billing/env";
import { buildPromptPayPayload } from "@/lib/billing/promptpay-qr";
import { priceForBarberCount } from "@/lib/billing/pricing";
import { getShopForAdminBilling } from "@/lib/billing/resolve-shop-billing";
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

    const promptPayId = getOptionalPromptPayId();
    if (!promptPayId) {
      return NextResponse.json({ error: "PROMPTPAY_NOT_CONFIGURED" }, { status: 503 });
    }

    const url = new URL(req.url);
    const amountParam = url.searchParams.get("amount");
    let amountBaht: number | null = amountParam ? Number(amountParam) : null;

    if (amountBaht == null || !Number.isFinite(amountBaht)) {
      const barbers = await getStore().listBarbersByShop(shop.id);
      const bookableCount = barbers.filter(
        (b) => b.is_active !== false && b.is_bookable !== false,
      ).length;
      amountBaht = priceForBarberCount(Math.max(bookableCount, 1)).amountBaht;
    }

    if (amountBaht == null) {
      return NextResponse.json({ error: "CONTACT_FOR_PRICE" }, { status: 400 });
    }

    const payload = buildPromptPayPayload(promptPayId, amountBaht);
    const dataUrl = await QRCode.toDataURL(payload, {
      margin: 1,
      width: 280,
      errorCorrectionLevel: "M",
    });

    return NextResponse.json({
      amountBaht,
      promptPayIdMasked: maskPromptPay(promptPayId),
      qrDataUrl: dataUrl,
    });
  } catch (err) {
    return jsonError(err);
  }
}

function maskPromptPay(id: string): string {
  const digits = id.replace(/\D/g, "");
  if (digits.length <= 4) return "••••";
  return `${digits.slice(0, 3)}••••${digits.slice(-2)}`;
}
