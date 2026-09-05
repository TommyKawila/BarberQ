import type { Appointment, Barber, BusyInterval, TimeBlock } from "@/types/booking";

export type StoreErrorCode =
  | "BARBER_NOT_FOUND"
  | "SLOT_TAKEN"
  | "SLOT_BLOCKED"
  | "NOT_FOUND"
  | "NOT_OWNER"
  | "NOT_CANCELLABLE"
  | "TOO_LATE"
  | "INVALID_RANGE";

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
}

export interface BookingStore {
  listBarbers(): Promise<Barber[]>;
  getBarber(barberId: string): Promise<Barber | null>;
  getBusyIntervals(barberId: string, from: Date, to: Date): Promise<BusyInterval[]>;
  createAppointment(input: CreateAppointmentInput): Promise<Appointment>;
  cancelAppointment(appointmentId: string, customerRef: string): Promise<Appointment>;
  getAppointment(appointmentId: string): Promise<Appointment | null>;
  createBlock(input: CreateBlockInput): Promise<TimeBlock>;
  removeBlock(id: string): Promise<void>;
  listDayAppointments(from: Date, to: Date): Promise<Appointment[]>;
  listDayBlocks(from: Date, to: Date): Promise<TimeBlock[]>;
  getShopSettings(): Promise<ShopSettings>;
  setShopSettings(input: ShopSettings): Promise<void>;
}
