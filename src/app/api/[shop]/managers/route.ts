import { NextResponse } from "next/server";
import { assertShopOwner, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { getStore, StoreConflict } from "@/lib/data";
import { buildManagerInviteUrl } from "@/lib/manager/invite-url";
import {
  toPublicManager,
  toPublicManagerInvite,
} from "@/lib/manager/invite-status";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";

const STATUS: Partial<Record<string, number>> = {
  NOT_FOUND: 404,
  INVITE_NOT_FOUND: 404,
  INVITE_ALREADY_CLAIMED: 409,
  INVITE_REVOKED: 409,
};

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);
    const store = getStore();
    const [managers, invites] = await Promise.all([
      store.listShopManagers(shop.id),
      store.listManagerInvites(shop.id),
    ]);
    return NextResponse.json({
      managers: managers.map(toPublicManager),
      invites: invites.map(toPublicManagerInvite),
    });
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
    assertShopOwner(staff);
    const invite = await getStore().createManagerInvite(shop.id, staff.barberId);
    return NextResponse.json(
      {
        invite: toPublicManagerInvite(invite),
        inviteUrl: buildManagerInviteUrl(invite.token),
      },
      { status: 201 },
    );
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
