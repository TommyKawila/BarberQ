import { NextResponse } from "next/server";
import {
  assertCanManageBarber,
  assertShopOwner,
  assertStaff,
} from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import {
  deleteBarberProfileImage,
  uploadBarberProfileImage,
} from "@/lib/barber/profile-image-storage";
import { ProfileImageError } from "@/lib/image/validate-profile-image";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    assertShopOwner(staff);
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
    }
    const barber = await assertCanManageBarber(staff, id);
    if (!barber.shop_id) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new BookingError("INVALID_FILE", "Image file required", 400);
    }
    const buffer = await file.arrayBuffer();
    const url = await uploadBarberProfileImage(
      barber.shop_id,
      barber.id,
      buffer,
      file.type,
    );
    const updated = await getStore().updateBarber(id, { profileImageUrl: url });
    return NextResponse.json({ barber: updated });
  } catch (error) {
    if (error instanceof ProfileImageError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.code } },
        { status: 400 },
      );
    }
    return jsonError(error);
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const staff = await assertStaff(req);
    assertShopOwner(staff);
    const { id } = await context.params;
    if (!isUuid(id)) {
      throw new BookingError("INVALID_BARBER", "Invalid barber id", 400);
    }
    const barber = await assertCanManageBarber(staff, id);
    if (!barber.shop_id) {
      throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
    }
    await deleteBarberProfileImage(barber.shop_id, barber.id, barber.profile_image_url);
    const updated = await getStore().updateBarber(id, { profileImageUrl: null });
    return NextResponse.json({ barber: updated });
  } catch (error) {
    return jsonError(error);
  }
}
