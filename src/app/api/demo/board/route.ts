import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { findDemoShop, shopIsDemo } from "@/lib/demo/demo-shop-guards";
import { loadPublicDemoBoard } from "@/lib/demo/public-board";
import { BookingError } from "@/lib/services/booking-service";
import { DEMO_SHOP_DISPLAY_NAME, getDemoShopSlug } from "@/lib/marketing/demo-shop";

export const runtime = "nodejs";

/**
 * Public read-only board for the ClipperQ Demo shop only.
 * Strips phones / LINE ids / customer names.
 */
export async function GET(req: Request) {
  try {
    const shop = await findDemoShop();
    if (!shop || !shopIsDemo(shop)) {
      throw new BookingError(
        "DEMO_NOT_READY",
        "ClipperQ Demo shop is not available yet",
        404,
      );
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? undefined;
    const board = await loadPublicDemoBoard(shop, date ?? undefined);

    return NextResponse.json({
      shop: {
        name: shop.name || DEMO_SHOP_DISPLAY_NAME,
        slug: shop.slug || getDemoShopSlug(),
        isDemo: true,
      },
      date: board.date,
      columns: board.columns,
      readOnly: true,
    });
  } catch (error) {
    return jsonError(error);
  }
}
