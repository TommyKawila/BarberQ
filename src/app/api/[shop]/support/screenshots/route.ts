import { NextResponse } from "next/server";
import { assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { BookingError } from "@/lib/services/booking-service";
import { resolveShopParam } from "@/lib/shop/api-route";
import { uploadSupportScreenshot } from "@/lib/support/screenshot-storage";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    await assertStaffForShop(req, shop.id);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new BookingError("INVALID_INPUT", "FILE_REQUIRED", 400);
    }

    const buffer = await file.arrayBuffer();
    try {
      const uploaded = await uploadSupportScreenshot(
        shop.id,
        buffer,
        file.type || null,
      );
      return NextResponse.json(uploaded, { status: 201 });
    } catch (err) {
      const code = err instanceof Error ? err.message : "UPLOAD_FAILED";
      if (
        code === "INVALID_SCREENSHOT_TYPE" ||
        code === "INVALID_SCREENSHOT_SIZE"
      ) {
        throw new BookingError("INVALID_INPUT", code, 400);
      }
      throw err;
    }
  } catch (error) {
    return jsonError(error);
  }
}
