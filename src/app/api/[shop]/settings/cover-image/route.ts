import { NextResponse } from "next/server";
import { assertStaffForShop, assertShopOwner } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { CoverImageError } from "@/lib/image/validate-cover-image";
import { resolveShopParam } from "@/lib/shop/api-route";
import {
  deleteShopCoverImage,
  uploadShopCoverImage,
} from "@/lib/shop/cover-image-storage";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new BookingError("INVALID_FILE", "Image file required", 400);
    }

    const buffer = await file.arrayBuffer();
    const current = await getStore().getShopSettings(shop.id);
    const url = await uploadShopCoverImage(shop.id, buffer, file.type);

    await getStore().setShopSettings(shop.id, {
      ...current,
      coverImageUrl: url,
    });

    if (current.coverImageUrl && current.coverImageUrl !== url) {
      await deleteShopCoverImage(current.coverImageUrl);
    }

    return NextResponse.json({ coverImageUrl: url });
  } catch (error) {
    if (error instanceof CoverImageError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.code } },
        { status: 400 },
      );
    }
    return jsonError(error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);

    const current = await getStore().getShopSettings(shop.id);
    await deleteShopCoverImage(current.coverImageUrl);
    await getStore().setShopSettings(shop.id, {
      ...current,
      coverImageUrl: null,
    });

    return NextResponse.json({ coverImageUrl: null });
  } catch (error) {
    return jsonError(error);
  }
}
