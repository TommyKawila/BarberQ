import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const lineId = new URL(req.url).searchParams.get("lineId")?.trim() ?? "";
    if (!lineId) {
      return NextResponse.json({ staff: null });
    }
    const barber = await getStore().getBarberByLineIdInShop(lineId, shop.id);
    if (!barber || (barber.role !== "owner" && barber.role !== "barber")) {
      return NextResponse.json({ staff: null });
    }
    return NextResponse.json({
      staff: {
        role: barber.role,
        barberId: barber.id,
        barberName: barber.name,
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
