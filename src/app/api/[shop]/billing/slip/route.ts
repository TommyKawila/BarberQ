import { NextResponse } from "next/server";
import { assertShopOwner, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { processPaymentSlip } from "@/lib/billing/process-slip";
import { priceForBarberCount } from "@/lib/billing/pricing";
import { getShopForAdminBilling } from "@/lib/billing/resolve-shop-billing";
import { getStore } from "@/lib/data";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await getShopForAdminBilling(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);

    const form = await req.formData();
    const file = form.get("slip");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "MISSING_SLIP" }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "SLIP_TOO_LARGE" }, { status: 400 });
    }

    const barbers = await getStore().listBarbersByShop(shop.id);
    const bookableCount = barbers.filter(
      (b) => b.is_active !== false && b.is_bookable !== false,
    ).length;
    const price = priceForBarberCount(Math.max(bookableCount, 1));
    if (price.amountBaht == null) {
      return NextResponse.json({ error: "CONTACT_FOR_PRICE" }, { status: 400 });
    }

    const amountOverride = form.get("amountBaht");
    const amountBaht =
      amountOverride != null && String(amountOverride).trim()
        ? Number(amountOverride)
        : price.amountBaht;
    if (!Number.isInteger(amountBaht) || amountBaht <= 0) {
      return NextResponse.json({ error: "INVALID_AMOUNT" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const payment = await processPaymentSlip({
      shop,
      amountBaht,
      planTier: price.tier,
      image: buffer,
      contentType: file.type || "image/jpeg",
      submittedByLineId: staff.lineId ?? "",
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "PROMPTPAY_NOT_CONFIGURED") {
      return NextResponse.json({ error: err.message }, { status: 503 });
    }
    return jsonError(err);
  }
}
