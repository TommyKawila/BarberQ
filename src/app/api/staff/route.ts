import { NextResponse } from "next/server";
import {
  assertStaff,
  assertShopOwner,
  type StaffAuth,
} from "@/lib/admin-auth";
import { jsonError, readJson } from "@/lib/api-response";
import { getStore } from "@/lib/data";
import type { CreateStaffInput, StaffRole } from "@/lib/data/types";
import { BookingError } from "@/lib/services/booking-service";

export const runtime = "nodejs";

function getBaseUrl(req: Request): string {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (host) return `${proto}://${host}`;
  return process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

function serializeStaff(staff: {
  id: string;
  name: string;
  role: StaffRole;
  token: string;
  barberId: string | null;
  active: boolean;
  createdAt: Date;
}) {
  return {
    id: staff.id,
    name: staff.name,
    role: staff.role,
    token: staff.token,
    barberId: staff.barberId,
    active: staff.active,
    createdAt: staff.createdAt.toISOString(),
  };
}

async function filterStaffForShop(shopId: string) {
  const shopBarbers = await getStore().listBarbersByShop(shopId);
  const barberIds = new Set(shopBarbers.map((b) => b.id));
  const allStaff = await getStore().listStaff();
  return allStaff.filter(
    (row) => row.barberId === null || barberIds.has(row.barberId),
  );
}

async function assertStaffBarberInShop(
  auth: StaffAuth,
  barberId: string | null | undefined,
): Promise<void> {
  if (!barberId) return;
  const barber = await getStore().getBarber(barberId);
  if (!barber || barber.shop_id !== auth.shopId) {
    throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
  }
}

export async function GET(req: Request) {
  try {
    const auth = await assertStaff(req);
    assertShopOwner(auth);
    const staff = await filterStaffForShop(auth.shopId);
    return NextResponse.json({
      staff: staff.map(serializeStaff),
    });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await assertStaff(req);
    assertShopOwner(auth);
    const body = await readJson<{
      name?: string;
      role?: StaffRole;
      barberId?: string | null;
    }>(req);

    const name = body.name?.trim() ?? "";
    if (!name) {
      throw new BookingError("INVALID_INPUT", "Name is required", 400);
    }
    if (body.role !== "barber" && body.role !== "super_admin") {
      throw new BookingError("INVALID_INPUT", "Invalid role", 400);
    }

    await assertStaffBarberInShop(auth, body.barberId);

    const input: CreateStaffInput = {
      name,
      role: body.role,
      barberId: body.barberId ?? null,
    };

    const created = await getStore().createStaff(input);
    const loginUrl = `${getBaseUrl(req)}/a/${created.token}`;
    return NextResponse.json(
      { staff: serializeStaff(created), loginUrl },
      { status: 201 },
    );
  } catch (error) {
    return jsonError(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await assertStaff(req);
    assertShopOwner(auth);
    const body = await readJson<{ staffId?: string }>(req);
    if (!body.staffId) {
      throw new BookingError("INVALID_INPUT", "staffId is required", 400);
    }
    const shopStaff = await filterStaffForShop(auth.shopId);
    if (!shopStaff.some((row) => row.id === body.staffId)) {
      throw new BookingError("NOT_FOUND", "Staff not found", 404);
    }
    await getStore().deactivateStaff(body.staffId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
