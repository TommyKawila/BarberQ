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
import {
  bookingErrorI18nKey,
  bookingSummaryReady,
  canShowOwnerTools,
  canSubmitBooking,
  defaultBookableBarberId,
  isCustomerDateDisabled,
  isShopClosedOnDate,
  maskPhone,
  normalizeCustomerPhone,
  staffIdentityKey,
  type ShopStaffMe,
} from "@/lib/booking/customer-flow";
import { useBrowserStorage } from "@/lib/browser-storage";
import { useLineAuth } from "@/lib/line/use-line-auth";
import { getLineAuthHeaders } from "@/lib/line/auth-headers";
import { useI18n } from "@/lib/i18n/locale-provider";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import {
  formatSlotTime,
  getBookableDates,
  SHOP_TIMEZONE,
} from "@/lib/services/slot-service";
import { barberLabel, type Appointment, type Barber, type Slot } from "@/types/booking";

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
  const { shopApi, shopPath } = useShopSlug();
  const { shopName, coverImageUrl, lineUrl, phone: shopPhone, hours } = useShopBrand();
  const { ready, profile, login, mockMode } = useLineAuth();
  const dates = useMemo(() => getBookableDates(), []);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barbersLoading, setBarbersLoading] = useState(true);
  const [staff, setStaff] = useState<ShopStaffMe | null>(null);
  const [prototypeMode, setPrototypeMode] = useState(true);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [dateISO, setDateISO] = useState<string | null>(dates[0] ?? null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedStart, setSelectedStart] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useBrowserStorage(PHONE_KEY);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const [showAddFriend, setShowAddFriend] = useState(false);

  const selectedStartRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const addFriendUrl = process.env.NEXT_PUBLIC_LINE_OA_ADD_URL?.trim() ?? "";

  useEffect(() => {
    selectedStartRef.current = selectedStart;
  }, [selectedStart]);

  useEffect(() => {
    submittingRef.current = submitting;
  }, [submitting]);

  useEffect(() => {
    if (profile?.displayName && !customerName) {
      setCustomerName(profile.displayName);
    }
  }, [profile, customerName]);

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

  const loadSlots = useCallback(
    async (targetBarberId: string, targetDate: string, silent: boolean) => {
      if (isShopClosedOnDate(hours, targetDate)) {
        setSlots([]);
        setLastUpdated(new Date());
        if (!silent) setSlotsLoading(false);
        return [];
      }
      if (!silent) {
        setSlotsLoading(true);
        setSelectedStart(null);
      }
      const res = await fetch(
        shopApi(`/slots?barberId=${encodeURIComponent(targetBarberId)}&date=${encodeURIComponent(targetDate)}`),
      );
      const json = (await res.json()) as { slots?: Slot[] };
      const fresh = json.slots ?? [];
      setSlots(fresh);
      setLastUpdated(new Date());
      if (!silent) {
        setSlotsLoading(false);
      } else {
        const current = selectedStartRef.current;
        if (current && !fresh.some((s) => s.startTime === current && s.available)) {
          setSelectedStart(null);
          setMessage(t("booking.slotUnavailable"));
        }
      }
      return fresh;
    },
    [shopApi, t, hours],
  );

  const silentRefresh = useCallback(async () => {
    if (!barberId || !activeDate) return;
    if (isCustomerDateDisabled(activeDate, hours, selectedBarber?.off_days ?? [])) return;
    await loadSlots(barberId, activeDate, true);
  }, [barberId, activeDate, selectedBarber, loadSlots, hours]);

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

  useEffect(() => {
    if (!barberId || !activeDate) return;
    if (isCustomerDateDisabled(activeDate, hours, selectedBarber?.off_days ?? [])) return;
    let cancelled = false;
    void (async () => {
      await Promise.resolve();
      if (cancelled) return;
      await loadSlots(barberId, activeDate, false);
    })();
    return () => {
      cancelled = true;
    };
  }, [barberId, activeDate, selectedBarber, loadSlots, hours]);

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
    if (!success || mockMode || !addFriendUrl) {
      setShowAddFriend(false);
      return;
    }
    let cancelled = false;
    void liff
      .getFriendship()
      .then((result) => {
        if (!cancelled) setShowAddFriend(!result.friendFlag);
      })
      .catch(() => {
        if (!cancelled) setShowAddFriend(true);
      });
    return () => {
      cancelled = true;
    };
  }, [success, mockMode, addFriendUrl]);

  async function submitBooking() {
    if (!barberId || !selectedStart || !profile) return;
    if (!canSubmitBooking(submittingRef.current)) return;
    submittingRef.current = true;
    setSubmitting(true);
    setMessage(null);
    try {
      const res = await fetch(shopApi("/bookings"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getLineAuthHeaders(mockMode ? profile.userId : undefined),
        },
        body: JSON.stringify({
          barberId,
          startTime: selectedStart,
          customerName: customerName.trim(),
          customerPhone: normalizeCustomerPhone(phone ?? ""),
        }),
      });
      const json = (await res.json()) as { appointment?: Appointment } & ApiError;
      if (!res.ok || !json.appointment) {
        const code = json.error?.code;
        if (code === "SLOT_TAKEN" || code === "SLOT_BLOCKED") {
          setMessage(t("booking.slotTaken"));
          setSelectedStart(null);
          void silentRefresh();
        } else {
          setMessage(t(bookingErrorI18nKey(code)));
        }
        return;
      }
      setPhone(normalizeCustomerPhone(phone ?? ""));
      const barberName = selectedBarber
        ? barberLabel(selectedBarber.name, locale)
        : "—";
      setSuccess({ appointment: json.appointment, barberName });
    } catch {
      setMessage(t("booking.failed"));
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

  if (!ready) {
    return <p className="px-4 py-16 text-center text-sm text-zinc-400">{t("common.loading")}</p>;
  }

  if (!profile && !mockMode) {
    return (
      <section className="flex flex-col gap-4 px-4 py-8">
        <BookingHero shopName={shopName} coverImageUrl={coverImageUrl} prototypeMode={prototypeMode} />
        <p className="text-sm text-zinc-400">{t("booking.lineLoginRequired")}</p>
        <button
          type="button"
          onClick={login}
          className="min-h-12 rounded-xl bg-[#06C755] font-semibold text-white"
        >
          {t("booking.loginWithLine")}
        </button>
      </section>
    );
  }

  if (!profile) {
    return <p className="px-4 py-16 text-center text-sm text-zinc-400">{t("common.loading")}</p>;
  }

  if (success) {
    return (
      <BookingSuccess
        appointment={success.appointment}
        barberName={success.barberName}
        shopName={shopName}
        barber={selectedBarber}
        showAddFriend={showAddFriend}
        onBackToShop={resetBooking}
      />
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

  const selectedSlot = slots.find((slot) => slot.startTime === selectedStart);
  const dateLocale = locale === "th" ? th : enUS;
  const summaryDate =
    activeDate && selectedSlot
      ? format(parseISO(`${activeDate}T00:00:00`), "EEEE d MMMM yyyy", { locale: dateLocale })
      : null;
  const showSummary = bookingSummaryReady(barberId, activeDate, selectedStart) && selectedSlot;

  return (
    <div className="flex flex-col gap-8 px-4 pb-36 pt-5">
      <BookingHero
        shopName={shopName}
        coverImageUrl={coverImageUrl}
        prototypeMode={prototypeMode}
      />

      <div className="flex items-center gap-3">
        {profile.pictureUrl ? (
          <img
            src={profile.pictureUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-amber-400">
            {(profile.displayName ?? "?").charAt(0)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-100">
            {profile.displayName
              ? t("booking.hello").replace("{name}", profile.displayName)
              : t("booking.hello").replace("{name}", "—")}
          </p>
          <p className="text-xs text-zinc-500">{t(staffIdentityKey(staff))}</p>
        </div>
      </div>

      <Link
        href={shopPath("/bookings")}
        className="flex min-h-14 items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 transition hover:bg-zinc-800/80"
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
          <p className="text-xs text-zinc-600">{t("booking.ownerToolsEyebrow")}</p>
          <Link
            href={shopPath("/admin")}
            className="flex min-h-12 items-center gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950 px-4 py-3 transition hover:bg-zinc-900"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
              <Store className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-300">{t("booking.ownerToolsTitle")}</p>
              <p className="text-xs text-zinc-600">{t("booking.ownerToolsSubtitle")}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-zinc-600" aria-hidden />
          </Link>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-100">{t("booking.stepBarber")}</h2>
        <p className="text-sm text-zinc-400">{t("booking.selectBarberHint")}</p>
        <BarberSelector barbers={barbers} value={barberId} onChange={setBarberId} />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-base font-semibold text-zinc-100">{t("booking.stepDate")}</h2>
        <p className="text-sm text-zinc-400">{t("booking.selectDateHint")}</p>
        <DateSelector
          dates={dates}
          value={activeDate}
          barber={selectedBarber}
          hours={hours}
          onChange={setDateISO}
        />
      </section>

      <section className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{t("booking.stepTime")}</h2>
            <p className="mt-0.5 text-sm text-zinc-400">{t("booking.selectTimeHint")}</p>
          </div>
          {lastUpdated ? (
            <p className="shrink-0 text-[10px] text-zinc-600">
              {t("booking.lastUpdated")}{" "}
              {formatInTimeZone(lastUpdated, SHOP_TIMEZONE, "HH:mm:ss")}
            </p>
          ) : null}
        </div>
        <SlotPicker
          slots={slots}
          value={selectedStart}
          loading={slotsLoading}
          shopClosed={shopClosedToday}
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
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">{t("booking.barber")}</dt>
                  <dd className="text-right font-medium text-zinc-100">
                    {selectedBarber ? barberLabel(selectedBarber.name, locale) : "—"}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">{t("booking.date")}</dt>
                  <dd className="text-right text-zinc-200">{summaryDate ?? "—"}</dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">{t("booking.time")}</dt>
                  <dd className="text-right font-medium text-zinc-100">
                    {formatSlotTime(selectedSlot.startTime)}
                  </dd>
                </div>
                <div className="flex items-start justify-between gap-3">
                  <dt className="text-zinc-500">{t("booking.duration")}</dt>
                  <dd className="text-right text-zinc-200">
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

          <section className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-zinc-100">{t("booking.stepConfirm")}</h2>
            {message ? <p className="text-sm text-red-400">{message}</p> : null}
          </section>

          <section className="flex flex-col gap-2 pb-4">
            <h2 className="text-sm font-semibold text-zinc-300">{t("booking.notesHeading")}</h2>
            <p className="text-xs text-zinc-500">{t("booking.cancelPolicy")}</p>
          </section>

          <div className="fixed inset-x-0 bottom-0 z-10 border-t border-zinc-800 bg-zinc-950/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
            <div className="mb-2 text-center text-xs text-zinc-500">
              {customerName.trim() ? customerName.trim() : "—"} ·{" "}
              {phone?.trim() ? maskPhone(phone) : "—"}
            </div>
            <button
              type="button"
              disabled={submitting || !profile}
              onClick={() => void submitBooking()}
              className="min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {submitting ? t("booking.booking") : t("booking.confirmBooking")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
