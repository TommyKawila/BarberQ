import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import {
  countBookableBarberSeats,
  isOverTier,
  normalizeBarberTier,
} from "@/lib/billing/barber-tier";
import {
  graceDaysRemaining,
  isBillingOverdue,
  isPastBillingGrace,
} from "@/lib/billing/due-date";
import { collectShopSeatFlags } from "@/lib/billing/over-tier-flags";
import {
  buildTierBillingNoticeCopy,
  shouldShowTierBillingNotice,
} from "@/lib/billing/tier-notice";
import { getStore } from "@/lib/data";
import { EnvConfigError } from "@/lib/env";
import { getShopActivationSummary } from "@/lib/onboarding/shop-activation-service";
import { buildOwnerInviteUrl } from "@/lib/owner/invite-url";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";
import type { Barber } from "@/types/booking";

export async function GET(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const store = getStore();
    const [shops, owners, allBarbers] = await Promise.all([
      store.listShops(),
      store.listShopOwners(),
      store.listBarbers(),
    ]);
    const ownerByShop = new Map(owners.map((o) => [o.shopId, o.name]));
    const barbersByShop = new Map<string, Barber[]>();
    const staffByShop = new Map<string, { id: string; name: string; role: string; lineLinked: boolean }[]>();
    for (const barber of allBarbers) {
      if (!barber.shop_id) continue;
      const full = barbersByShop.get(barber.shop_id) ?? [];
      full.push(barber);
      barbersByShop.set(barber.shop_id, full);
      const list = staffByShop.get(barber.shop_id) ?? [];
      list.push({
        id: barber.id,
        name: barber.name,
        role: barber.role ?? "barber",
        lineLinked: Boolean(barber.line_id),
      });
      staffByShop.set(barber.shop_id, list);
    }
    const shopsWithOwner = await Promise.all(
      shops.map(async (shop) => {
        const activation = await getShopActivationSummary(shop);
        const shopBarbers = barbersByShop.get(shop.id) ?? [];
        const tier = normalizeBarberTier(shop.barber_tier);
        const seatBookableCount = countBookableBarberSeats(shopBarbers);
        let hours = null;
        try {
          const settings = await store.getShopSettings(shop.id);
          hours = settings.hours ?? null;
        } catch {
          hours = null;
        }
        const flags = collectShopSeatFlags({
          shop: { ...shop, barber_tier: tier },
          barbers: shopBarbers,
          hours,
        });
        const recommended = buildTierBillingNoticeCopy(seatBookableCount);
        const overdue = !shop.is_demo && isBillingOverdue(shop);
        const pastGrace = overdue && isPastBillingGrace(shop);
        return {
          ...shop,
          barber_tier: tier,
          ownerName: ownerByShop.get(shop.id) ?? null,
          claimed: activation.claimed,
          setupReady: activation.ready,
          hasFirstBooking: activation.hasFirstBooking,
          bookableCount: activation.bookableCount,
          seatBookableCount,
          overTier: isOverTier(seatBookableCount, tier),
          seatFlags: flags.map((f) => f.label),
          recommendedTier: recommended.recommendedTier,
          recommendedTierLabel: recommended.rangeLabel,
          recommendedPriceLabel: recommended.priceLabel,
          showBillingNotice: shouldShowTierBillingNotice(shop),
          billingOverdue: overdue,
          billingPastGrace: pastGrace,
          billingGraceDaysLeft: overdue ? graceDaysRemaining(shop) : 0,
          staff: staffByShop.get(shop.id) ?? [],
        };
      }),
    );
    return NextResponse.json({ shops: shopsWithOwner });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
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
    if (err instanceof EnvConfigError) return jsonError(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create shop" },
      { status: 500 },
    );
  }
}
