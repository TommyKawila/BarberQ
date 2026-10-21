import type { AdminColumn, AdminSlot, Barber } from "@/types/booking";
import type { StaffAuth } from "@/lib/admin-auth";
import { getAdminDay } from "@/lib/services/booking-service";
import { dateISOFromInstant } from "@/lib/services/slot-service";
import type { Shop } from "@/types/booking";

export type PublicDemoSlot = {
  startTime: string;
  endTime: string;
  available: boolean;
  kind: "free" | "booked" | "blocked";
  /** Non-PII label only */
  label: string | null;
};

export type PublicDemoColumn = {
  barber: Pick<Barber, "id" | "name" | "slot_duration_minutes" | "is_bookable">;
  slots: PublicDemoSlot[];
};

function sanitizeSlot(slot: AdminSlot): PublicDemoSlot {
  if (slot.kind === "booked") {
    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: false,
      kind: "booked",
      label: "จองแล้ว",
    };
  }
  if (slot.kind === "blocked") {
    return {
      startTime: slot.startTime,
      endTime: slot.endTime,
      available: false,
      kind: "blocked",
      label: "บล็อก",
    };
  }
  return {
    startTime: slot.startTime,
    endTime: slot.endTime,
    available: true,
    kind: "free",
    label: null,
  };
}

export function sanitizeDemoColumns(columns: AdminColumn[]): PublicDemoColumn[] {
  return columns.map((col) => ({
    barber: {
      id: col.barber.id,
      name: col.barber.name,
      slot_duration_minutes: col.barber.slot_duration_minutes,
      is_bookable: col.barber.is_bookable,
    },
    slots: col.slots.map(sanitizeSlot),
  }));
}

/** Synthetic staff so getAdminDay returns all barber columns. */
export function demoViewerStaff(shopId: string): StaffAuth {
  return {
    staffId: "demo-public-viewer",
    name: "Demo viewer",
    role: "owner",
    barberId: null,
    shopId,
  };
}

export async function loadPublicDemoBoard(
  shop: Shop,
  dateISO?: string,
): Promise<{ date: string; columns: PublicDemoColumn[] }> {
  const date = dateISO && /^\d{4}-\d{2}-\d{2}$/.test(dateISO)
    ? dateISO
    : dateISOFromInstant(new Date());
  const raw = await getAdminDay(date, shop.id, demoViewerStaff(shop.id), new Date(), true);
  return { date, columns: sanitizeDemoColumns(raw) };
}
