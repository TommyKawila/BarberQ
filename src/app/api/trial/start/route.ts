import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import {
  startSelfServeTrial,
  TrialAbuseError,
} from "@/lib/billing/start-trial";
import { getClientIp, isTrialRateLimited } from "@/lib/marketing/trial-rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    if (isTrialRateLimited(`trial-start:${ip}`)) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }

    const lineUser = await assertVerifiedCustomer(req);
    if (isTrialRateLimited(`trial-start-line:${lineUser.userId}`)) {
      return NextResponse.json({ error: "RATE_LIMIT" }, { status: 429 });
    }

    const body = await readJson<{
      shopName?: string;
      province?: string | null;
      barberCount?: number | null;
      locale?: string | null;
      utmSource?: string | null;
      utmMedium?: string | null;
      utmCampaign?: string | null;
      referrer?: string | null;
    }>(req);

    const shopName = body.shopName?.trim() ?? "";
    if (!shopName) {
      return NextResponse.json({ error: "INVALID_SHOP_NAME" }, { status: 400 });
    }

    const { shop, leadId } = await startSelfServeTrial({
      shopName,
      ownerLineId: lineUser.userId,
      ownerName: lineUser.displayName || "Owner",
      province: body.province,
      barberCount: body.barberCount,
      locale: body.locale,
      utmSource: body.utmSource,
      utmMedium: body.utmMedium,
      utmCampaign: body.utmCampaign,
      referrer: body.referrer ?? "self-serve-trial",
    });

    return NextResponse.json(
      {
        ok: true,
        shop: {
          id: shop.id,
          name: shop.name,
          slug: shop.slug,
          status: shop.status,
          subscribed_until: shop.subscribed_until,
        },
        leadId,
        redirect: `/${shop.slug}/admin/setup`,
      },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof TrialAbuseError) {
      const status = err.code === "RATE_LIMIT" ? 429 : 409;
      return NextResponse.json({ error: err.code, message: err.message }, { status });
    }
    return jsonError(err);
  }
}
