import { NextResponse } from "next/server";
import { assertShopOperator, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { resolveBillingAmountForBookableCount } from "@/lib/billing/billing-amount";
import { countBookableBarberSeats } from "@/lib/billing/barber-tier";
import { uploadPaymentSlipImage } from "@/lib/billing/slip-image-storage";
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
    const slips = await getStore().listPaymentSlipsByShop(shop.id);
    return NextResponse.json({ slips });
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
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOperator(staff);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "ต้องแนบรูปสลิป" } },
        { status: 400 },
      );
    }
    const noteRaw = form.get("note");
    const note =
      typeof noteRaw === "string" && noteRaw.trim() ? noteRaw.trim() : null;

    const barbers = await getStore().listBarbersByShop(shop.id);
    const bookableCount = countBookableBarberSeats(barbers);
    const { billingTier, amountThb } =
      resolveBillingAmountForBookableCount(bookableCount);
    if (amountThb == null) {
      return NextResponse.json(
        {
          error: {
            code: "CONTACT_FOR_PRICE",
            message: "แพ็กนี้ต้องติดต่อทีมก่อนอัปโหลดสลิป",
          },
        },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    let uploaded;
    try {
      uploaded = await uploadPaymentSlipImage(shop.id, buffer, file.type);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "UPLOAD_FAILED";
      return NextResponse.json(
        {
          error: {
            code: msg,
            message:
              msg === "INVALID_IMAGE_TYPE"
                ? "รองรับเฉพาะ JPG / PNG / WebP"
                : msg === "INVALID_IMAGE_SIZE"
                  ? "ไฟล์ใหญ่เกินไป (สูงสุด 5MB)"
                  : "อัปโหลดไม่สำเร็จ",
          },
        },
        { status: 400 },
      );
    }

    const slip = await getStore().createPaymentSlip({
      shopId: shop.id,
      amountThb,
      tier: billingTier,
      storagePath: uploaded.path,
      contentType: uploaded.contentType,
      note,
      uploadedByBarberId: staff.barberId,
    });

    return NextResponse.json({ slip }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
