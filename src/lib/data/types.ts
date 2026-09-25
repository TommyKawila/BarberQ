import type { Appointment, Barber, BusyInterval, Shop, TimeBlock } from "@/types/booking";
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
  | "INVALID_OUTCOME"
  | "INVITE_NOT_FOUND"
  | "INVITE_EXPIRED"
  | "INVITE_ALREADY_CLAIMED"
  | "INVITE_REVOKED"
  | "LINE_ID_TAKEN"
  | "IDENTITY_INCOMPATIBLE"
  | "MANAGER_ALREADY_ACTIVE"
  | "HAS_FUTURE_BOOKINGS";

export class StoreConflict extends Error {
  readonly code: StoreErrorCode;
  readonly count?: number;

  constructor(code: StoreErrorCode, message?: string, count?: number) {
    super(message ?? code);
    this.name = "StoreConflict";
    this.code = code;
    this.count = count;
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

import type { ShopHours } from "@/lib/shop/shop-hours";

export interface ShopSettings {
  shopId: string;
  logoDataUrl: string | null;
  coverImageUrl: string | null;
  shopName: string | null;
  lineUrl: string | null;
  phone: string | null;
  hours: ShopHours | null;
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
  name?: string;
  lineId?: string | null;
  isBookable?: boolean;
  profileImageUrl?: string | null;
  showProfileInBooking?: boolean;
}

export interface CreateBarberInput {
  shopId: string;
  name: string;
  lineId?: string | null;
  slotDuration?: number;
  isBookable?: boolean;
}

export interface CreateShopInput {
  name: string;
  ownerLineId?: string;
  ownerName?: string;
  subscriptionMonths: number;
}

export interface ClaimOwnerInviteInput {
  inviteToken: string;
  ownerLineId: string;
  ownerName: string;
}

export interface ShopManager {
  id: string;
  shopId: string;
  lineId: string;
  role: "manager";
  displayName: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface ShopManagerInvite {
  id: string;
  shopId: string;
  role: "manager";
  token: string;
  expiresAt: string;
  consumedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  createdByBarberId: string | null;
}

export interface ManagerInvitePreview {
  shopName: string;
  shopSlug: string;
  expired: boolean;
  consumed: boolean;
  revoked: boolean;
}

export interface ClaimManagerInviteInput {
  inviteToken: string;
  lineId: string;
  displayName: string;
}

export interface ClaimManagerResult {
  shopId: string;
  shopSlug: string;
  managerId: string;
}

export interface CreateManagerInviteResult {
  invite: ShopManagerInvite;
}

export interface ShopInvitePreview {
  shopName: string;
  expired: boolean;
  claimed: boolean;
}

export interface ShopOwnerSummary {
  shopId: string;
  name: string;
}

export type {
  CreateLineOaInstallRequestInput,
  LineOaInstallRequest,
  LineOaInstallRequestStatus,
} from "@/lib/onboarding/line-oa-install";

export type {
  CreateTrialLeadInput,
  TrialLead,
  TrialLeadNote,
  TrialLeadStatus,
} from "@/lib/marketing/trial-leads";

import type {
  CreateLineOaInstallRequestInput,
  LineOaInstallRequest,
  LineOaInstallRequestStatus,
} from "@/lib/onboarding/line-oa-install";

import type {
  CreateTrialLeadInput,
  TrialLead,
  TrialLeadNote,
  TrialLeadStatus,
} from "@/lib/marketing/trial-leads";

export interface BookingStore {
  getShopBySlug(slug: string): Promise<Shop | null>;
  listBarbersByShop(shopId: string): Promise<Barber[]>;
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
  getShopSettings(shopId: string): Promise<ShopSettings>;
  setShopSettings(shopId: string, input: Omit<ShopSettings, "shopId">): Promise<void>;
  getStaffByToken(token: string): Promise<Staff | null>;
  listStaff(): Promise<Staff[]>;
  createStaff(input: CreateStaffInput): Promise<Staff>;
  deactivateStaff(staffId: string): Promise<void>;
  updateBarber(barberId: string, input: UpdateBarberInput): Promise<Barber>;
  createBarber(input: CreateBarberInput): Promise<Barber>;
  listRecurringBreaks(barberId: string): Promise<RecurringBreak[]>;
  createRecurringBreak(input: CreateRecurringBreakInput): Promise<RecurringBreak>;
  deleteRecurringBreak(breakId: string): Promise<void>;
  listShops(): Promise<Shop[]>;
  listShopOwners(): Promise<ShopOwnerSummary[]>;
  createShop(input: CreateShopInput): Promise<Shop>;
  getShopInvitePreview(token: string): Promise<ShopInvitePreview | null>;
  regenerateOwnerInvite(shopId: string): Promise<Shop>;
  claimOwnerInvite(input: ClaimOwnerInviteInput): Promise<Shop>;
  listShopManagers(shopId: string): Promise<ShopManager[]>;
  listManagerInvites(shopId: string): Promise<ShopManagerInvite[]>;
  createManagerInvite(shopId: string, createdByBarberId: string | null): Promise<ShopManagerInvite>;
  getManagerInvitePreview(token: string): Promise<ManagerInvitePreview | null>;
  claimManagerInvite(input: ClaimManagerInviteInput): Promise<ClaimManagerResult>;
  regenerateManagerInvite(shopId: string, inviteId: string): Promise<ShopManagerInvite>;
  cancelManagerInvite(shopId: string, inviteId: string): Promise<ShopManagerInvite>;
  revokeShopManager(shopId: string, managerId: string): Promise<ShopManager>;
  getActiveManagerByLineId(lineId: string): Promise<ShopManager | null>;
  getBarberByLineId(lineId: string): Promise<Barber | null>;
  getBarberByLineIdInShop(lineId: string, shopId: string): Promise<Barber | null>;
  unlinkBarberLine(shopId: string, barberId: string): Promise<Barber>;
  deactivateBarber(shopId: string, barberId: string): Promise<Barber>;
  reactivateBarber(shopId: string, barberId: string): Promise<Barber>;
  getLatestLineOaInstallRequest(shopId: string): Promise<LineOaInstallRequest | null>;
  createLineOaInstallRequest(
    shopId: string,
    input: CreateLineOaInstallRequestInput,
  ): Promise<LineOaInstallRequest>;
  listLineOaInstallRequests(): Promise<LineOaInstallRequest[]>;
  updateLineOaInstallRequestStatus(
    id: string,
    status: LineOaInstallRequestStatus,
  ): Promise<LineOaInstallRequest>;
  createTrialLead(input: CreateTrialLeadInput): Promise<TrialLead>;
  listTrialLeads(): Promise<TrialLead[]>;
  updateTrialLeadStatus(id: string, status: TrialLeadStatus): Promise<TrialLead>;
  updateTrialLead(
    id: string,
    patch: { status?: TrialLeadStatus; followUpAt?: string | null },
  ): Promise<TrialLead>;
  listTrialLeadNotes(leadId: string): Promise<TrialLeadNote[]>;
  createTrialLeadNote(leadId: string, body: string): Promise<TrialLeadNote>;
}
