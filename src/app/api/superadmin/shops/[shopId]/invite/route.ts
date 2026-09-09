import { NextResponse } from "next/server";
import { jsonError } from "@/lib/api-response";
import { getStore, StoreConflict } from "@/lib/data";
import { EnvConfigError } from "@/lib/env";
import { buildOwnerInviteUrl } from "@/lib/owner/invite-url";
import { assertSuperAdminToken } from "@/lib/superadmin/auth";

const STATUS: Partial<Record<string, number>> = {
  INVITE_NOT_FOUND: 404,
  INVITE_ALREADY_CLAIMED: 409,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ shopId: string }> },
) {
  try {
    assertSuperAdminToken(req.headers.get("x-superadmin-token"));
    const { shopId } = await params;
    const shop = await getStore().regenerateOwnerInvite(shopId);
    const inviteUrl =
      shop.invite_token ? buildOwnerInviteUrl(shop.invite_token) : undefined;
    return NextResponse.json({ shop, inviteUrl });
  } catch (err) {
    if (err instanceof EnvConfigError) return jsonError(err);
    if (err instanceof StoreConflict) {
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status: STATUS[err.code] ?? 400 },
      );
    }
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to regenerate invite" },
      { status: 500 },
    );
  }
}
