import { NextResponse } from "next/server";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { jsonError } from "@/lib/api-response";
import { resolveShopParam } from "@/lib/shop/api-route";
import { getMyQrQueue } from "@/lib/queue/qr-queue-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const customer = await assertVerifiedCustomer(req);
    const view = await getMyQrQueue(shop.id, customer.userId);
    return NextResponse.json(
      { queue: view },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return jsonError(error);
  }
}
