"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { addDays } from "date-fns";
import { enUS, th } from "date-fns/locale";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { RefreshCw } from "lucide-react";
import { AdminContentSkeleton } from "@/components/admin/AdminContentSkeleton";
import { AdminShell } from "@/components/admin/AdminShell";
import {
  BookedSlotActionsSheet,
  type BookedSlotSheetAction,
} from "@/components/admin/BookedSlotActionsSheet";
import {
  CompleteServicePicker,
  type CompleteServiceChoice,
} from "@/components/admin/CompleteServicePicker";
import { BlockTimeSheet } from "@/components/admin/BlockTimeSheet";
import { QuickBlockGrid } from "@/components/admin/QuickBlockGrid";
import { QrWaitingRow } from "@/components/admin/QrWaitingRow";
import { StaffBookingSheet } from "@/components/admin/StaffBookingSheet";
import { TodayQueueCards } from "@/components/admin/TodayQueueCards";
import { UnblockConfirmSheet } from "@/components/admin/UnblockConfirmSheet";
import { WhoIsFreeSheet } from "@/components/admin/WhoIsFreeSheet";
import {
  blockRangeFromColumn,
  type BlockReasonCode,
} from "@/lib/admin/block-time";
import { shouldPromptServicePicker } from "@/lib/admin/complete-service-picker";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { useToast } from "@/components/ui/ToastProvider";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { useAdminTodayDerived } from "@/lib/admin/use-admin-today-derived";
import {
  describeWhoIsFreeEmpty,
  nextShopOpenLabel,
  type FreeBarberNow,
} from "@/lib/admin/free-barbers";
import {
  staffBookingErrorMessage,
  walkInAssessmentMessage,
  walkInDisabledLabel,
  walkInShopBannerLabel,
} from "@/lib/admin/staff-booking-errors";
import {
  assessWalkInQuick,
  findNextFreeBoardSlot,
  walkInDisabledReason,
  type WalkInOffer,
} from "@/lib/admin/walk-in-quick";
import { isShopOperatorRole } from "@/lib/admin-auth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { buildShopLiffUrl, buildShopWebUrl } from "@/lib/line/liff-url";
import type { ShopActivation } from "@/lib/onboarding/activation";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { normalizeShopHours, type ShopHours } from "@/lib/shop/shop-hours";
import {
  dateISOFromInstant,
  formatSlotTime,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import type {
  AdminColumn,
  AdminSlot,
  ShopService,
  StaffBookingSource,
} from "@/types/booking";

type BoardTab = "queue" | "schedule";
type ThumbIntent = "walk_in" | "block";

interface ApiError {
  error?: {
    code?: string;
    message?: string;
    canShortenUntil?: string;
    nextConflictAt?: string;
  };
}

export default function AdminPage() {
  const { locale, t } = useI18n();
  const { shopApi, shopPath, shopSlug } = useShopSlug();
  const { ready, profile, error: authError, authHeaders } = useAdminPageAuth();
  const toast = useToast();
  const online = useOnlineStatus();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [boardTab, setBoardTab] = useState<BoardTab>("queue");
  const [thumbIntent, setThumbIntent] = useState<ThumbIntent>("walk_in");
  const [columns, setColumns] = useState<AdminColumn[]>([]);
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [pendingKind, setPendingKind] = useState<"walk_in" | "booking" | "block" | null>(null);
  const [actionsSheet, setActionsSheet] = useState<{
    barberId: string;
    barberName: string;
    slot: AdminSlot;
  } | null>(null);
  const [shopServices, setShopServices] = useState<ShopService[]>([]);
  const [servicePicker, setServicePicker] = useState<{
    mode: "complete" | "change";
    barberId: string;
    slot: AdminSlot;
  } | null>(null);
  const [outcomePendingKey, setOutcomePendingKey] = useState<string | null>(null);
  const [latePendingKey, setLatePendingKey] = useState<string | null>(null);
  const [cancelPendingKey, setCancelPendingKey] = useState<string | null>(null);
  const [reschedulePendingKey, setReschedulePendingKey] = useState<string | null>(null);
  const [rescheduleFrom, setRescheduleFrom] = useState<{
    appointmentId: string;
    customerName: string;
    customerLineId?: string | null;
  } | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<{
    barberId: string;
    slot: AdminSlot;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bookingLinkCopied, setBookingLinkCopied] = useState(false);
  const [activation, setActivation] = useState<ShopActivation | null>(null);
  const [bookingUrl, setBookingUrl] = useState("");
  const [lineQuotaFull, setLineQuotaFull] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [shopHours, setShopHours] = useState<ShopHours>(() => normalizeShopHours(null));
  const [dateISO, setDateISO] = useState(() => dateISOFromInstant(new Date()));
  const [showClosedQueue, setShowClosedQueue] = useState(false);
  const [sheet, setSheet] = useState<{
    barberId: string;
    barberName: string;
    slot: AdminSlot;
    shortenUntil?: string | null;
  } | null>(null);
  const [whoFreeOpen, setWhoFreeOpen] = useState(false);
  const [blockSheet, setBlockSheet] = useState<{
    barberId: string;
    barberName: string;
    initialStartISO?: string | null;
    freeUntilISO?: string | null;
  } | null>(null);
  const [unblockSheet, setUnblockSheet] = useState<{
    barberId: string;
    barberName: string;
    blockId: string;
    startTime: string;
    endTime: string;
  } | null>(null);
  /** Second-tap Walk-in target after a busy / next-free offer. */
  const [walkInOffer, setWalkInOffer] = useState<WalkInOffer | null>(null);
  const todayISO = dateISOFromInstant(new Date());
  const isToday = dateISO === todayISO;
  const dateLocale = locale === "th" ? th : enUS;
  const displayDateShort = useMemo(
    () =>
      formatInTimeZone(
        fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE),
        SHOP_TIMEZONE,
        locale === "th" ? "EEE d MMM" : "EEE d MMM",
        { locale: dateLocale },
      ),
    [dateISO, dateLocale, locale],
  );
  // Unconditional — never after auth early-return (React #310).
  const { freeNow, mini, hasBookingsToday, setupIncomplete } = useAdminTodayDerived(
    columns,
    isToday,
    activation,
  );
  const whoIsFreeEmpty = useMemo(
    () => describeWhoIsFreeEmpty(columns, shopHours, new Date()),
    [columns, shopHours, lastUpdated],
  );

  function shiftDay(days: number) {
    const noon = fromZonedTime(`${dateISO}T12:00:00`, SHOP_TIMEZONE);
    setDateISO(dateISOFromInstant(addDays(noon, days)));
  }

  const loadDay = useCallback(async () => {
    try {
      const params = new URLSearchParams({ date: dateISO });
      if (showClosedQueue) params.set("includeClosed", "1");
      const res = await fetch(shopApi(`/block?${params.toString()}`), {
        headers: authHeaders,
      });
      const json = (await res.json()) as {
        columns?: AdminColumn[];
      } & ApiError;
      if (!res.ok) {
        const msg = json.error?.message ?? t("admin.loadFailed");
        setError(msg);
        if (json.error?.code === "FORBIDDEN") toast.error(t("admin.toast.noPermission"));
        else toast.error(t("admin.toast.refreshFailed"));
        return;
      }
      setError(null);
      setColumns(json.columns ?? []);
      setLastUpdated(new Date());
    } catch {
      setError(t("admin.networkError"));
      toast.error(t("admin.toast.refreshFailed"));
    }
  }, [authHeaders, dateISO, shopApi, showClosedQueue, t, toast]);

  useEffect(() => {
    if (!ready || !profile) return;
    void fetch(shopApi("/services"), { headers: authHeaders })
      .then(async (res) => {
        if (!res.ok) return;
        const json = (await res.json()) as { services?: ShopService[] };
        setShopServices(json.services ?? []);
      })
      .catch(() => {});
  }, [authHeaders, profile, ready, shopApi]);

  useEffect(() => {
    if (!ready || !profile || !isShopOperatorRole(profile.role)) return;
    void fetch(shopApi("/setup"), { headers: authHeaders })
      .then(async (res) => {
        if (!res.ok) return;
        const json = (await res.json()) as {
          activation?: ShopActivation;
          bookingUrl?: string;
        };
        setActivation(json.activation ?? null);
        setBookingUrl(json.bookingUrl ?? buildShopLiffUrl(shopSlug) ?? buildShopWebUrl(shopSlug));
      })
      .catch(() => {});
    void Promise.all([
      fetch(shopApi("/line-quota"), { headers: authHeaders }),
      fetch(shopApi("/settings"), { headers: authHeaders }),
    ])
      .then(async ([quotaRes, settingsRes]) => {
        if (quotaRes.ok) {
          const q = (await quotaRes.json()) as { quota?: { level?: string } };
          setLineQuotaFull(q.quota?.level === "full");
        }
        if (settingsRes.ok) {
          const s = (await settingsRes.json()) as {
            remindersEnabled?: boolean;
            hours?: ShopHours | null;
          };
          setRemindersEnabled(Boolean(s.remindersEnabled));
          if (s.hours) setShopHours(normalizeShopHours(s.hours));
        }
      })
      .catch(() => {});
  }, [authHeaders, profile, ready, shopApi, shopSlug]);

  useEffect(() => {
    if (!ready || !profile) return;
    let cancelled = false;

    async function refresh() {
      if (cancelled || document.hidden) return;
      await loadDay();
    }

    void refresh();
    const timer = window.setInterval(() => {
      void refresh();
    }, 10_000);

    function onVisible() {
      if (!document.hidden) void refresh();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [loadDay, profile, ready]);

  function openSheetForSlot(barberId: string, slot: AdminSlot) {
    const column = columns.find((c) => c.barber.id === barberId);
    setSheet({
      barberId,
      barberName: column?.barber.name ?? "",
      slot,
      shortenUntil: null,
    });
  }

  function barberNameFor(barberId: string): string {
    return columns.find((c) => c.barber.id === barberId)?.barber.name ?? "";
  }

  function showActionError(msg: string) {
    setError(msg);
    toast.error(msg);
  }

  async function createStaffBooking(
    input: {
      barberId: string;
      startTime: string;
      endTime?: string;
      source: StaffBookingSource;
      customerName?: string;
      customerPhone?: string;
    },
    opts?: {
      /** UI pending key (sheet slot may differ from snapped walk-in startTime). */
      uiKey?: string;
      kind?: "walk_in" | "booking";
      /** Parent already set pendingKey (e.g. before walk-in gate). */
      alreadyPending?: boolean;
    },
  ) {
    const key = opts?.uiKey ?? `${input.barberId}:${input.startTime}`;
    const kind = opts?.kind ?? (input.source === "walk_in" ? "walk_in" : "booking");
    if (!opts?.alreadyPending) {
      setPendingKey(key);
      setPendingKind(kind);
    }
    setError(null);
    const headers: HeadersInit = { "Content-Type": "application/json", ...authHeaders };
    try {
      const res = await fetch(shopApi("/staff-bookings"), {
        method: "POST",
        headers,
        body: JSON.stringify(input),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        if (json.error?.canShortenUntil && sheet) {
          setSheet({ ...sheet, shortenUntil: json.error.canShortenUntil });
          return;
        }
        const column = columns.find((c) => c.barber.id === input.barberId);
        const next =
          column && (json.error?.code === "SLOT_TAKEN" || json.error?.code === "SLOT_BLOCKED")
            ? findNextFreeBoardSlot(column, new Date().getTime())
            : null;
        if (next && input.source === "walk_in") {
          setWalkInOffer({ barberId: input.barberId, startTime: next.startTime });
        } else {
          setWalkInOffer(null);
        }
        const msg = staffBookingErrorMessage(json.error?.code, t, {
          barberName: barberNameFor(input.barberId),
          timeLabel: formatSlotTime(input.startTime),
          nextFreeLabel: next ? formatSlotTime(next.startTime) : undefined,
          openLabel: json.error?.code === "SHOP_CLOSED" ? nextShopOpenHint() : undefined,
        });
        showActionError(msg);
        if (json.error?.code === "FORBIDDEN") toast.error(t("admin.toast.noPermission"));
        else if (json.error?.code?.includes("LINE")) toast.error(t("admin.toast.lineSendFailed"));
        return;
      }
      setSheet(null);
      setWalkInOffer(null);
      toast.success(
        input.source === "walk_in" ? t("admin.toast.walkInQueued") : t("admin.toast.success"),
      );
      // Don't await board refetch — clear pending immediately so tap feels snappy.
      void loadDay();
    } catch {
      showActionError(t("admin.networkError"));
    } finally {
      setPendingKey(null);
      setPendingKind(null);
    }
  }

  function nextShopOpenHint(): string | undefined {
    return nextShopOpenLabel(shopHours, new Date()) ?? undefined;
  }

  async function onBlockRange(input: {
    barberId: string;
    startTime: string;
    endTime: string;
    reason: BlockReasonCode;
  }) {
    const key = `${input.barberId}:${input.startTime}`;
    setPendingKey(key);
    setPendingKind("block");
    setError(null);
    setWalkInOffer(null);
    const headers: HeadersInit = { "Content-Type": "application/json", ...authHeaders };
    try {
      const res = await fetch(shopApi("/block"), {
        method: "POST",
        headers,
        body: JSON.stringify({
          barberId: input.barberId,
          startTime: input.startTime,
          endTime: input.endTime,
          reason: input.reason,
        }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        toast.error(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setSheet(null);
      setBlockSheet(null);
      toast.success(t("admin.toast.blocked"));
      void loadDay();
    } catch {
      setError(t("admin.updateFailed"));
      toast.error(t("admin.updateFailed"));
    } finally {
      setPendingKey(null);
      setPendingKind(null);
    }
  }

  function requestUnblock(barberId: string, slot: AdminSlot) {
    if (!slot.blockId) return;
    const column = columns.find((c) => c.barber.id === barberId);
    const range = column
      ? blockRangeFromColumn(column, slot.blockId)
      : { startTime: slot.startTime, endTime: slot.endTime };
    if (!range) return;
    const barberName =
      column?.barber.name ?? barberNameFor(barberId);
    setUnblockSheet({
      barberId,
      barberName,
      blockId: slot.blockId,
      startTime: range.startTime,
      endTime: range.endTime,
    });
  }

  async function confirmUnblock() {
    if (!unblockSheet) return;
    const key = `${unblockSheet.barberId}:${unblockSheet.startTime}`;
    setPendingKey(key);
    setPendingKind("block");
    setError(null);
    try {
      const res = await fetch(shopApi("/block"), {
        method: "DELETE",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ id: unblockSheet.blockId }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        toast.error(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setUnblockSheet(null);
      toast.success(t("admin.toast.unblocked"));
      void loadDay();
    } catch {
      setError(t("admin.updateFailed"));
      toast.error(t("admin.updateFailed"));
    } finally {
      setPendingKey(null);
      setPendingKind(null);
    }
  }

  async function onOutcome(
    _barberId: string,
    slot: AdminSlot,
    outcome: "completed" | "no_show" | "left",
    options?: { serviceId?: string; priceBaht?: number },
  ): Promise<boolean> {
    if (!profile || !slot.appointmentId) return false;
    const key = `${_barberId}:${slot.startTime}`;
    setOutcomePendingKey(key);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${slot.appointmentId}/outcome`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          outcome,
          serviceId: options?.serviceId,
          priceBaht: options?.priceBaht,
        }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        if (json.error?.code === "FORBIDDEN") toast.error(t("admin.toast.noPermission"));
        else if (json.error?.code?.includes("LINE")) toast.error(t("admin.toast.lineSendFailed"));
        return false;
      }
      toast.success(t("admin.toast.success"));
      await loadDay();
      return true;
    } catch {
      setError(t("admin.networkError"));
      return false;
    } finally {
      setOutcomePendingKey(null);
    }
  }

  function requestComplete(barberId: string, slot: AdminSlot) {
    if (shouldPromptServicePicker(shopServices)) {
      setServicePicker({ mode: "complete", barberId, slot });
      return;
    }
    void onOutcome(barberId, slot, "completed");
  }

  async function onChangeCompletedService(
    slot: AdminSlot,
    choice: CompleteServiceChoice,
  ) {
    if (!profile || !slot.appointmentId) return;
    const key = `${slot.appointmentId}:service`;
    setOutcomePendingKey(key);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${slot.appointmentId}/service`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          serviceId: choice.serviceId,
          priceBaht: choice.priceBaht,
        }),
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        toast.error(t("admin.updateFailed"));
        return;
      }
      toast.success(t("admin.toast.success"));
      setServicePicker(null);
      await loadDay();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setOutcomePendingKey(null);
    }
  }

  async function onLateCalled(_barberId: string, slot: AdminSlot) {
    if (!profile || !slot.appointmentId) return;
    const key = `${_barberId}:${slot.startTime}`;
    setLatePendingKey(key);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${slot.appointmentId}/late-called`, {
        method: "PATCH",
        headers: authHeaders,
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      await loadDay();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setLatePendingKey(null);
    }
  }

  async function onCancel(_barberId: string, slot: AdminSlot) {
    if (!profile || !slot.appointmentId) return;
    const key = `${_barberId}:${slot.startTime}`;
    setCancelPendingKey(key);
    setError(null);
    try {
      const res = await fetch(`/api/appointments/${slot.appointmentId}/cancel`, {
        method: "PATCH",
        headers: authHeaders,
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      await loadDay();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setCancelPendingKey(null);
    }
  }

  function onRescheduleStart(_barberId: string, slot: AdminSlot) {
    if (!slot.appointmentId) return;
    setRescheduleFrom({
      appointmentId: slot.appointmentId,
      customerName: slot.customerName ?? "ลูกค้า",
      customerLineId: slot.customerLineId,
    });
    setRescheduleTarget(null);
    setError(null);
    setWalkInOffer(null);
  }

  async function confirmStaffReschedule() {
    if (!profile || !rescheduleFrom || !rescheduleTarget) return;
    const key = `${rescheduleTarget.barberId}:${rescheduleTarget.slot.startTime}`;
    setReschedulePendingKey(key);
    setError(null);
    try {
      const res = await fetch(
        `/api/appointments/${rescheduleFrom.appointmentId}/reschedule`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json", ...authHeaders },
          body: JSON.stringify({
            barberId: rescheduleTarget.barberId,
            startTime: rescheduleTarget.slot.startTime,
          }),
        },
      );
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setRescheduleFrom(null);
      setRescheduleTarget(null);
      await loadDay();
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setReschedulePendingKey(null);
    }
  }

  function handleFreeSlot(barberId: string, slot: AdminSlot) {
    if (rescheduleFrom) {
      setRescheduleTarget({ barberId, slot });
      return;
    }
    openSheetForSlot(barberId, slot);
  }

  function onWalkInQuick(barberId: string) {
    setError(null);
    const column = columns.find((c) => c.barber.id === barberId);
    const assessment = assessWalkInQuick(column, shopHours, new Date(), walkInOffer);

    if (assessment.kind !== "ok") {
      if (assessment.kind === "busy") {
        const msg = walkInAssessmentMessage(assessment, t);
        setWalkInOffer({
          barberId: assessment.barberId,
          startTime: assessment.nextFreeStartTime,
        });
        setError(msg);
        toast.warning(msg);
        return;
      }
      // Hours / off-day: same short Thai copy as the visible grid label (iPad).
      const gated =
        assessment.kind === "shop_before_open" ||
        assessment.kind === "shop_after_close" ||
        assessment.kind === "shop_closed_day" ||
        assessment.kind === "barber_off";
      const msg = gated
        ? walkInDisabledLabel(assessment, t)
        : walkInAssessmentMessage(assessment, t);
      setWalkInOffer(null);
      showActionError(msg);
      return;
    }

    setWalkInOffer(null);
    void createStaffBooking({
      barberId: assessment.barberId,
      startTime: assessment.startTime,
      source: "walk_in",
    });
  }

  function walkInButtonDisabledReason(barberId: string): string | null {
    const column = columns.find((c) => c.barber.id === barberId);
    const gate = walkInDisabledReason(column, shopHours, new Date());
    if (!gate) return null;
    return walkInDisabledLabel(gate, t);
  }

  const walkInShopBanner = useMemo(() => {
    if (!profile) return null;
    const editableId = isShopOperatorRole(profile.role) ? null : profile.barberId;
    const assessments = columns
      .filter((c) => editableId == null || c.barber.id === editableId)
      .map((c) => assessWalkInQuick(c, shopHours, new Date(), null));
    return walkInShopBannerLabel(assessments, t);
  }, [columns, shopHours, lastUpdated, t, profile]);

  function onWhoIsFree() {
    setWhoFreeOpen(true);
  }

  function onPickFreeBarber(row: FreeBarberNow, intent: ThumbIntent = thumbIntent) {
    setWhoFreeOpen(false);
    if (intent === "block") {
      setBlockSheet({
        barberId: row.barberId,
        barberName: row.barberName,
        initialStartISO: row.slot.startTime,
        freeUntilISO: row.freeUntil,
      });
      return;
    }
    setSheet({
      barberId: row.barberId,
      barberName: row.barberName,
      slot: row.slot,
      shortenUntil: null,
    });
  }

  function handleBookedSheetAction(action: BookedSlotSheetAction) {
    if (!actionsSheet) return;
    const { barberId, slot } = actionsSheet;
    if (action === "cancel") {
      void onCancel(barberId, slot);
      setActionsSheet(null);
      return;
    }
    if (action === "reschedule") {
      onRescheduleStart(barberId, slot);
      setActionsSheet(null);
      return;
    }
    if (action === "late_called") {
      void onLateCalled(barberId, slot);
      setActionsSheet(null);
      return;
    }
    if (action === "change_service") {
      setActionsSheet(null);
      setServicePicker({ mode: "change", barberId, slot });
      return;
    }
    if (action === "completed") {
      setActionsSheet(null);
      requestComplete(barberId, slot);
      return;
    }
    if (action === "no_show" || action === "left") {
      void onOutcome(barberId, slot, action);
      setActionsSheet(null);
    }
  }

  if (!ready || !profile) {
    return (
      <AdminShell role="owner">
        <AdminContentSkeleton />
        {authError ? (
          <p className="px-4 text-sm text-red-400">{authError}</p>
        ) : null}
      </AdminShell>
    );
  }

  const isOperator = isShopOperatorRole(profile.role);
  const editableBarberId = isOperator ? null : profile.barberId;

  async function copyBookingLink() {
    const url = bookingUrl || buildShopLiffUrl(shopSlug) || buildShopWebUrl(shopSlug);
    await navigator.clipboard.writeText(url);
    setBookingLinkCopied(true);
    toast.success(t("admin.toast.copyBookingLink"));
    window.setTimeout(() => setBookingLinkCopied(false), 2000);
  }

  const thumbBar = isOperator ? (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => {
          setThumbIntent("block");
          setWhoFreeOpen(true);
        }}
        className="cq-press flex min-h-12 flex-1 items-center justify-center gap-1 rounded-xl border border-zinc-600 text-sm font-medium text-zinc-100"
      >
        🚫 {t("admin.staffBook.blockTime")}
      </button>
      <button
        type="button"
        onClick={() => {
          setThumbIntent("walk_in");
          // Always open the picker so it matches Today cards (never skip when freeNow is nonempty)
          setWhoFreeOpen(true);
        }}
        className="cq-press flex min-h-12 flex-[1.2] items-center justify-center rounded-xl bg-amber-400 text-sm font-semibold text-zinc-950"
      >
        + Walk-in
      </button>
    </div>
  ) : undefined;

  return (
    <AdminShell role={profile.role} thumbBar={thumbBar}>
      <div
        className={`flex flex-col gap-3 px-3 py-3${
          rescheduleFrom || thumbBar ? " pb-28 lg:pb-4" : ""
        }`}
      >
        <header className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <button
              type="button"
              onClick={() => shiftDay(-1)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-zinc-300"
              aria-label={t("admin.prevDay")}
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => setDateISO(todayISO)}
              className="min-h-11 truncate rounded-xl px-1 text-left text-sm text-zinc-200"
            >
              <span className="font-medium">
                {displayDateShort}
                {isToday ? ` · ${t("admin.today")}` : ""}
              </span>
              {lastUpdated ? (
                <span className="ml-1 text-xs text-zinc-500">
                  · {formatInTimeZone(lastUpdated, SHOP_TIMEZONE, "HH:mm")}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => shiftDay(1)}
              className="flex min-h-11 min-w-11 items-center justify-center rounded-xl text-zinc-300"
              aria-label={t("admin.nextDay")}
            >
              ›
            </button>
          </div>
          <button
            type="button"
            onClick={() => void loadDay()}
            aria-label={t("admin.refresh")}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-full border border-zinc-700 text-zinc-200"
          >
            <RefreshCw size={18} />
          </button>
        </header>

        <OfflineBanner message={t("admin.offlineBanner")} visible={!online} />

        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            <SegmentedControl
              ariaLabel={t("admin.nav.board")}
              value={boardTab}
              onChange={setBoardTab}
              options={[
                { value: "queue" as const, label: t("admin.segmentQueue") },
                { value: "schedule" as const, label: t("admin.segmentSchedule") },
              ]}
            />
          </div>
          <p className="shrink-0 text-xs tabular-nums text-zinc-400">
            {t("admin.miniRemainDone")
              .replace("{remain}", String(mini.remaining))
              .replace("{done}", String(mini.done))}
          </p>
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {isOperator && remindersEnabled && lineQuotaFull ? (
          <div className="rounded-xl border border-red-500/50 bg-red-950/40 p-4">
            <p className="text-sm font-medium text-red-100">{t("admin.reminderBoardBannerTitle")}</p>
            <Link
              href={shopPath("/admin/settings/line/quota")}
              className="mt-3 flex min-h-11 items-center justify-center rounded-lg bg-amber-400 text-sm font-semibold text-zinc-950"
            >
              {t("admin.reminderBoardBannerCta")}
            </Link>
          </div>
        ) : null}
        {rescheduleFrom ? (
          <div
            className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-500/50 bg-zinc-950/95 p-4 pb-8 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] sm:inset-x-auto sm:left-1/2 sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:rounded-t-2xl"
            data-testid="admin-reschedule-banner"
            role="status"
          >
            <p className="text-sm font-medium text-amber-100">
              {t("admin.rescheduleModeBanner").replace(
                "{name}",
                rescheduleFrom.customerName,
              )}
            </p>
            <button
              type="button"
              onClick={() => {
                setRescheduleFrom(null);
                setRescheduleTarget(null);
              }}
              className="mt-3 min-h-11 w-full rounded-xl border border-zinc-600 text-sm text-zinc-200"
            >
              {t("admin.rescheduleModeCancel")}
            </button>
          </div>
        ) : null}
        {isOperator && setupIncomplete ? (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
            <p className="text-sm font-medium text-amber-200">{t("admin.onboardingChecklistTitle")}</p>
            <ul className="mt-2 space-y-1 text-sm text-amber-100/90">
              {!activation?.teamOk ? <li>• {t("onboarding.noBookableBarber")}</li> : null}
              {!activation?.hoursOk ? <li>• {t("onboarding.noHours")}</li> : null}
              {activation && !activation.ready && activation.teamOk && activation.hoursOk ? (
                <li>• {t("onboarding.bannerIncomplete")}</li>
              ) : null}
            </ul>
            <Link
              href={shopPath(
                !activation?.teamOk
                  ? "/admin/setup?step=team"
                  : !activation?.hoursOk
                    ? "/admin/setup?step=hours"
                    : "/admin/setup",
              )}
              className="mt-3 flex min-h-11 items-center justify-center rounded-lg bg-amber-400 text-sm font-semibold text-zinc-950"
            >
              {t("onboarding.bannerCta")}
            </Link>
          </div>
        ) : null}
        {isOperator && isToday && !hasBookingsToday && activation?.ready && boardTab === "queue" ? (
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm">
            <p className="text-zinc-300">{t("onboarding.noBookingsToday")}</p>
            <button
              type="button"
              onClick={() => void copyBookingLink()}
              className="mt-2 min-h-11 w-full rounded-lg border border-zinc-600 text-sm font-semibold text-zinc-100"
            >
              {bookingLinkCopied ? t("admin.toast.copyBookingLink") : t("onboarding.copyLink")}
            </button>
          </div>
        ) : null}

        {boardTab === "queue" ? (
          <>
            <TodayQueueCards
              columns={columns}
              shopHours={shopHours}
              editableBarberId={editableBarberId}
              outcomePendingKey={outcomePendingKey}
              latePendingKey={latePendingKey}
              onWalkInBarber={(id) => onWalkInQuick(id)}
              onOutcome={(id, slot, outcome) => {
                if (outcome === "completed") requestComplete(id, slot);
                else void onOutcome(id, slot, outcome);
              }}
              onLateOrNoShow={(id, slot) => {
                const col = columns.find((c) => c.barber.id === id);
                setActionsSheet({
                  barberId: id,
                  barberName: col?.barber.name ?? "",
                  slot,
                });
              }}
              onOpenNext={(id, slot) => {
                const col = columns.find((c) => c.barber.id === id);
                setActionsSheet({
                  barberId: id,
                  barberName: col?.barber.name ?? "",
                  slot,
                });
              }}
            />
            {isToday ? (
              <QrWaitingRow
                shopApi={shopApi}
                authHeaders={authHeaders}
                enabled={Boolean(profile)}
                onStarted={() => void loadDay()}
              />
            ) : null}
          </>
        ) : (
          <QuickBlockGrid
            columns={columns}
            pendingKey={pendingKey}
            outcomePendingKey={outcomePendingKey}
            latePendingKey={latePendingKey}
            cancelPendingKey={cancelPendingKey}
            editableBarberId={editableBarberId}
            onFreeSlot={(id, slot) => handleFreeSlot(id, slot)}
            onWalkInQuick={(id) => onWalkInQuick(id)}
            walkInDisabledReason={walkInButtonDisabledReason}
            walkInShopBanner={walkInShopBanner}
            onOutcome={(id, slot, outcome) => {
              if (outcome === "completed") requestComplete(id, slot);
              else void onOutcome(id, slot, outcome);
            }}
            onChangeService={(id, slot) =>
              setServicePicker({ mode: "change", barberId: id, slot })
            }
            onLateCalled={(id, slot) => void onLateCalled(id, slot)}
            onCancel={(id, slot) => void onCancel(id, slot)}
            onRescheduleStart={(id, slot) => onRescheduleStart(id, slot)}
            onUnblock={(id, slot) => requestUnblock(id, slot)}
            reschedulePickMode={Boolean(rescheduleFrom)}
            bookingHref={shopPath("/")}
            onCopyBookingLink={() => void copyBookingLink()}
            bookingLinkCopied={bookingLinkCopied}
          />
        )}
        {rescheduleTarget && rescheduleFrom ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
            <button
              type="button"
              aria-label={t("common.cancel")}
              className="absolute inset-0"
              onClick={() => setRescheduleTarget(null)}
              disabled={Boolean(reschedulePendingKey)}
            />
            <div
              role="dialog"
              aria-modal="true"
              className="relative z-10 w-full max-w-md rounded-t-2xl bg-zinc-950 px-4 pb-8 pt-4 shadow-xl sm:rounded-2xl"
              data-testid="admin-reschedule-confirm"
            >
              <h2 className="text-base font-semibold">{t("admin.confirmRescheduleTitle")}</h2>
              <p className="mt-2 text-sm text-zinc-300">
                {rescheduleFrom.customerLineId?.trim()
                  ? t("admin.confirmRescheduleBodyLine")
                  : t("admin.confirmRescheduleBodyNoLine")}
              </p>
              <button
                type="button"
                disabled={Boolean(reschedulePendingKey)}
                onClick={() => void confirmStaffReschedule()}
                className="mt-4 min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
              >
                {t("admin.confirmRescheduleAction")}
              </button>
              <button
                type="button"
                disabled={Boolean(reschedulePendingKey)}
                onClick={() => setRescheduleTarget(null)}
                className="mt-2 min-h-11 w-full rounded-xl border border-zinc-700 text-sm text-zinc-200 disabled:opacity-50"
              >
                {t("common.back")}
              </button>
            </div>
          </div>
        ) : null}
        {sheet ? (
          <StaffBookingSheet
            open
            barberId={sheet.barberId}
            barberName={sheet.barberName}
            slot={sheet.slot}
            pending={pendingKey === `${sheet.barberId}:${sheet.slot.startTime}`}
            pendingKind={
              pendingKey === `${sheet.barberId}:${sheet.slot.startTime}` ? pendingKind : null
            }
            shortenUntil={sheet.shortenUntil}
            onClose={() => {
              if (!pendingKey) setSheet(null);
            }}
            onWalkInNow={() => {
              const uiKey = `${sheet.barberId}:${sheet.slot.startTime}`;
              // Immediate feedback before gate / network (iOS / LINE feel laggy otherwise).
              setPendingKey(uiKey);
              setPendingKind("walk_in");
              const column = columns.find((c) => c.barber.id === sheet.barberId);
              const assessment = assessWalkInQuick(column, shopHours, new Date(), null);
              if (assessment.kind !== "ok") {
                setPendingKey(null);
                setPendingKind(null);
                const msg = walkInAssessmentMessage(assessment, t);
                if (assessment.kind === "busy") {
                  setWalkInOffer({
                    barberId: assessment.barberId,
                    startTime: assessment.nextFreeStartTime,
                  });
                  setError(msg);
                  toast.warning(msg);
                  return;
                }
                showActionError(msg);
                return;
              }
              void createStaffBooking(
                {
                  barberId: assessment.barberId,
                  startTime: assessment.startTime,
                  source: "walk_in",
                },
                { uiKey, kind: "walk_in", alreadyPending: true },
              );
            }}
            onStaffBooking={(input) =>
              void createStaffBooking(
                {
                  barberId: sheet.barberId,
                  startTime: sheet.slot.startTime,
                  endTime: input.endTime,
                  source: input.source,
                  customerName: input.customerName,
                  customerPhone: input.customerPhone,
                },
                {
                  uiKey: `${sheet.barberId}:${sheet.slot.startTime}`,
                  kind: input.source === "walk_in" ? "walk_in" : "booking",
                },
              )
            }
            onBlock={() => {
              setBlockSheet({
                barberId: sheet.barberId,
                barberName: sheet.barberName,
                initialStartISO: sheet.slot.startTime,
                freeUntilISO: sheet.slot.endTime,
              });
              setSheet(null);
            }}
          />
        ) : null}
        <WhoIsFreeSheet
          open={whoFreeOpen}
          rows={freeNow}
          emptyState={whoIsFreeEmpty}
          intent={thumbIntent}
          onClose={() => setWhoFreeOpen(false)}
          onWalkIn={(row) => onPickFreeBarber(row)}
          onOpenSchedule={() => {
            setBoardTab("schedule");
            setWhoFreeOpen(false);
          }}
        />
        {blockSheet ? (
          <BlockTimeSheet
            open
            barberId={blockSheet.barberId}
            barberName={blockSheet.barberName}
            column={
              columns.find((c) => c.barber.id === blockSheet.barberId) ?? {
                barber: {
                  id: blockSheet.barberId,
                  name: blockSheet.barberName,
                  slot_duration_minutes: 30,
                  off_days: [],
                  created_at: "",
                },
                slots: [],
              }
            }
            shopHours={shopHours}
            initialStartISO={blockSheet.initialStartISO}
            freeUntilISO={blockSheet.freeUntilISO}
            pending={
              pendingKind === "block" &&
              Boolean(pendingKey?.startsWith(`${blockSheet.barberId}:`))
            }
            onClose={() => {
              if (pendingKind !== "block") setBlockSheet(null);
            }}
            onConfirm={(input) => void onBlockRange(input)}
          />
        ) : null}
        {unblockSheet ? (
          <UnblockConfirmSheet
            open
            barberName={unblockSheet.barberName}
            startTime={unblockSheet.startTime}
            endTime={unblockSheet.endTime}
            pending={
              pendingKind === "block" &&
              pendingKey === `${unblockSheet.barberId}:${unblockSheet.startTime}`
            }
            onClose={() => {
              if (pendingKind !== "block") setUnblockSheet(null);
            }}
            onConfirm={() => void confirmUnblock()}
          />
        ) : null}
        <BookedSlotActionsSheet
          open={Boolean(actionsSheet)}
          barberId={actionsSheet?.barberId ?? ""}
          barberName={actionsSheet?.barberName ?? ""}
          slot={
            actionsSheet?.slot ?? {
              startTime: "",
              endTime: "",
              available: false,
              kind: "free",
            }
          }
          pending={Boolean(
            actionsSheet &&
              (outcomePendingKey === `${actionsSheet.barberId}:${actionsSheet.slot.startTime}` ||
                latePendingKey === `${actionsSheet.barberId}:${actionsSheet.slot.startTime}` ||
                cancelPendingKey === `${actionsSheet.barberId}:${actionsSheet.slot.startTime}`),
          )}
          onClose={() => setActionsSheet(null)}
          onAction={handleBookedSheetAction}
        />
        <CompleteServicePicker
          open={Boolean(servicePicker)}
          services={shopServices}
          mode={servicePicker?.mode ?? "complete"}
          initialServiceId={servicePicker?.slot.serviceId ?? null}
          customerLabel={servicePicker?.slot.customerName ?? null}
          pending={Boolean(
            servicePicker &&
              (outcomePendingKey ===
                `${servicePicker.barberId}:${servicePicker.slot.startTime}` ||
                outcomePendingKey === `${servicePicker.slot.appointmentId}:service`),
          )}
          onClose={() => setServicePicker(null)}
          onConfirm={(choice) => {
            if (!servicePicker) return;
            if (servicePicker.mode === "change") {
              void onChangeCompletedService(servicePicker.slot, choice);
              return;
            }
            void onOutcome(servicePicker.barberId, servicePicker.slot, "completed", {
              serviceId: choice.serviceId,
              priceBaht: choice.priceBaht,
            }).then((ok) => {
              if (ok) setServicePicker(null);
            });
          }}
        />
      </div>
    </AdminShell>
  );
}
