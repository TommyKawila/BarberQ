import { NextResponse } from "next/server";
import { assertShopOwner, assertStaffForShop } from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { readBarberqEnv } from "@/lib/founder-qa/env";
import { canManuallyRunReminders } from "@/lib/reminders/manual-run";
import { processDueReminders } from "@/lib/reminders/process-due";
import { resolveShopParam } from "@/lib/shop/api-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    return NextResponse.json({
      allowed: canManuallyRunReminders(staff.role),
      barberqEnv: readBarberqEnv(),
    });
  } catch (error) {
    return jsonError(error);
  }
}

/** Owner QA: same worker as Vercel Cron `/api/cron/reminders`. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ shop: string }> },
) {
  try {
    const { shop: shopSlug } = await params;
    const shop = await resolveShopParam(shopSlug);
    const staff = await assertStaffForShop(req, shop.id);
    assertShopOwner(staff);

    const result = await processDueReminders(new Date());
    console.info(
      JSON.stringify({
        event: "manual_reminders_run",
        shopId: shop.id,
        staffKey: staff.lineId ?? staff.barberId,
        ...result,
      }),
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(error);
  }
}
