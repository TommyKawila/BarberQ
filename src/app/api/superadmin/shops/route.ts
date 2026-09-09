import { NextResponse } from "next/server";
import { getStore } from "@/lib/data";
import { getShopActivationSummary } from "@/lib/onboarding/shop-activation-service";
import { buildOwnerInviteUrl } from "@/lib/owner/invite-url";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

export async function GET(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const store = getStore();
    const [shops, owners] = await Promise.all([store.listShops(), store.listShopOwners()]);
    const ownerByShop = new Map(owners.map((o) => [o.shopId, o.name]));
    const shopsWithOwner = await Promise.all(
      shops.map(async (shop) => {
        const activation = await getShopActivationSummary(shop);
        return {
          ...shop,
          ownerName: ownerByShop.get(shop.id) ?? null,
          claimed: activation.claimed,
          setupReady: activation.ready,
          hasFirstBooking: activation.hasFirstBooking,
          bookableCount: activation.bookableCount,
        };
      }),
    );
    return NextResponse.json({ shops: shopsWithOwner });
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
