"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { enUS, th } from "date-fns/locale";
import liff from "@line/liff";
import { CalendarDays, ChevronRight, Store } from "lucide-react";
import { BarberSelector } from "@/components/customer/BarberSelector";
import { BookingHero } from "@/components/customer/BookingHero";
import { BookingSuccess } from "@/components/customer/BookingSuccess";
import { DateSelector } from "@/components/customer/DateSelector";
import { ShopContactLinks } from "@/components/customer/ShopContactLinks";
import { SlotPicker } from "@/components/customer/SlotPicker";
import { useShopBrand } from "@/lib/brand/shop-brand";
import { bookingAppAuthPhase } from "@/lib/booking/booking-app-auth";
import {
  bookingErrorI18nKey,
  bookingSummaryReady,
  canShowOwnerTools,
  canSubmitBooking,
  defaultBookableBarberId,
  findOwnBookingForSlot,
  isCustomerDateDisabled,
  isShopClosedOnDate,
  maskPhone,
  normalizeCustomerPhone,
  staffIdentityKey,
  type ShopStaffMe,
} from "@/lib/booking/customer-flow";
import {
  mergeSlotsCache,
  reconcileSelectedStart,
  shouldApplySlotResponse,
  slotAvailabilityKey,
  slotsDisplayLoading,
  slotsForDisplay,
} from "@/lib/booking/slot-availability-ui";
import { useBrowserStorage } from "@/lib/browser-storage";
import { useLineAuth } from "@/lib/line/use-line-auth";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { buildAdminCustomerBookingUrl, isLiffCustomerUrl } from "@/lib/line/liff-url";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import {
  formatSlotTime,
  getBookableDates,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import { type LineFriendship } from "@/lib/booking/booking-success-ux";
import { barberLabel, type Appointment, type Barber, type Slot } from "@/types/booking";
import { ReminderLeadChips } from "@/components/customer/ReminderLeadChips";
import { deliverBookingLineConfirm } from "@/lib/line/deliver-booking-confirm";
import {
  defaultCustomerReminderChip,
  isCustomerReminderLeadFuture,
} from "@/lib/reminders/customer-chips";
import type { ReminderLeadOption } from "@/lib/reminders/labels";

const PHONE_KEY = "barberq_phone";
const POLL_MS = 10_000;

interface ApiError {
  error?: { code?: string; message?: string };
}

interface SuccessState {
  appointment: Appointment;
  barberName: string;
}

export function BookingApp() {
  const { t, locale } = useI18n();
  const { shopSlug, shopApi, shopPath } = useShopSlug();
  const {
    shopName,
    coverImageUrl,
    lineUrl,
    phone: shopPhone,
    hours,
    remindersEnabled: brandRemindersEnabled,
    reminderLeadMinutes: brandReminderLead,
    bookingAdvanceDays,
    lineAddFriendUrl,
    loading: brandLoading,
  } = useShopBrand();
  // Prefer brand (TTL-cached /settings) — no per-slot re-download of ~100KB logo.
  const remindersEnabled = brandRemindersEnabled;
  const shopReminderLead = brandReminderLead;
  const { ready, profile, login, mockMode } = useLineAuth();
  const dates = useMemo(
    () => getBookableDates(new Date(), bookingAdvanceDays),
    [bookingAdvanceDays],
  );
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barbersLoading, setBarbersLoading] = useState(true);
  const [staff, setStaff] = useState<ShopStaffMe | null>(null);
  const [prototypeMode, setPrototypeMode] = useState(true);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [dateISO, setDateISO] = useState<string | null>(dates[0] ?? null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsOwnerKey, setSlotsOwnerKey] = useState<string | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsCache, setSlotsCache] = useState<ReadonlyMap<string, Slot[]>>(() => new Map());
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useBrowserStorage(PHONE_KEY);
  const [reminderLeadOverride, setReminderLeadOverride] = useState<ReminderLeadOption | null>(
    null,
  );
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [friendship, setFriendship] = useState<LineFriendship>("unknown");

  const selectedStartRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const missingAddUrlWarned = useRef(false);
  const slotsCacheRef = useRef(slotsCache);
  const desiredSlotsKeyRef = useRef<string | null>(null);
  const addFriendUrl = lineAddFriendUrl?.trim() ?? "";

  useEffect(() => {
    selectedStartRef.current = selectedStart;
  }, [selectedStart]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    slotsCacheRef.current = slotsCache;
  }, [slotsCache]);

  useEffect(() => {
    if (profile?.displayName && !customerName) {
      setCustomerName(profile.displayName);
    }
  }, [profile, customerName]);

  // Default chip from shop brand when a slot is chosen (no /settings re-fetch).
  useEffect(() => {
    if (!selectedStart || brandLoading) return;
    setReminderLeadOverride(
      defaultCustomerReminderChip(brandReminderLead, new Date(selectedStart)),
    );
  }, [selectedStart, brandLoading, brandReminderLead]);

  const reminderLead: ReminderLeadOption | null = (() => {
    if (!remindersEnabled || !selectedStart) return null;
    if (reminderLeadOverride != null) {
      if (
        reminderLeadOverride === 0 ||
        isCustomerReminderLeadFuture(reminderLeadOverride, new Date(selectedStart))
      ) {
        return reminderLeadOverride;
      }
    }
    return defaultCustomerReminderChip(shopReminderLead, new Date(selectedStart));
  })();

  useEffect(() => {
    if (!profile?.userId) {
      setStaff(null);
      return;
    }
    let cancelled = false;
    void fetch(shopApi("/staff-me"), {
      headers: getLineAuthHeaders(mockMode ? profile.userId : undefined),
    })
      .then(async (res) => {
        const json = (await res.json()) as { staff?: ShopStaffMe | null };
        if (!cancelled) setStaff(json.staff ?? null);
      })
      .catch(() => {
        if (!cancelled) setStaff(null);
      });
    return () => {
      cancelled = true;
    };
  }, [profile?.userId, shopApi, mockMode]);

  const selectedBarber = barbers.find((item) => item.id === barberId) ?? null;

  const activeDate = useMemo(() => {
    if (!selectedBarber || !dateISO) return dateISO;
    const offDays = selectedBarber.off_days;
    if (!isCustomerDateDisabled(dateISO, hours, offDays)) return dateISO;
    return (
      dates.find((d) => !isCustomerDateDisabled(d, hours, offDays)) ?? dateISO
    );
  }, [selectedBarber, dateISO, dates, hours]);

  const shopClosedToday = activeDate ? isShopClosedOnDate(hours, activeDate) : false;

  const desiredSlotsKey = useMemo(() => {
    if (!barberId || !activeDate) return null;
    if (isCustomerDateDisabled(activeDate, hours, selectedBarber?.off_days ?? [])) return null;
    return slotAvailabilityKey(barberId, activeDate);
  }, [barberId, activeDate, hours, selectedBarber]);

  useEffect(() => {
    desiredSlotsKeyRef.current = desiredSlotsKey;
  }, [desiredSlotsKey]);

  const displaySlots = slotsForDisplay({
    desiredKey: desiredSlotsKey,
    ownerKey: slotsOwnerKey,
    slots,
    cache: slotsCache,
  });
  const displaySlotsLoading = slotsDisplayLoading({
    desiredKey: desiredSlotsKey,
    ownerKey: slotsOwnerKey,
    slotsLoading,
    cache: slotsCache,
  });

  const applySlots = useCallback(
    (
      key: string,
      fresh: Slot[],
      opts: { reconcileSelection: boolean },
    ) => {
      setSlotsCache((prev) => {
        const next = new Map(prev);
        next.set(key, fresh);
        slotsCacheRef.current = next;
        return next;
      });
      if (!shouldApplySlotResponse(key, desiredSlotsKeyRef.current)) return;
      setSlots(fresh);
      setSlotsOwnerKey(key);
      setLastUpdated(new Date());
      setSlotsLoading(false);
      if (opts.reconcileSelection) {
        setSelectedStart((prev) => {
          const next = reconcileSelectedStart(prev, fresh);
          if (prev && !next) setMessage(t("booking.slotUnavailable"));
          return next;
        });
      }
    },
    [t],
  );

  const loadSlots = useCallback(
    async (
      targetBarberId: string,
      targetDate: string,
      silent: boolean,
      signal?: AbortSignal,
    ) => {
      const key = slotAvailabilityKey(targetBarberId, targetDate);
      if (isShopClosedOnDate(hours, targetDate)) {
        applySlots(key, [], { reconcileSelection: true });
        return [];
      }
      if (!silent && !slotsCacheRef.current.has(key)) {
        setSlotsLoading(true);
      }
      try {
        const res = await fetch(
          shopApi(
            `/slots?barberId=${encodeURIComponent(targetBarberId)}&date=${encodeURIComponent(targetDate)}`,
          ),
          { signal },
        );
        const json = (await res.json()) as { slots?: Slot[] };
        const fresh = json.slots ?? [];
        applySlots(key, fresh, {
          reconcileSelection: silent || Boolean(selectedStartRef.current),
        });
        return fresh;
      } catch (error) {
        if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return [];
        }
        if (!silent && shouldApplySlotResponse(key, desiredSlotsKeyRef.current)) {
          setSlotsLoading(false);
        }
        throw error;
      }
    },
    [shopApi, hours, applySlots],
  );

  const silentRefresh = useCallback(async () => {
    if (!barberId || !activeDate) return;
    if (isCustomerDateDisabled(activeDate, hours, selectedBarber?.off_days ?? [])) return;
    await loadSlots(barberId, activeDate, true);
  }, [barberId, activeDate, selectedBarber, loadSlots, hours]);

  const [skipSlotAutoScroll, setSkipSlotAutoScroll] = useState(false);

  const manualRefreshSlots = useCallback(async () => {
    if (!barberId || !activeDate) return;
    if (isCustomerDateDisabled(activeDate, hours, selectedBarber?.off_days ?? [])) return;
    setSkipSlotAutoScroll(true);
    await loadSlots(barberId, activeDate, false);
  }, [barberId, activeDate, selectedBarber, loadSlots, hours]);

  function handleBarberChange(nextId: string) {
    if (nextId === barberId) return;
    setSkipSlotAutoScroll(false);
    setBarberId(nextId);
    setSelectedStart(null);
    setMessage(null);
  }

  function handleDateChange(nextDate: string) {
    if (nextDate === dateISO) return;
    setSkipSlotAutoScroll(false);
    setDateISO(nextDate);
    setSelectedStart(null);
    setMessage(null);
  }

  function handleViewNextDay() {
    if (!activeDate) return;
    const idx = dates.indexOf(activeDate);
    const next = dates[idx + 1];
    if (next) handleDateChange(next);
  }

  useEffect(() => {
    let cancelled = false;
    setBarbersLoading(true);
    void (async () => {
      const res = await fetch(shopApi("/barbers"));
      const json = (await res.json()) as {
        barbers?: Barber[];
        prototypeMode?: boolean;
      } & ApiError;
      if (cancelled) return;
      const list = json.barbers ?? [];
      setBarbers(list);
      setPrototypeMode(json.prototypeMode ?? true);
      const defaultId = defaultBookableBarberId(list);
      setBarberId((current) => current ?? defaultId ?? list[0]?.id ?? null);
      setBarbersLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [shopApi]);

  // Prefetch all barbers for the selected date (one bulk request).
  useEffect(() => {
    if (!activeDate || barbers.length === 0) return;
    if (isShopClosedOnDate(hours, activeDate)) return;
    const ac = new AbortController();
    const dateForRequest = activeDate;
    void (async () => {
      try {
        const res = await fetch(
          shopApi(`/slots?date=${encodeURIComponent(dateForRequest)}`),
          { signal: ac.signal },
        );
        const json = (await res.json()) as { slotsByBarberId?: Record<string, Slot[]> };
        if (ac.signal.aborted) return;
        const byBarber = json.slotsByBarberId ?? {};
        setSlotsCache((prev) => {
          const next = new Map(prev);
          mergeSlotsCache(next, dateForRequest, byBarber);
          slotsCacheRef.current = next;
          return next;
        });
        const currentKey = desiredSlotsKeyRef.current;
        const currentBarberId = currentKey?.split("|")[0] ?? null;
        if (
          currentBarberId &&
          byBarber[currentBarberId] &&
          currentKey === slotAvailabilityKey(currentBarberId, dateForRequest)
        ) {
          applySlots(currentKey, byBarber[currentBarberId], { reconcileSelection: true });
        }
      } catch (error) {
        if (ac.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
      }
    })();
    return () => {
      ac.abort();
    };
  }, [activeDate, barbers, hours, shopApi, applySlots]);

  // Load selected barber+date only when bulk cache misses (avoid duplicate /slots).
  useEffect(() => {
    if (!barberId || !activeDate) return;
    if (isCustomerDateDisabled(activeDate, hours, selectedBarber?.off_days ?? [])) return;
    const key = slotAvailabilityKey(barberId, activeDate);
    const cached = slotsCacheRef.current.get(key);
    if (cached) {
      applySlots(key, cached, { reconcileSelection: false });
      return;
    }
    const ac = new AbortController();
    void loadSlots(barberId, activeDate, false, ac.signal);
    return () => {
      ac.abort();
    };
  }, [barberId, activeDate, selectedBarber, loadSlots, hours, applySlots]);

  useEffect(() => {
    if (!barberId || !activeDate || success) return;
    if (isCustomerDateDisabled(activeDate, hours, selectedBarber?.off_days ?? [])) return;

    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if (submittingRef.current) return;
      void silentRefresh();
    };

    const timer = window.setInterval(tick, POLL_MS);
    window.addEventListener("visibilitychange", tick);
    window.addEventListener("focus", tick);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("visibilitychange", tick);
      window.removeEventListener("focus", tick);
    };
  }, [barberId, activeDate, selectedBarber, silentRefresh, hours, success]);

  useEffect(() => {
    if (!success) {
      setFriendship("unknown");
      return;
    }
    if (!addFriendUrl) {
      if (!missingAddUrlWarned.current) {
        missingAddUrlWarned.current = true;
        console.warn("Add Friend skipped: shop OA add-friend URL is unset");
      }
      return;
    }
    if (mockMode) return;
    let cancelled = false;
    void liff
      .getFriendship()
      .then((result) => {
        if (!cancelled) setFriendship(result.friendFlag ? "friend" : "not_friend");
      })
      .catch(() => {
        if (!cancelled) setFriendship("unknown");
      });
    return () => {
      cancelled = true;
    };
  }, [success, mockMode, addFriendUrl]);

  async function submitBooking() {
    if (!barberId || !selectedStart || !profile) return;
    if (!canSubmitBooking(submittingRef.current)) return;
    const authHeaders = getLineAuthHeaders(mockMode ? profile.userId : undefined);
    if (!mockMode && !("Authorization" in authHeaders)) {
      // Plain web / stale LIFF session: profile may show but API needs a token.
      setMessage(t("booking.unauthorized"));
      login();
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(shopApi("/bookings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          barberId,
          startTime: selectedStart,
          customerName: customerName.trim(),
          customerPhone: normalizeCustomerPhone(phone ?? ""),
          ...(remindersEnabled
            ? { reminderLeadMinutes: reminderLead === 0 ? null : reminderLead }
            : {}),
        }),
      });
      const json = (await res.json()) as {
        appointment?: Appointment;
        lineReplyHint?: { triggerText?: string };
      } & ApiError;
      if (!res.ok || !json.appointment) {
        const code = json.error?.code;
        // False failure: row may already be committed (slot race, or legacy
        // post-create patch error on DBs missing appointments.source).
        if (barberId && selectedStart) {
          try {
            const mineRes = await fetch(shopApi("/bookings"), {
              headers: getLineAuthHeaders(mockMode ? profile.userId : undefined),
            });
            const mineJson = (await mineRes.json()) as { appointments?: Appointment[] };
            const existing = findOwnBookingForSlot(
              mineJson.appointments ?? [],
              barberId,
              selectedStart,
            );
            if (existing) {
              setPhone(normalizeCustomerPhone(phone ?? ""));
              setSuccess({
                appointment: existing,
                barberName: selectedBarber
                  ? barberLabel(selectedBarber.name, locale)
                  : "—",
              });
              return;
            }
          } catch {
            /* fall through to error UI */
          }
        }
        if (code === "SLOT_TAKEN" || code === "SLOT_BLOCKED") {
          setMessage(t("booking.slotTaken"));
          setSelectedStart(null);
          void silentRefresh();
        } else {
          setMessage(t(bookingErrorI18nKey(code)));
        }
        return;
      }

      // Booking row is committed — always show success before LINE confirm side-work.
      setPhone(normalizeCustomerPhone(phone ?? ""));
      const barberName = selectedBarber
        ? barberLabel(selectedBarber.name, locale)
        : "—";
      setSuccess({ appointment: json.appointment, barberName });

      // Best-effort OA confirm/ticket — never fail the booking UI if this throws/hangs.
      const trigger = json.lineReplyHint?.triggerText?.trim();
      const appointmentId = json.appointment.id;
      if (trigger && !mockMode) {
        void deliverBookingLineConfirm({
          liff,
          triggerText: trigger,
          confirmNotifyUrl: shopApi(`/bookings/${appointmentId}/confirm-notify`),
          authHeaders: getLineAuthHeaders(),
        }).catch((err) => {
          console.warn(
            JSON.stringify({
              event: "booking_confirm_side_effect_error",
              appointmentId,
              message: err instanceof Error ? err.message : String(err),
            }),
          );
        });
      }
    } catch {
      setMessage(t("booking.failedCheckMine"));
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  function resetBooking() {
    setSuccess(null);
    setSelectedStart(null);
    setMessage(null);
    setDateISO(dates[0] ?? null);
    if (barberId && activeDate) {
      void loadSlots(barberId, activeDate, false);
    }
  }

  const authPhase = bookingAppAuthPhase({
    ready,
    hasProfile: Boolean(profile),
    mockMode,
    hasSuccess: Boolean(success),
    submitting,
  });

  // Auth resolving / submit blip: loading only — never the green Login CTA.
  if (authPhase === "auth-loading") {
    return (
      <p
        className="px-4 py-16 text-center text-sm text-zinc-400"
        data-testid="booking-auth-loading"
      >
        {t("common.loading")}
      </p>
    );
  }

  if (authPhase === "login") {
    const liffEntry = buildAdminCustomerBookingUrl(shopSlug);
    const showLiffOpen = isLiffCustomerUrl(liffEntry);
    return (
      <section className="flex flex-col gap-4 px-4 py-8" data-testid="booking-line-login">
        <BookingHero shopName={shopName} coverImageUrl={coverImageUrl} prototypeMode={prototypeMode} />
        <p className="text-sm text-zinc-400">{t("booking.lineLoginRequired")}</p>
        <p className="text-xs text-zinc-500">{t("booking.lineLoginHint")}</p>
        <button
          type="button"
          onClick={login}
          className="min-h-12 rounded-xl bg-[#06C755] font-semibold text-white"
        >
          {t("booking.loginWithLine")}
        </button>
        {showLiffOpen ? (
          <a
            href={liffEntry}
            className="flex min-h-12 items-center justify-center rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-100"
          >
            {t("booking.openInLiff")}
          </a>
        ) : null}
      </section>
    );
  }

  if (authPhase === "success" && success) {
    return (
      <BookingSuccess
        appointment={success.appointment}
        barberName={success.barberName}
        shopName={shopName}
        barber={selectedBarber}
        friendship={friendship}
        addFriendUrl={addFriendUrl}
        onBackToShop={resetBooking}
      />
    );
  }

  if (!profile) {
    return (
      <p className="px-4 py-16 text-center text-sm text-zinc-400" data-testid="booking-auth-loading">
        {t("common.loading")}
      </p>
    );
  }

  if (barbersLoading) {
    return <p className="px-4 py-16 text-center text-sm text-zinc-400">{t("common.loading")}</p>;
  }

  if (barbers.length === 0) {
    return (
      <section className="flex flex-col gap-4 px-4 py-8">
        <BookingHero shopName={shopName} coverImageUrl={coverImageUrl} prototypeMode={prototypeMode} />
        <p className="text-sm text-zinc-400">{t("booking.noOnlineBooking")}</p>
        <ShopContactLinks lineUrl={lineUrl} phone={shopPhone} />
      </section>
    );
  }

  const selectedSlot = displaySlots.find((slot) => slot.startTime === selectedStart);
  const dateLocale = locale === "th" ? th : enUS;
  const summaryDate =
    activeDate && selectedSlot
      ? format(parseISO(`${activeDate}T00:00:00`), "EEEE d MMMM yyyy", { locale: dateLocale })
      : null;
  const showSummary = bookingSummaryReady(barberId, activeDate, selectedStart) && selectedSlot;
  const greetingName = profile.displayName?.trim() ?? "";

  return (
    <div className="flex flex-col gap-8 px-4 pb-[min(52vh,28rem)] pt-5">
      <BookingHero
        shopName={shopName}
        coverImageUrl={coverImageUrl}
        prototypeMode={prototypeMode}
      />

      {greetingName ? (
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amber-400 text-sm font-semibold text-zinc-950">
            {greetingName.charAt(0)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-zinc-100">
              {t("booking.hello").replace("{name}", greetingName)}
            </p>
            <p className="text-xs text-zinc-400">{t(staffIdentityKey(staff))}</p>
          </div>
        </div>
      ) : (
        <div className="min-w-0">
          <p className="text-sm font-medium text-zinc-100">{t("booking.helloGuest")}</p>
          <p className="text-xs text-zinc-400">{t(staffIdentityKey(staff))}</p>
        </div>
      )}

      <Link
        href={shopPath("/bookings")}
        prefetch
        className="flex min-h-16 items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition hover:bg-zinc-800/80"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
          <CalendarDays className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-zinc-100">{t("booking.viewMyBookings")}</p>
          <p className="text-xs text-zinc-500">{t("booking.myBookingsCardSubtitle")}</p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden />
      </Link>

      {canShowOwnerTools(staff) ? (
        <section className="flex flex-col gap-2">
          <p className="text-xs text-zinc-400">{t("booking.ownerToolsEyebrow")}</p>
          <Link
            href={shopPath("/admin")}
            prefetch
            className="flex min-h-16 items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition hover:bg-zinc-800/80"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-400">
              <Store className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-100">{t("booking.ownerToolsTitle")}</p>
              <p className="text-xs text-zinc-500">{t("booking.ownerToolsSubtitle")}</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-zinc-500" aria-hidden />
          </Link>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-100">{t("booking.stepBarber")}</h2>
        <p className="text-sm text-zinc-400">{t("booking.selectBarberHint")}</p>
        <BarberSelector barbers={barbers} value={barberId} onChange={handleBarberChange} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-100">{t("booking.stepDate")}</h2>
        <p className="text-sm text-zinc-400">{t("booking.selectDateHint")}</p>
        <DateSelector
          dates={dates}
          value={activeDate}
          barber={selectedBarber}
          hours={hours}
          onChange={handleDateChange}
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{t("booking.stepTime")}</h2>
            <p className="mt-0.5 text-sm text-zinc-400">{t("booking.selectTimeHint")}</p>
          </div>
          {lastUpdated && !displaySlotsLoading ? (
            <button
              type="button"
              onClick={() => void manualRefreshSlots()}
              aria-label={t("booking.refreshSlotsAria")}
              className="inline-flex h-11 shrink-0 items-center rounded-xl border border-zinc-700 px-3 text-xs font-medium text-zinc-300"
            >
              {t("booking.refreshSlots").replace(
                "{time}",
                formatInTimeZone(lastUpdated, SHOP_TIMEZONE, "HH:mm"),
              )}
            </button>
          ) : null}
        </div>
        <SlotPicker
          slots={displaySlots}
          value={selectedStart}
          loading={displaySlotsLoading}
          shopClosed={shopClosedToday}
          dateKey={activeDate}
          skipAutoScroll={skipSlotAutoScroll}
          onViewNextDay={handleViewNextDay}
          onChange={(start) => {
            setSelectedStart(start);
            setMessage(null);
          }}
        />
      </section>

      {message && !showSummary ? (
        <p className="text-sm text-amber-400">{message}</p>
      ) : null}

      {showSummary ? (
        <>
          <section className="flex flex-col gap-3">
            <div>
              <h2 className="text-base font-semibold text-zinc-100">{t("booking.stepSummary")}</h2>
              <p className="mt-0.5 text-sm text-zinc-400">{t("booking.stepSummaryHint")}</p>
            </div>
            <div className="rounded-2xl bg-zinc-900 p-4">
              <dl className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <dt className="w-[120px] shrink-0 text-zinc-500">{t("booking.barber")}</dt>
                  <dd className="min-w-0 flex-1 text-right font-medium text-zinc-100">
                    {selectedBarber ? barberLabel(selectedBarber.name, locale) : "—"}
                  </dd>
                </div>
                <div className="flex items-start gap-3">
                  <dt className="w-[120px] shrink-0 text-zinc-500">{t("booking.date")}</dt>
                  <dd className="min-w-0 flex-1 text-right text-zinc-200">{summaryDate ?? "—"}</dd>
                </div>
                <div className="flex items-start gap-3">
                  <dt className="w-[120px] shrink-0 text-zinc-500">{t("booking.time")}</dt>
                  <dd className="min-w-0 flex-1 text-right font-medium text-zinc-100">
                    {formatSlotTime(selectedSlot.startTime)}
                  </dd>
                </div>
                <div className="flex items-start gap-3">
                  <dt className="w-[120px] shrink-0 text-zinc-500">{t("booking.duration")}</dt>
                  <dd className="min-w-0 flex-1 text-right text-zinc-200">
                    {selectedBarber
                      ? `${selectedBarber.slot_duration_minutes} ${t("common.minutes")}`
                      : "—"}
                  </dd>
                </div>
              </dl>
              <div className="mt-4 space-y-3 border-t border-zinc-800 pt-4">
                <label className="flex flex-col gap-1 text-sm">
                  {t("booking.name")}
                  <input
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder={t("booking.namePlaceholder")}
                    className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  {t("booking.phone")}
                  <input
                    value={phone ?? ""}
                    onChange={(event) => setPhone(event.target.value)}
                    inputMode="tel"
                    placeholder={t("booking.phonePlaceholder")}
                    className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
                  />
                </label>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-2 pb-4">
            <h2 className="text-sm font-semibold text-zinc-300">{t("booking.notesHeading")}</h2>
            <p className="text-xs text-zinc-500">{t("booking.cancelPolicy")}</p>
            {message ? <p className="text-sm text-red-400">{message}</p> : null}
          </section>

          {/* Sticky: chips immediately above confirm — <select> is often invisible in LINE LIFF iOS. */}
          <div className="fixed inset-x-0 bottom-0 z-20 border-t border-zinc-800 bg-zinc-950 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(0,0,0,0.45)]">
            {selectedStart && brandLoading ? (
              <p className="mb-2 text-xs text-zinc-500" data-testid="reminder-lead-loading">
                {t("booking.reminderLoading")}
              </p>
            ) : null}
            {remindersEnabled && selectedStart && reminderLead != null ? (
              <div className="mb-3">
                <ReminderLeadChips
                  startTimeIso={selectedStart}
                  value={reminderLead}
                  onChange={setReminderLeadOverride}
                  label={t("booking.reminderLead")}
                  hint={t("booking.reminderLeadHint")}
                  t={t}
                />
              </div>
            ) : null}
            <div className="mb-2 text-center text-xs text-zinc-500">
              {customerName.trim() ? customerName.trim() : "—"} ·{" "}
              {phone?.trim() ? maskPhone(phone) : "—"}
            </div>
            <button
              type="button"
              disabled={submitting || !profile}
              onClick={() => void submitBooking()}
              className="min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 shadow-[0_0_24px_rgba(246,173,52,0.35)] disabled:opacity-50"
            >
              {submitting ? t("booking.booking") : t("booking.confirmBooking")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
