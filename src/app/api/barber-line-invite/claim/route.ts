import { NextResponse } from "next/server";
import { assertVerifiedCustomer } from "@/lib/auth/customer-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore, StoreConflict } from "@/lib/data";

const STATUS: Partial<Record<string, number>> = {
  INVITE_NOT_FOUND: 404,
  INVITE_EXPIRED: 410,
  INVITE_ALREADY_CLAIMED: 409,
  INVITE_REVOKED: 410,
  LINE_ID_TAKEN: 409,
  IDENTITY_INCOMPATIBLE: 409,
  BARBER_NOT_FOUND: 404,
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
      return NextResponse.json({ error: { code: "INVITE_NOT_FOUND" } }, { status: 400 });
    }

    const result = await getStore().claimBarberLineInvite({
      inviteToken: code,
      lineId: lineUser.userId,
      displayName: lineUser.displayName ?? body.displayName ?? "",
    });

    return NextResponse.json({
      shop: { slug: result.shopSlug, id: result.shopId },
      barber: { id: result.barberId, name: result.barberName },
    });
  } catch (error) {
    if (error instanceof StoreConflict) {
      return NextResponse.json(
        { error: { code: error.code } },
        { status: STATUS[error.code] ?? 400 },
      );
    }
    return jsonError(error);
  }
}
