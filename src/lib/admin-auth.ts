import { getStore, isPrototypeMode } from "@/lib/data";
import type { StaffRole } from "@/lib/data/types";
import { BookingError } from "@/lib/services/booking-service";

export const ADMIN_TOKEN_KEY = "barberq_admin_token";
const DEFAULT_SHOP_ID = "00000000-0000-0000-0000-000000000001";

export interface StaffAuth {
  staffId: string;
  name: string;
  role: StaffRole;
  barberId: string | null;
  shopId: string;
}

const PROTOTYPE_STAFF: StaffAuth = {
  staffId: "prototype",
  name: "Prototype",
  role: "super_admin",
  barberId: null,
  shopId: DEFAULT_SHOP_ID,
};

export function isAdminAuthRequired(): boolean {
  return !isPrototypeMode();
}

export function getAdminTokenFromRequest(req: Request): string {
  return req.headers.get("x-admin-token") ?? "";
}

export function getAdminLineIdFromRequest(req: Request): string {
  return req.headers.get("x-admin-line-id") ?? "";
}

export async function getStaffFromLineId(lineId: string): Promise<StaffAuth | null> {
  if (!lineId) return null;
  const barber = await getStore().getBarberByLineId(lineId);
  if (!barber || !barber.shop_id) return null;
  const isOwner = barber.role === "owner";
  return {
    staffId: barber.id,
    name: barber.name,
    role: isOwner ? "super_admin" : "barber",
    barberId: isOwner ? null : barber.id,
    shopId: barber.shop_id,
  };
}

export async function getStaffFromToken(token: string): Promise<StaffAuth | null> {
  if (!token) return null;
  const staff = await getStore().getStaffByToken(token);
  if (!staff) return null;
  let shopId = DEFAULT_SHOP_ID;
  if (staff.barberId) {
    const barber = await getStore().getBarber(staff.barberId);
    if (barber?.shop_id) shopId = barber.shop_id;
  }
  return {
    staffId: staff.id,
    name: staff.name,
    role: staff.role,
    barberId: staff.barberId,
    shopId,
  };
}

export async function assertStaff(req: Request): Promise<StaffAuth> {
  const lineId = getAdminLineIdFromRequest(req);
  if (lineId) {
    const staff = await getStaffFromLineId(lineId);
    if (!staff) {
      throw new BookingError("UNAUTHORIZED", "Invalid line id", 401);
    }
    return staff;
  }

  const token = getAdminTokenFromRequest(req);
  if (!token) {
    if (isPrototypeMode()) return PROTOTYPE_STAFF;
    throw new BookingError("UNAUTHORIZED", "Missing token", 401);
  }

  const staff = await getStaffFromToken(token);
  if (!staff) {
    throw new BookingError("UNAUTHORIZED", "Invalid token", 401);
  }

  return staff;
}

export async function assertStaffForShop(
  req: Request,
  shopId: string,
): Promise<StaffAuth> {
  const staff = await assertStaff(req);
  if (staff.shopId !== shopId) {
    throw new BookingError("FORBIDDEN", "Cannot access this shop", 403);
  }
  return staff;
}

export function assertSuperAdmin(staff: StaffAuth): void {
  if (staff.role !== "super_admin") {
    throw new BookingError("FORBIDDEN", "Super admin required", 403);
  }
}

export function canManageBarber(staff: StaffAuth, barberId: string): boolean {
  if (staff.role === "super_admin") return true;
  return staff.barberId === barberId;
}

export async function canManageBarberInShop(
  staff: StaffAuth,
  barberId: string,
  shopId: string,
): Promise<boolean> {
  if (staff.shopId !== shopId) return false;
  if (staff.role === "super_admin") return true;
  if (staff.barberId === barberId) return true;
  const barber = await getStore().getBarber(barberId);
  return barber?.shop_id === shopId && staff.barberId === barberId;
}
