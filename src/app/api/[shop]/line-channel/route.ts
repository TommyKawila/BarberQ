import { NextResponse } from "next/server";
import { assertShopOperator, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { hasAppEncryptionKey } from "@/lib/crypto/secret-box";
import { resolveShopParam } from "@/lib/shop/api-route";
import {
  getShopLineChannel,
  upsertShopLineChannel,
} from "@/lib/line/shop-channel";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

function webhookUrl(shopId: string): string {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
  return `${base || ""}/api/line/webhook/${shopId}`;
}

function setupEmail(shopId: string): string {
  const domain = process.env.BARBERQX_SETUP_EMAIL_DOMAIN?.trim() || "barberqx.com";
  return `setup+${shopId}@${domain}`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOperator(staff);
    const channel = await getShopLineChannel(shop.id);
    return NextResponse.json({
      channel,
      webhookUrl: webhookUrl(shop.id),
      setupEmail: setupEmail(shop.id),
      encryptionReady: hasAppEncryptionKey(),
      shopId: shop.id,
      shopName: shop.name,
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOperator(staff);
    if (!hasAppEncryptionKey()) {
      throw new BookingError(
        "MISCONFIGURED",
        "APP_ENCRYPTION_KEY is required to store LINE secrets",
        503,
      );
    }
    const body = await readJson<{
      messagingChannelId?: string;
      channelSecret?: string;
      accessToken?: string;
      checklistStep?: number;
    }>(req);

    const channel = await upsertShopLineChannel(shop.id, {
      messagingChannelId: body.messagingChannelId,
      channelSecret: body.channelSecret,
      accessToken: body.accessToken,
      checklistStep: body.checklistStep,
      status: "pending",
      lastErrorCode: null,
      lastErrorMessage: null,
    });
    return NextResponse.json({ channel });
  } catch (error) {
    return jsonError(error);
  }
}
