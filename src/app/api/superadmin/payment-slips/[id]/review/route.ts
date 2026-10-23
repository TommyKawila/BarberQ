import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { isPaymentSlipStatus } from "@/lib/billing/payment-slips";
import { getStore } from "@/lib/data";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const { id } = await params;
    const body = (await req.json()) as {
      status?: string;
      note?: string | null;
    };
    if (body.status !== "paid" && body.status !== "rejected") {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "status must be paid or rejected" } },
        { status: 400 },
      );
    }
    if (!isPaymentSlipStatus(body.status)) {
      return NextResponse.json(
        { error: { code: "VALIDATION", message: "invalid status" } },
        { status: 400 },
      );
    }

    const result = await getStore().reviewPaymentSlip(
      id,
      body.status,
      body.note ?? null,
    );
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
