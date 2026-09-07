import { NextResponse } from "next/server";
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
    const body = (await req.json()) as {
      code?: string;
      lineId?: string;
      displayName?: string;
    };

    const { code, lineId, displayName } = body;
    if (!code || !lineId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const shop = await getStore().claimOwnerInvite({
      inviteToken: code,
      ownerLineId: lineId,
      ownerName: displayName ?? "Owner",
    });

    return NextResponse.json({ shop });
  } catch (error) {
    if (error instanceof StoreConflict) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: STATUS[error.code] ?? 400 },
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL", message: error instanceof Error ? error.message : "Failed" } },
      { status: 500 },
    );
  }
}
