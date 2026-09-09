import { NextResponse } from "next/server";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore, StoreConflict } from "@/lib/data";

const STATUS: Partial<Record<string, number>> = {
  INVITE_NOT_FOUND: 404,
  INVITE_EXPIRED: 410,
  INVITE_ALREADY_CLAIMED: 409,
  LINE_ID_TAKEN: 409,
  INVALID_RANGE: 400,
};

export async function POST(req: Request) {
  try {
    const lineUser = await assertVerifiedCustomer(req);
    const body = await readJson<{
      code?: string;
      displayName?: string;
    }>(req);

    const code = body.code?.trim();
    if (!code) {
      return NextResponse.json({ error: "Missing invite code" }, { status: 400 });
    }

    const shop = await getStore().claimOwnerInvite({
      inviteToken: code,
      ownerLineId: lineUser.userId,
      ownerName: lineUser.displayName ?? body.displayName ?? "Owner",
    });

    return NextResponse.json({ shop });
  } catch (error) {
    if (error instanceof StoreConflict) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: STATUS[error.code] ?? 400 },
      );
    }
    return jsonError(error);
  }
}
