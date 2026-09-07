import type { Appointment, Barber, BusyInterval, TimeBlock } from "@/types/booking";
import type { AppointmentOutcome } from "@/lib/appointment-status";

export type StoreErrorCode =
  | "BARBER_NOT_FOUND"
  | "SLOT_TAKEN"
  | "SLOT_BLOCKED"
  | "NOT_FOUND"
  | "NOT_OWNER"
  | "NOT_CANCELLABLE"
  | "TOO_LATE"
  | "INVALID_RANGE"
  | "INVALID_OUTCOME";

export class StoreConflict extends Error {
  readonly code: StoreErrorCode;

  constructor(code: StoreErrorCode, message?: string) {
    super(message ?? code);
    this.name = "StoreConflict";
    this.code = code;
  }
}

export interface CreateAppointmentInput {
  barberId: string;
  customerRef: string;
  customerName: string;
  customerPhone: string;
  startTime: Date;
  endTime: Date;
  customerLineId?: string;
}

export interface CreateBlockInput {
  barberId: string;
  startTime: Date;
  endTime: Date;
  reason: string;
}

export interface ShopSettings {
  logoDataUrl: string | null;
  shopName: string | null;
  lineUrl: string | null;
  phone: string | null;
}

export type StaffRole = "barber" | "super_admin";

export interface Staff {
  id: string;
  name: string;
  role: StaffRole;
  token: string;
  barberId: string | null;
  active: boolean;
  createdAt: Date;
}

export interface CreateStaffInput {
  name: string;
  role: StaffRole;
  barberId?: string | null;
}

export interface RecurringBreak {
  id: string;
  barberId: string;
  weekday: number;
  startTime: string;
  endTime: string;
  createdAt: Date;
}

export interface CreateRecurringBreakInput {
  barberId: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

export interface UpdateBarberInput {
  offDays?: number[];
  slotDuration?: number;
}

export interface BookingStore {
  listBarbers(): Promise<Barber[]>;
  getBarber(barberId: string): Promise<Barber | null>;
  getBusyIntervals(barberId: string, from: Date, to: Date): Promise<BusyInterval[]>;
  createAppointment(input: CreateAppointmentInput): Promise<Appointment>;
  cancelAppointment(appointmentId: string, customerRef: string): Promise<Appointment>;
  staffCancelAppointment(appointmentId: string): Promise<Appointment>;
  getAppointment(appointmentId: string): Promise<Appointment | null>;
  createBlock(input: CreateBlockInput): Promise<TimeBlock>;
  getBlock(id: string): Promise<TimeBlock | null>;
  removeBlock(id: string): Promise<void>;
  listDayAppointments(from: Date, to: Date): Promise<Appointment[]>;
  listDayBlocks(from: Date, to: Date): Promise<TimeBlock[]>;
  listAppointmentsInRange(from: Date, to: Date): Promise<Appointment[]>;
  markAppointmentOutcome(appointmentId: string, outcome: AppointmentOutcome): Promise<Appointment>;
  cancelAppointmentByToken(token: string): Promise<Appointment>;
  getAppointmentByCancelToken(token: string): Promise<Appointment | null>;
  markLateCalled(appointmentId: string): Promise<Appointment>;
  listCustomerAppointments(customerLineId: string): Promise<Appointment[]>;
  getShopSettings(): Promise<ShopSettings>;
  setShopSettings(input: ShopSettings): Promise<void>;
  getStaffByToken(token: string): Promise<Staff | null>;
  listStaff(): Promise<Staff[]>;
  createStaff(input: CreateStaffInput): Promise<Staff>;
  deactivateStaff(staffId: string): Promise<void>;
  updateBarber(barberId: string, input: UpdateBarberInput): Promise<Barber>;
  listRecurringBreaks(barberId: string): Promise<RecurringBreak[]>;
  createRecurringBreak(input: CreateRecurringBreakInput): Promise<RecurringBreak>;
  deleteRecurringBreak(breakId: string): Promise<void>;
}
