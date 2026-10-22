import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { isBarberTierId } from "@/lib/billing/barber-tier";
import { getStore } from "@/lib/data";
import { EnvConfigError } from "@/lib/env";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

export const runtime = "nodejs";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ shopId: string }> },
) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const { shopId } = await context.params;
    const body = await readJson<{ barberTier?: string }>(req);
    if (!isBarberTierId(body.barberTier)) {
      return NextResponse.json(
        { error: "Invalid barberTier (tier1|tier2|tier3|contact)" },
        { status: 400 },
      );
    }
    const shop = await getStore().updateShopBarberTier(shopId, body.barberTier);
    return NextResponse.json({ shop });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update tier" },
      { status: 500 },
    );
  }
}
