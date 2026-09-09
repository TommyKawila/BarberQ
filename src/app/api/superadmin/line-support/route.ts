import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import { EnvConfigError } from "@/lib/env";
import { LINE_OA_INSTALL_STATUSES } from "@/lib/onboarding/line-oa-install";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";
import type { LineOaInstallRequestStatus } from "@/lib/onboarding/line-oa-install";

export async function GET(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const store = getStore();
    const [requests, shops] = await Promise.all([
      store.listLineOaInstallRequests(),
      store.listShops(),
    ]);
    const shopById = new Map(shops.map((s) => [s.id, s]));
    const rows = requests.map((r) => {
      const shop = shopById.get(r.shop_id);
      return {
        ...r,
        shopName: shop?.name ?? "Unknown",
        shopSlug: shop?.slug ?? null,
      };
    });
    return NextResponse.json({ requests: rows });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: err instanceof Error && err.message === "Unauthorized" ? 401 : 403 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const body = await readJson<{ id?: string; status?: string }>(req);
    const id = body.id?.trim();
    const status = body.status as LineOaInstallRequestStatus;
    if (!id || !status || !LINE_OA_INSTALL_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid id or status" }, { status: 400 });
    }
    const request = await getStore().updateLineOaInstallRequestStatus(id, status);
    return NextResponse.json({ request });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update" },
      { status: 500 },
    );
  }
}
