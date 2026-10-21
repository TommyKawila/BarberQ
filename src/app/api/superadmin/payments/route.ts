import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { EnvConfigError } from "@/lib/env";
import { getPaymentStore } from "@/lib/billing/payment-store";
import { manuallyReviewPayment } from "@/lib/billing/process-slip";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";
import { getStore } from "@/lib/data";

export async function GET(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const payments = await getPaymentStore().listPendingReview();
    const shops = await getStore().listShops();
    const byId = new Map(shops.map((s) => [s.id, s]));
    return NextResponse.json({
      payments: payments.map((p) => ({
        ...p,
        shopName: byId.get(p.shop_id)?.name ?? null,
        shopSlug: byId.get(p.shop_id)?.slug ?? null,
      })),
    });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unauthorized" },
      { status: 403 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const body = (await req.json()) as {
      paymentId?: string;
      approve?: boolean;
      note?: string | null;
    };
    if (!body.paymentId || typeof body.approve !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const payment = await manuallyReviewPayment({
      paymentId: body.paymentId,
      approve: body.approve,
      note: body.note,
    });
    return NextResponse.json({ payment });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    const message = err instanceof Error ? err.message : "Failed";
    const status = message === "NOT_FOUND" ? 404 : message === "INVALID_STATUS" ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
