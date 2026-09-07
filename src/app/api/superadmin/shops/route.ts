import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { buildOwnerInviteUrl } from "@/lib/owner/invite-url";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

export async function GET(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const shops = await getStore().listShops();
    return NextResponse.json({ shops });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 403 },
    );
  }
}

export async function POST(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const body = (await req.json()) as {
      shopName?: string;
      ownerLineId?: string;
      ownerName?: string;
      subscriptionMonths?: number;
    };

    const { shopName, ownerLineId, ownerName, subscriptionMonths } = body;
    if (!shopName || !subscriptionMonths) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const shop = await getStore().createShop({
      name: shopName,
      ownerLineId: ownerLineId?.trim() || undefined,
      ownerName: ownerName || "Owner",
      subscriptionMonths,
    });

    const inviteUrl =
      shop.invite_token ? buildOwnerInviteUrl(shop.invite_token) : undefined;

    return NextResponse.json({ shop, inviteUrl }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create shop" },
      { status: 500 },
    );
  }
}
