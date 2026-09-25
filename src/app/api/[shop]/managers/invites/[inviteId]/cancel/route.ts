import { NextResponse } from "next/server";
import { assertShopOwner, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { getStore, StoreConflict } from "@/lib/data";
import { toPublicManagerInvite } from "@/lib/manager/invite-status";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";

const STATUS: Partial<Record<string, number>> = {
  INVITE_NOT_FOUND: 404,
  INVITE_ALREADY_CLAIMED: 409,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string; inviteId: string }> },
) {
  try {
    const { shop: shopSlug, inviteId } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);
    const invite = await getStore().cancelManagerInvite(shop.id, inviteId);
    return NextResponse.json({ invite: toPublicManagerInvite(invite) });
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
