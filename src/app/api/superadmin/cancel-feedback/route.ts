import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { CANCEL_FEEDBACK_REASON_LABELS_TH } from "@/lib/billing/cancel-feedback";
import { getStore } from "@/lib/data";
import { EnvConfigError } from "@/lib/env";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** List cancel-intent feedback for Tommy (read-only). */
export async function GET(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const store = getStore();
    const [rows, shops] = await Promise.all([
      store.listShopCancelFeedback(),
      store.listShops(),
    ]);
    const shopById = new Map(shops.map((s) => [s.id, s]));
    const feedback = rows.map((row) => {
      const shop = shopById.get(row.shop_id);
      return {
        ...row,
        shopName: shop?.name ?? "(unknown shop)",
        shopSlug: shop?.slug ?? null,
        reasonLabel:
          CANCEL_FEEDBACK_REASON_LABELS_TH[row.reason] ?? row.reason,
      };
    });
    return NextResponse.json({ feedback });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 403 },
    );
  }
}
