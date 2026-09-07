export type AppointmentStatus = "confirmed" | "cancelled" | "completed" | "no_show";

export type BarberRole = "owner" | "barber";

export interface Barber {
  id: string;
  name: string;
  slot_duration_minutes: number;
  off_days: number[];
  created_at: string;
  line_id?: string | null;
  role?: BarberRole;
  shop_id?: string | null;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  status: "pending" | "active" | "suspended" | "cancelled";
  subscribed_until: string | null;
  invite_token?: string | null;
  invite_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: string;
  barber_id: string;
  customer_ref: string;
  customer_name: string;
  customer_phone: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  created_at: string;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancel_token?: string | null;
  late_called_at?: string | null;
  customer_line_id?: string | null;
}

export interface TimeBlock {
  id: string;
  barber_id: string;
  start_time: string;
  end_time: string;
  reason: string;
  created_at: string;
}

export interface Slot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface BusyInterval {
  start_time: string;
  end_time: string;
}

export type AdminSlotKind = "free" | "booked" | "blocked";

export interface AdminSlot extends Slot {
  kind: AdminSlotKind;
  customerName?: string;
  customerPhone?: string;
  customerLineId?: string | null;
  appointmentId?: string;
  status?: AppointmentStatus;
  isLate?: boolean;
  lateCalledAt?: string | null;
  blockId?: string;
  reason?: string;
}

export interface AdminColumn {
  barber: Barber;
  slots: AdminSlot[];
}

export interface CreateBookingInput {
  barberId: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  customerRef: string;
  customerLineId?: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

export const BARBER_THAI_NAME: Record<string, string> = {
  Saeb: "แสบ",
  Tide: "ไทด์",
  Nat: "นัด",
};

export function barberLabel(name: string, locale: "th" | "en" = "th"): string {
  if (locale === "en") return name;
  const thai = BARBER_THAI_NAME[name];
  return thai ? `${thai} · ${name}` : name;
}
