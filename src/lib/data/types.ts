import type {
  Appointment,
  AppointmentSource,
  Barber,
  BarberTierId,
  BusyInterval,
  Shop,
  ShopService,
  TimeBlock,
} from "@/types/booking";
import type { AppointmentOutcome } from "@/lib/appointment-status";
import type {
  CreateShopCancelFeedbackInput,
  ShopCancelFeedback,
} from "@/lib/billing/cancel-feedback";

export type StoreErrorCode =
  | "BARBER_NOT_FOUND"
  | "SLOT_TAKEN"
  | "SLOT_BLOCKED"
  | "NOT_FOUND"
  | "NOT_OWNER"
  | "NOT_CANCELLABLE"
  | "TOO_LATE"
  | "NOT_RESCHEDULABLE"
  | "RESCHEDULE_LIMIT"
  | "INVALID_RANGE"
  | "INVALID_OUTCOME"
  | "INVALID_PRICE"
  | "SERVICE_NOT_FOUND"
  | "INVITE_NOT_FOUND"
  | "INVITE_EXPIRED"
  | "INVITE_ALREADY_CLAIMED"
  | "INVITE_REVOKED"
  | "LINE_ID_TAKEN"
  | "IDENTITY_INCOMPATIBLE"
  | "MANAGER_ALREADY_ACTIVE"
  | "HAS_FUTURE_BOOKINGS"
  | "INVALID_LINE_ID";

export interface MarkOutcomeOptions {
  serviceId?: string | null;
  priceBaht?: number | null;
}

export interface CreateShopServiceInput {
  shopId: string;
  name: string;
  priceBaht: number;
  isDefault?: boolean;
  sortOrder?: number;
}

export interface UpdateShopServiceInput {
  name?: string;
  priceBaht?: number;
  isDefault?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

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
  customerRef?: string | null;
  customerName: string;
  customerPhone?: string | null;
  startTime: Date;
  endTime: Date;
  customerLineId?: string | null;
  source?: AppointmentSource;
  /** P8: QR walk-in marker */
  viaQr?: boolean;
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
  /** P5: customer appointment reminders via LINE push. OFF by default. */
  remindersEnabled: boolean;
  /** Shop default lead time (minutes). Customer may override at booking. */
  reminderLeadMinutes: number;
  /**
   * P5: server-side booking confirmation + queue ticket LINE push after commit.
   * ON by default; shops may turn OFF to save the 300 free messages/month quota.
   */
  bookingConfirmPushEnabled: boolean;
  /**
   * P8: LINE push when a waiting QR customer has exactly 2 ahead.
   * ON by default; shops may turn OFF to save quota.
   */
  queueAheadPushEnabled: boolean;
  /**
   * ClipperQ Brand Guide: show subtle "by ClipperQ" on customer LINE Flex cards.
   * ON by default; shops may turn OFF.
   */
  showFlexBrandFooter: boolean;
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
  lineDisplayName?: string | null;
  isBookable?: boolean;
  profileImageUrl?: string | null;
  showProfileInBooking?: boolean;
}

export interface BarberLineInvite {
  id: string;
  shopId: string;
  barberId: string;
  token: string;
  expiresAt: string;
  consumedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  createdByBarberId: string | null;
}

export interface BarberLineInvitePreview {
  shopName: string;
  shopSlug: string;
  barberName: string;
  expired: boolean;
  consumed: boolean;
  revoked: boolean;
}

export interface ClaimBarberLineInviteInput {
  inviteToken: string;
  lineId: string;
  displayName: string;
}

export interface ClaimBarberLineResult {
  shopId: string;
  shopSlug: string;
  barberId: string;
  barberName: string;
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

export type {
  CreatePaymentSlipInput,
  PaymentSlipStatus,
  ShopPaymentSlip,
} from "@/lib/billing/payment-slips";

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

import type {
  CreatePaymentSlipInput,
  PaymentSlipStatus,
  ShopPaymentSlip,
} from "@/lib/billing/payment-slips";

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
  markAppointmentOutcome(
    appointmentId: string,
    outcome: AppointmentOutcome,
    options?: MarkOutcomeOptions,
  ): Promise<Appointment>;
  updateCompletedAppointmentService(
    appointmentId: string,
    options: { serviceId: string; priceBaht?: number | null },
  ): Promise<Appointment>;
  cancelAppointmentByToken(token: string): Promise<Appointment>;
  getAppointmentByCancelToken(token: string): Promise<Appointment | null>;
  rescheduleAppointmentByToken(
    token: string,
    newBarberId: string,
    newStartTime: Date,
    newEndTime: Date,
  ): Promise<{ before: Appointment; after: Appointment }>;
  staffRescheduleAppointment(
    appointmentId: string,
    newBarberId: string,
    newStartTime: Date,
    newEndTime: Date,
  ): Promise<{ before: Appointment; after: Appointment }>;
  markLateCalled(appointmentId: string): Promise<Appointment>;
  listCustomerAppointments(customerLineId: string): Promise<Appointment[]>;
  getShopSettings(shopId: string): Promise<ShopSettings>;
  setShopSettings(shopId: string, input: Omit<ShopSettings, "shopId">): Promise<void>;
  listShopServices(shopId: string, opts?: { includeInactive?: boolean }): Promise<ShopService[]>;
  createShopService(input: CreateShopServiceInput): Promise<ShopService>;
  updateShopService(serviceId: string, shopId: string, input: UpdateShopServiceInput): Promise<ShopService>;
  getDefaultShopService(shopId: string): Promise<ShopService | null>;
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
  /** Superadmin soft seat-tier update (never blocks shop usage). */
  updateShopBarberTier(shopId: string, tier: BarberTierId): Promise<Shop>;
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
  createBarberLineInvite(
    shopId: string,
    barberId: string,
    createdByBarberId: string | null,
  ): Promise<BarberLineInvite>;
  getPendingBarberLineInvite(
    shopId: string,
    barberId: string,
  ): Promise<BarberLineInvite | null>;
  getBarberLineInvitePreview(token: string): Promise<BarberLineInvitePreview | null>;
  claimBarberLineInvite(input: ClaimBarberLineInviteInput): Promise<ClaimBarberLineResult>;
  cancelBarberLineInvite(
    shopId: string,
    barberId: string,
    inviteId: string,
  ): Promise<BarberLineInvite>;
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
  createShopCancelFeedback(
    input: CreateShopCancelFeedbackInput,
  ): Promise<ShopCancelFeedback>;
  listShopCancelFeedback(): Promise<ShopCancelFeedback[]>;
  createPaymentSlip(input: CreatePaymentSlipInput): Promise<ShopPaymentSlip>;
  listPaymentSlipsByShop(shopId: string): Promise<ShopPaymentSlip[]>;
  listPaymentSlips(status?: PaymentSlipStatus): Promise<ShopPaymentSlip[]>;
  getPaymentSlip(id: string): Promise<ShopPaymentSlip | null>;
  reviewPaymentSlip(
    id: string,
    status: Exclude<PaymentSlipStatus, "pending">,
    reviewedNote?: string | null,
  ): Promise<{ slip: ShopPaymentSlip; shop: Shop }>;
  extendShopSubscribedUntil(shopId: string, until: Date): Promise<Shop>;
}
