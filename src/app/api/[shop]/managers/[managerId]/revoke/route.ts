import { NextResponse } from "next/server";
import { assertShopOwner, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { getStore, StoreConflict } from "@/lib/data";
import { toPublicManager } from "@/lib/manager/invite-status";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";

const STATUS: Partial<Record<string, number>> = {
  NOT_FOUND: 404,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string; managerId: string }> },
) {
  try {
    const { shop: shopSlug, managerId } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);
    const manager = await getStore().revokeShopManager(shop.id, managerId);
    return NextResponse.json({ manager: toPublicManager(manager) });
  } catch (error) {
    if (error instanceof StoreConflict) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: STATUS[error.code] ?? 400 },
      );
    }
    return jsonError(error);
  }
}
