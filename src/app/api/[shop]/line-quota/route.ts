import { NextResponse } from "next/server";
import { assertShopOperator, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { getShopPushQuota } from "@/lib/line/quota";
import {
  getMessageQuota,
  getMessageQuotaConsumption,
} from "@/lib/line/messaging-api";
import { getShopLineChannelSecrets, upsertShopLineChannel } from "@/lib/line/shop-channel";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOperator(staff);
    const quota = await getShopPushQuota(shop.id);
    return NextResponse.json({ quota });
  } catch (error) {
    return jsonError(error);
  }
}

/** Re-check LINE package / consumption and refresh local budget. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOperator(staff);

    const secrets = await getShopLineChannelSecrets(shop.id);
    if (secrets.accessToken) {
      try {
        const [quota, consumption] = await Promise.all([
          getMessageQuota(secrets.accessToken),
          getMessageQuotaConsumption(secrets.accessToken),
        ]);
        if (quota.type === "limited" && typeof quota.value === "number") {
          const plan =
            quota.value <= 300 ? "free" : quota.value <= 15000 ? "basic" : "pro";
          await upsertShopLineChannel(shop.id, {
            monthlyPushBudget: quota.value,
            plan,
          });
        }
        void consumption;
      } catch {
        /* fall through to local quota */
      }
    }

    const next = await getShopPushQuota(shop.id);
    return NextResponse.json({ quota: next });
  } catch (error) {
    return jsonError(error);
  }
}
