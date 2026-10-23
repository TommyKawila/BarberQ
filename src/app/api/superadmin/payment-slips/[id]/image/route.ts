import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { createPaymentSlipSignedUrl } from "@/lib/billing/slip-image-storage";
import { getStore } from "@/lib/data";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const { id } = await params;
    const slip = await getStore().getPaymentSlip(id);
    if (!slip) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Slip not found" } },
        { status: 404 },
      );
    }
    const url = await createPaymentSlipSignedUrl(slip.storage_path);
    if (!url) {
      return NextResponse.json(
        { error: { code: "NO_IMAGE", message: "No image URL" } },
        { status: 404 },
      );
    }
    return NextResponse.json({ url });
  } catch (error) {
    return jsonError(error);
  }
}
