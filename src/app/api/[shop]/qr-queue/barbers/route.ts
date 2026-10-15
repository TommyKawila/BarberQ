import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public list of bookable barbers for QR join UI (after LINE login). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const barbers = (await getStore().listBarbersByShop(shop.id))
      .filter((b) => b.is_active !== false && b.is_bookable !== false)
      .map((b) => ({
        id: b.id,
        name: b.name,
        profileImageUrl: b.profile_image_url ?? null,
        showProfile: Boolean(b.show_profile_in_booking),
      }));
    return NextResponse.json({ barbers });
  } catch (error) {
    return jsonError(error);
  }
}
