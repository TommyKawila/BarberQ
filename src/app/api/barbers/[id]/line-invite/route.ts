import { NextResponse } from "next/server";
import {
  assertCanManageBarber,
  assertCanMutateOwnerBarberIdentity,
  assertStaff,
  isShopOperatorRole,
} from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { buildBarberLineInviteUrl } from "@/lib/barber/line-invite-url";
import { toPublicBarberLineInvite } from "@/lib/barber/line-invite-status";
import { getStore, StoreConflict } from "@/lib/data";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

const STATUS: Partial<Record<string, number>> = {
  BARBER_NOT_FOUND: 404,
  INVITE_NOT_FOUND: 404,
  INVITE_ALREADY_CLAIMED: 409,
  INVITE_REVOKED: 410,
  FORBIDDEN: 403,
};

/** GET — pending invite status (no raw token). */
export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    if (!isShopOperatorRole(staff.role)) {
      throw new BookingError("FORBIDDEN", "Shop operator required", 403);
    }
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
    }
    const barber = await assertCanManageBarber(staff, id);
    assertCanMutateOwnerBarberIdentity(staff, barber);
    if (!barber.shop_id) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }
    const pending = await getStore().getPendingBarberLineInvite(barber.shop_id, id);
    return NextResponse.json({
      invite: pending ? toPublicBarberLineInvite(pending) : null,
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

/** POST — create (or rotate) invite; returns inviteUrl once. */
export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    if (!isShopOperatorRole(staff.role)) {
      throw new BookingError("FORBIDDEN", "Shop operator required", 403);
    }
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
    }
    const barber = await assertCanManageBarber(staff, id);
    assertCanMutateOwnerBarberIdentity(staff, barber);
    if (!barber.shop_id) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }
    const invite = await getStore().createBarberLineInvite(
      barber.shop_id,
      id,
      staff.barberId,
    );
    return NextResponse.json(
      {
        invite: toPublicBarberLineInvite(invite),
        inviteUrl: buildBarberLineInviteUrl(invite.token),
      },
      { status: 201 },
    );
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

/** DELETE — cancel pending invite. Body: { inviteId } */
export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    if (!isShopOperatorRole(staff.role)) {
      throw new BookingError("FORBIDDEN", "Shop operator required", 403);
    }
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
    }
    const barber = await assertCanManageBarber(staff, id);
    assertCanMutateOwnerBarberIdentity(staff, barber);
    if (!barber.shop_id) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }
    const body = await readJson<{ inviteId?: string }>(req);
    const inviteId = body.inviteId?.trim() ?? "";
    if (!isUuid(inviteId)) {
      throw new BookingError("INVALID_RANGE", "Invalid invite id", 400);
    }
    const invite = await getStore().cancelBarberLineInvite(
      barber.shop_id,
      id,
      inviteId,
    );
    return NextResponse.json({ invite: toPublicBarberLineInvite(invite) });
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
