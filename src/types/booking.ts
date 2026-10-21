export type AppointmentStatus =
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show"
  | "left";

export type AppointmentSource = "line" | "phone" | "chat" | "walk_in";

export type StaffBookingSource = "phone" | "chat" | "walk_in";

export type BarberRole = "owner" | "barber";

export interface Barber {
  id: string;
  name: string;
  slot_duration_minutes: number;
  off_days: number[];
  created_at: string;
  line_id?: string | null;
  /** LINE display name captured when the barber claims a link-invite (optional). */
  line_display_name?: string | null;
  role?: BarberRole;
  shop_id?: string | null;
  is_bookable?: boolean;
  is_active?: boolean;
  profile_image_url?: string | null;
  show_profile_in_booking?: boolean;
}

export interface Shop {
  id: string;
  name: string;
  slug: string;
  status: "pending" | "active" | "suspended" | "cancelled";
  subscribed_until: string | null;
  /** Marketing/demo tenant — no LINE pushes, not billed. */
  is_demo?: boolean;
  invite_token?: string | null;
  invite_expires_at?: string | null;
  created_at: string;
  updated_at: string;
  ownerName?: string | null;
}

export interface Appointment {
  id: string;
  barber_id: string;
  customer_ref: string | null;
  customer_name: string;
  customer_phone: string | null;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  created_at: string;
  completed_at?: string | null;
  cancelled_at?: string | null;
  cancel_token?: string | null;
  late_called_at?: string | null;
  customer_line_id?: string | null;
  source?: AppointmentSource;
  /** Snapshot service when marked completed */
  service_id?: string | null;
  /** Snapshot price (THB) when marked completed */
  price_baht?: number | null;
  /** P5: minutes before start for LINE reminder; null = no reminder */
  reminder_lead_minutes?: number | null;
  reminder_due_at?: string | null;
  reminder_sent_at?: string | null;
  /** Customer self-reschedule count (max 1). Shop moves do not increment. */
  reschedule_count?: number;
  /** P8: walk-in created from QR queue (still source = walk_in). */
  via_qr?: boolean;
}

export interface ShopService {
  id: string;
  shop_id: string;
  name: string;
  price_baht: number;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
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
  customerPhone?: string | null;
  customerLineId?: string | null;
  appointmentId?: string;
  /**
   * Real appointment bounds (may differ from grid cell start/end when a
   * walk-in starts mid-slot and spans the next cell).
   */
  appointmentStart?: string;
  appointmentEnd?: string;
  status?: AppointmentStatus;
  source?: AppointmentSource;
  /** P8: walk-in from QR queue */
  viaQr?: boolean;
  isLate?: boolean;
  lateCalledAt?: string | null;
  blockId?: string;
  reason?: string;
  /** Lifetime no-show count for this customer (LINE id or phone) in the shop. */
  noShowCount?: number;
  /** Snapshot when completed (for card + edit price). */
  serviceId?: string | null;
  serviceName?: string | null;
  priceBaht?: number | null;
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
  source?: AppointmentSource;
  /** Preferred reminder lead (minutes); resolved with fallback at create time */
  reminderLeadMinutes?: number | null;
}

export interface CreateStaffBookingInput {
  barberId: string;
  startTime: string;
  source: StaffBookingSource;
  customerName?: string;
  customerPhone?: string;
  /** Optional shortened end when walk-in would collide with the next booking */
  endTime?: string;
  /** P8 QR: LINE user id for queue-ahead push */
  customerLineId?: string | null;
  /** P8: mark appointment as from QR queue */
  viaQr?: boolean;
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
  Nat: "นัท",
};

export function barberLabel(name: string, locale: "th" | "en" = "th"): string {
  if (locale === "en") return name;
  const thai = BARBER_THAI_NAME[name];
  return thai ? `${thai} · ${name}` : name;
}
