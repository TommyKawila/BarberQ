import { getStore, isPrototypeMode } from "@/lib/data";
import {
  getBearerToken,
  isLineAuthMockMode,
  MOCK_OWNER_LINE_ID,
  verifyLineAccessToken,
} from "@/lib/auth/line-verify";
import { BookingError } from "@/lib/services/booking-service";
import type { Appointment, Barber } from "@/types/booking";

export const ADMIN_TOKEN_KEY = "barberq_admin_token";
const DEFAULT_SHOP_ID = "00000000-0000-0000-0000-000000000001";

export type ShopStaffRole = "owner" | "barber";

export interface StaffAuth {
  staffId: string;
  name: string;
  role: ShopStaffRole;
  barberId: string | null;
  shopId: string;
  lineId?: string | null;
}

const PROTOTYPE_STAFF: StaffAuth = {
  staffId: "prototype",
  name: "Prototype",
  role: "owner",
  barberId: null,
  shopId: DEFAULT_SHOP_ID,
};

export function isAdminAuthRequired(): boolean {
  return !isPrototypeMode();
}

export function getAdminTokenFromRequest(req: Request): string {
  return req.headers.get("x-admin-token") ?? "";
}

export async function getStaffFromLineId(lineId: string): Promise<StaffAuth | null> {
  if (!lineId) return null;
  const barber = await getStore().getBarberByLineId(lineId);
  if (!barber || !barber.shop_id) return null;
  const role: ShopStaffRole = barber.role === "owner" ? "owner" : "barber";
  return {
    staffId: barber.id,
    name: barber.name,
    role,
    barberId: barber.id,
    shopId: barber.shop_id,
    lineId,
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
  const role: ShopStaffRole = staff.role === "super_admin" ? "owner" : "barber";
  return {
    staffId: staff.id,
    name: staff.name,
    role,
    barberId: staff.barberId,
    shopId,
  };
}

async function getStaffFromBearer(req: Request): Promise<StaffAuth | null> {
  const token = getBearerToken(req);
  if (!token) return null;
  const lineUser = await verifyLineAccessToken(token);
  if (!lineUser) return null;
  return getStaffFromLineId(lineUser.userId);
}

export async function assertStaff(req: Request): Promise<StaffAuth> {
  const fromBearer = await getStaffFromBearer(req);
  if (fromBearer) return fromBearer;

  const legacyToken = getAdminTokenFromRequest(req);
  if (legacyToken) {
    const staff = await getStaffFromToken(legacyToken);
    if (!staff) {
      throw new BookingError("UNAUTHORIZED", "Invalid token", 401);
    }
    return staff;
  }

  if (isPrototypeMode() && isLineAuthMockMode()) {
    const mockToken = getBearerToken(req);
    if (mockToken === MOCK_OWNER_LINE_ID) {
      const staff = await getStaffFromLineId(MOCK_OWNER_LINE_ID);
      if (staff) return staff;
    }
    return PROTOTYPE_STAFF;
  }

  throw new BookingError("UNAUTHORIZED", "Missing authorization", 401);
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

export function assertShopOwner(staff: StaffAuth): void {
  if (staff.role !== "owner") {
    throw new BookingError("FORBIDDEN", "Shop owner required", 403);
  }
}

/** @deprecated Use assertShopOwner for shop-scoped owner checks */
export function assertSuperAdmin(staff: StaffAuth): void {
  assertShopOwner(staff);
}

export async function canManageBarber(
  staff: StaffAuth,
  barberId: string,
): Promise<boolean> {
  if (!staff.shopId) return false;
  const barber = await getStore().getBarber(barberId);
  if (!barber || barber.shop_id !== staff.shopId) return false;
  if (staff.role === "owner") return true;
  return staff.barberId === barberId;
}

export async function assertCanManageBarber(
  staff: StaffAuth,
  barberId: string,
): Promise<Barber> {
  const barber = await getStore().getBarber(barberId);
  if (!barber || barber.shop_id !== staff.shopId) {
    throw new BookingError("BARBER_NOT_FOUND", "Barber not found", 404);
  }
  if (!(await canManageBarber(staff, barberId))) {
    throw new BookingError("FORBIDDEN", "Cannot manage other barbers", 403);
  }
  return barber;
}

export async function assertCanManageAppointment(
  staff: StaffAuth,
  appointmentId: string,
): Promise<{ appointment: Appointment; barber: Barber }> {
  const appointment = await getStore().getAppointment(appointmentId);
  if (!appointment) {
    throw new BookingError("NOT_FOUND", "Appointment not found", 404);
  }
  const barber = await assertCanManageBarber(staff, appointment.barber_id);
  return { appointment, barber };
}

export async function canManageBarberInShop(
  staff: StaffAuth,
  barberId: string,
  shopId: string,
): Promise<boolean> {
  if (staff.shopId !== shopId) return false;
  return canManageBarber(staff, barberId);
}
