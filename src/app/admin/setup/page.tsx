"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AdminSessionBadge } from "@/components/admin/AdminSessionBadge";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { ALLOWED_SLOT_DURATIONS } from "@/lib/schedule/validation";
import { useI18n } from "@/lib/i18n/locale-provider";
import type { MessageKey } from "@/lib/i18n/dictionary";
import { firstIncompleteSetupStep, type ShopActivation } from "@/lib/onboarding/activation";
import {
  applyOptimisticToggle,
  rollbackOptimisticToggle,
  shouldShowOwnerSlotDuration,
} from "@/lib/onboarding/optimistic-bookable";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { normalizeShopName } from "@/lib/shop/shop-name";
import {
  isValidShopLineUrl,
  isValidShopPhone,
  normalizeShopLineUrl,
  normalizeShopPhone,
} from "@/lib/shop/shop-contact";
import { DEFAULT_SHOP_HOURS, normalizeShopHours, type ShopDayHours, type ShopHours } from "@/lib/shop/shop-hours";
import { barberLabel, type Barber } from "@/types/booking";

type SetupStep = "profile" | "team" | "hours" | "link" | "test" | "ready";

const WEEKDAYS: { value: number; key: MessageKey }[] = [
  { value: 0, key: "common.sunday" },
  { value: 1, key: "common.monday" },
  { value: 2, key: "common.tuesday" },
  { value: 3, key: "common.wednesday" },
  { value: 4, key: "common.thursday" },
  { value: 5, key: "common.friday" },
  { value: 6, key: "common.saturday" },
];

function SetupContent() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { ready, profile, authHeaders, mockMode } = useAdminPageAuth();
  const { shopApi, shopPath } = useShopSlug();
  const step = (searchParams.get("step") as SetupStep | null) ?? null;

  const [activation, setActivation] = useState<ShopActivation | null>(null);
  const [bookingUrl, setBookingUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [shopName, setShopName] = useState("");
  const [lineUrl, setLineUrl] = useState("");
  const [phone, setPhone] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [ownerBookable, setOwnerBookable] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDuration, setNewDuration] = useState(30);
  const [savingTeam, setSavingTeam] = useState(false);
  const [savingOwnerBookable, setSavingOwnerBookable] = useState(false);
  const [savingOwnerDuration, setSavingOwnerDuration] = useState(false);

  const [hours, setHours] = useState<ShopDayHours[]>(() => DEFAULT_SHOP_HOURS.map((d) => ({ ...d })));
  const [savingHours, setSavingHours] = useState(false);

  const ownerBarber = useMemo(
    () => barbers.find((b) => b.role === "owner") ?? null,
    [barbers],
  );

  const loadSetup = useCallback(async () => {
    const res = await fetch(shopApi("/setup"), { headers: authHeaders });
    const json = (await res.json()) as {
      activation?: ShopActivation;
      bookingUrl?: string;
      error?: { message?: string };
    };
    if (!res.ok) throw new Error(json.error?.message ?? "Failed");
    setActivation(json.activation ?? null);
    setBookingUrl(json.bookingUrl ?? "");
    return json.activation;
  }, [authHeaders, shopApi]);

  const loadSettings = useCallback(async () => {
    const res = await fetch(shopApi("/settings"), { headers: authHeaders });
    if (!res.ok) return;
    const json = (await res.json()) as {
      shopName?: string | null;
      lineUrl?: string | null;
      phone?: string | null;
      hours?: ShopHours | null;
    };
    setShopName(json.shopName ?? "");
    setLineUrl(json.lineUrl ?? "");
    setPhone(json.phone ?? "");
    if (json.hours) setHours(normalizeShopHours(json.hours));
  }, [authHeaders, shopApi]);

  const loadBarbers = useCallback(async () => {
    const res = await fetch(shopApi("/barbers"), { headers: authHeaders });
    if (!res.ok) return;
    const json = (await res.json()) as { barbers?: Barber[] };
    const list = json.barbers ?? [];
    setBarbers(list);
    const owner = list.find((b) => b.role === "owner");
    setOwnerBookable(owner?.is_bookable !== false);
  }, [authHeaders, shopApi]);

  useEffect(() => {
    if (!ready || !profile || profile.role !== "owner") return;
    let cancelled = false;
    void (async () => {
      try {
        await Promise.all([loadSetup(), loadSettings(), loadBarbers()]);
      } catch {
        if (!cancelled) setError(t("admin.networkError"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadBarbers, loadSettings, loadSetup, profile, ready, t]);

  useEffect(() => {
    if (!ready || profile?.role !== "barber") return;
    router.replace(shopPath("/admin"));
  }, [profile, ready, router, shopPath]);

  function goStep(next: SetupStep | null) {
    const url = next ? `${shopPath("/admin/setup")}?step=${next}` : shopPath("/admin/setup");
    router.replace(url);
  }

  async function saveProfile() {
    setSavingProfile(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(shopApi("/settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          shopName: normalizeShopName(shopName),
          lineUrl: normalizeShopLineUrl(lineUrl),
          phone: normalizeShopPhone(phone),
        }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? t("admin.updateFailed"));
      if (lineUrl.trim() && !isValidShopLineUrl(normalizeShopLineUrl(lineUrl))) {
        throw new Error(t("admin.shopLineInvalid"));
      }
      if (phone.trim() && !isValidShopPhone(normalizeShopPhone(phone))) {
        throw new Error(t("booking.invalidPhone"));
      }
      await loadSetup();
      setMessage(t("onboarding.saved"));
      goStep("team");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setSavingProfile(false);
    }
  }

  function setBarberBookable(barberId: string, isBookable: boolean) {
    setBarbers((prev) =>
      prev.map((b) =>
        b.id === barberId ? { ...b, is_bookable: isBookable } : b,
      ),
    );
  }

  async function toggleOwnerBookable() {
    if (!ownerBarber || savingOwnerBookable) return;
    const previous = ownerBookable;
    const next = applyOptimisticToggle(previous);
    setOwnerBookable(next);
    setBarberBookable(ownerBarber.id, next);
    setSavingOwnerBookable(true);
    setError(null);
    try {
      const res = await fetch(`/api/barbers/${ownerBarber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ isBookable: next }),
      });
      if (!res.ok) throw new Error(t("admin.updateFailed"));
      void loadSetup();
    } catch (err) {
      const rolled = rollbackOptimisticToggle(previous);
      setOwnerBookable(rolled);
      setBarberBookable(ownerBarber.id, rolled);
      setError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setSavingOwnerBookable(false);
    }
  }

  async function updateOwnerDuration(duration: number) {
    if (!ownerBarber || !ownerBookable) return;
    setSavingOwnerDuration(true);
    setError(null);
    const previous = ownerBarber.slot_duration_minutes;
    setBarbers((prev) =>
      prev.map((b) =>
        b.id === ownerBarber.id ? { ...b, slot_duration_minutes: duration } : b,
      ),
    );
    try {
      const res = await fetch(`/api/barbers/${ownerBarber.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ slotDuration: duration }),
      });
      if (!res.ok) throw new Error(t("admin.updateFailed"));
    } catch (err) {
      setBarbers((prev) =>
        prev.map((b) =>
          b.id === ownerBarber.id ? { ...b, slot_duration_minutes: previous } : b,
        ),
      );
      setError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setSavingOwnerDuration(false);
    }
  }

  async function addBarber() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setSavingTeam(true);
    setError(null);
    try {
      const res = await fetch(shopApi("/barbers"), {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ name: trimmed, slotDuration: newDuration, isBookable: true }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? t("admin.updateFailed"));
      setNewName("");
      await Promise.all([loadBarbers(), loadSetup()]);
      setMessage(t("onboarding.barberAdded"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setSavingTeam(false);
    }
  }

  function updateHour(index: number, patch: Partial<ShopDayHours>) {
    setHours((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function applyHoursToAllOpen() {
    const template = hours.find((d) => !d.closed) ?? hours[1];
    setHours((prev) =>
      prev.map((row) => (row.closed ? row : { ...row, open: template.open, close: template.close })),
    );
  }

  async function saveHours() {
    setSavingHours(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(shopApi("/settings"), {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ hours }),
      });
      const json = (await res.json()) as { error?: { message?: string } };
      if (!res.ok) throw new Error(json.error?.message ?? t("admin.updateFailed"));
      await loadSetup();
      setMessage(t("onboarding.saved"));
      goStep("link");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("admin.updateFailed"));
    } finally {
      setSavingHours(false);
    }
  }

  async function copyLink() {
    if (!bookingUrl) return;
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function checklistItem(done: boolean, label: string) {
    return (
      <li className={`flex items-center gap-2 text-sm ${done ? "text-emerald-400" : "text-zinc-400"}`}>
        <span>{done ? "✓" : "○"}</span>
        <span>{label}</span>
      </li>
    );
  }

  if (!ready || loading || !profile) {
    return (
      <section className="flex min-h-full items-center justify-center px-4 py-16">
        <p className="text-sm text-zinc-400">{t("common.loading")}</p>
      </section>
    );
  }

  if (profile.role !== "owner") {
    return null;
  }

  const act = activation;

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-5 px-4 py-5 pb-28">
        <header>
          {mockMode ? (
            <span className="mb-1 inline-block rounded bg-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
              {t("common.prototypeMode")}
            </span>
          ) : null}
          <h1 className="text-xl font-semibold">{t("onboarding.title")}</h1>
          <p className="mt-1 text-sm text-zinc-400">{t("onboarding.subtitle")}</p>
          {act ? (
            <p className="mt-2 text-xs text-zinc-500">
              {t("onboarding.progress").replace("{done}", String(act.completedSteps)).replace("{total}", String(act.totalSteps))}
            </p>
          ) : null}
          <AdminSessionBadge name={profile.displayName || profile.barberName} role={profile.role} />
        </header>

        {!step || step === "ready" ? (
          <ul className="space-y-2 rounded-2xl bg-zinc-900 p-4">
            {checklistItem(true, t("onboarding.stepClaimed"))}
            {checklistItem(act?.profileOk ?? false, t("onboarding.stepProfile"))}
            {checklistItem(act?.teamOk ?? false, t("onboarding.stepTeam"))}
            {checklistItem(act?.hoursOk ?? false, t("onboarding.stepHours"))}
            {checklistItem(act?.hasFirstBooking ?? false, t("onboarding.stepTest"))}
            {checklistItem(act?.ready ?? false, t("onboarding.stepReady"))}
          </ul>
        ) : null}

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

        {step === "profile" ? (
          <section className="rounded-2xl bg-zinc-900 p-4">
            <h2 className="font-semibold">{t("onboarding.stepProfile")}</h2>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              {t("admin.shopName")}
              <input
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
              />
            </label>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              {t("admin.shopPhone")}
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
              />
            </label>
            <label className="mt-3 flex flex-col gap-1 text-sm">
              {t("admin.shopLineUrl")}
              <input
                value={lineUrl}
                onChange={(e) => setLineUrl(e.target.value)}
                className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base outline-none ring-amber-400 focus:ring-2"
              />
            </label>
            <button
              type="button"
              disabled={savingProfile}
              onClick={() => void saveProfile()}
              className="mt-4 min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {t("onboarding.saveAndContinue")}
            </button>
          </section>
        ) : null}

        {step === "team" ? (
          <section className="rounded-2xl bg-zinc-900 p-4">
            <h2 className="font-semibold">{t("onboarding.stepTeam")}</h2>
            <p className="mt-1 text-sm text-zinc-400">{t("onboarding.teamHint")}</p>
            {ownerBarber ? (
              <div className="mt-4 rounded-lg bg-zinc-950 p-3">
                <p className="font-medium">{barberLabel(ownerBarber.name, locale)}</p>
                <p className="text-xs text-zinc-500">{t("onboarding.ownerRole")}</p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{t("onboarding.ownerAcceptingLabel")}</p>
                    <p className="text-xs text-zinc-500">
                      {ownerBookable
                        ? t("onboarding.ownerAcceptingOn")
                        : t("onboarding.ownerAcceptingOff")}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={ownerBookable}
                    disabled={savingOwnerBookable}
                    onClick={() => void toggleOwnerBookable()}
                    className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
                      ownerBookable ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white transition-transform ${
                        ownerBookable ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-400">{t("onboarding.ownerBookableHint")}</p>
                {shouldShowOwnerSlotDuration(ownerBookable) ? (
                  <label className="mt-3 flex flex-col gap-1 text-sm">
                    {t("onboarding.slotDuration")}
                    <span className="text-xs text-zinc-500">{t("onboarding.slotDurationHint")}</span>
                    <select
                      value={ownerBarber.slot_duration_minutes}
                      disabled={savingOwnerDuration}
                      onChange={(e) => void updateOwnerDuration(Number(e.target.value))}
                      className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base"
                    >
                      {ALLOWED_SLOT_DURATIONS.map((d) => (
                        <option key={d} value={d}>
                          {d} {t("common.minutes")}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
              </div>
            ) : null}
            <div className="mt-3 space-y-2">
              {barbers
                .filter((b) => b.role !== "owner")
                .map((b) => (
                  <div key={b.id} className="rounded-lg bg-zinc-950 px-3 py-2 text-sm">
                    <p className="font-medium">{barberLabel(b.name, locale)}</p>
                    <p className="text-xs text-zinc-500">
                      {b.slot_duration_minutes} {t("common.minutes")}
                    </p>
                  </div>
                ))}
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-sm">
                {t("onboarding.barberName")}
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base"
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                {t("onboarding.slotDuration")}
                <span className="text-xs text-zinc-500">{t("onboarding.slotDurationHint")}</span>
                <select
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value))}
                  className="min-h-11 rounded-lg bg-zinc-800 px-3 text-base"
                >
                  {ALLOWED_SLOT_DURATIONS.map((d) => (
                    <option key={d} value={d}>
                      {d} {t("common.minutes")}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                disabled={savingTeam}
                onClick={() => void addBarber()}
                className="min-h-11 rounded-xl border border-zinc-700 text-sm font-medium"
              >
                {t("onboarding.addBarber")}
              </button>
            </div>
            <button
              type="button"
              disabled={!act?.teamOk || savingTeam}
              onClick={() => goStep("hours")}
              className="mt-4 min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {t("onboarding.saveAndContinue")}
            </button>
          </section>
        ) : null}

        {step === "hours" ? (
          <section className="rounded-2xl bg-zinc-900 p-4">
            <h2 className="font-semibold">{t("onboarding.stepHours")}</h2>
            <button
              type="button"
              onClick={applyHoursToAllOpen}
              className="mt-2 text-xs text-amber-400 underline"
            >
              {t("onboarding.copyHoursToAll")}
            </button>
            <div className="mt-3 flex flex-col gap-2">
              {WEEKDAYS.map((day) => {
                const row = hours[day.value];
                return (
                  <div key={day.value} className="rounded-lg bg-zinc-950 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t(day.key)}</span>
                      <label className="flex items-center gap-2 text-xs text-zinc-400">
                        <input
                          type="checkbox"
                          checked={row.closed}
                          onChange={(e) => updateHour(day.value, { closed: e.target.checked })}
                        />
                        {t("admin.shopClosed")}
                      </label>
                    </div>
                    {!row.closed ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="time"
                          value={row.open}
                          onChange={(e) => updateHour(day.value, { open: e.target.value })}
                          className="min-h-10 flex-1 rounded bg-zinc-800 px-2 text-sm"
                        />
                        <input
                          type="time"
                          value={row.close}
                          onChange={(e) => updateHour(day.value, { close: e.target.value })}
                          className="min-h-10 flex-1 rounded bg-zinc-800 px-2 text-sm"
                        />
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              disabled={savingHours}
              onClick={() => void saveHours()}
              className="mt-4 min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {t("onboarding.saveAndContinue")}
            </button>
          </section>
        ) : null}

        {step === "link" ? (
          <section className="rounded-2xl bg-zinc-900 p-4">
            <h2 className="font-semibold">{t("onboarding.bookingLinkTitle")}</h2>
            <p className="mt-1 text-sm text-zinc-400">{t("onboarding.bookingLinkHint")}</p>
            <p className="mt-3 break-all rounded-lg bg-zinc-950 p-3 text-xs text-zinc-300">{bookingUrl}</p>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="mt-3 min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950"
            >
              {copied ? t("onboarding.copied") : t("onboarding.copyLink")}
            </button>
            <div className="mt-4 rounded-lg border border-zinc-800 p-3 text-sm text-zinc-400">
              <p className="font-medium text-zinc-200">{t("onboarding.oaGuideTitle")}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs">
                <li>{t("onboarding.oaStep1")}</li>
                <li>{t("onboarding.oaStep2")}</li>
                <li>{t("onboarding.oaStep3")}</li>
                <li>{t("onboarding.oaStep4")}</li>
                <li>{t("onboarding.oaStep5")}</li>
                <li>{t("onboarding.oaStep6")}</li>
              </ol>
            </div>
            <button
              type="button"
              onClick={() => goStep("test")}
              className="mt-4 min-h-12 w-full rounded-xl border border-zinc-700 font-medium text-zinc-200"
            >
              {t("onboarding.saveAndContinue")}
            </button>
          </section>
        ) : null}

        {step === "test" ? (
          <section className="rounded-2xl bg-zinc-900 p-4">
            <h2 className="font-semibold">{t("onboarding.stepTest")}</h2>
            <p className="mt-1 text-sm text-zinc-400">{t("onboarding.testHint")}</p>
            <Link
              href={shopPath("/")}
              className="mt-4 flex min-h-12 items-center justify-center rounded-xl bg-amber-400 font-semibold text-zinc-950"
            >
              {t("onboarding.tryBooking")}
            </Link>
            <button
              type="button"
              onClick={() => void loadSetup().then(() => goStep(act?.ready ? "ready" : "test"))}
              className="mt-3 min-h-11 w-full rounded-xl border border-zinc-700 text-sm"
            >
              {t("onboarding.refreshProgress")}
            </button>
            {act?.ready ? (
              <button
                type="button"
                onClick={() => goStep("ready")}
                className="mt-3 min-h-12 w-full rounded-xl bg-emerald-600 font-semibold text-white"
              >
                {t("onboarding.viewReady")}
              </button>
            ) : null}
          </section>
        ) : null}

        {step === "ready" || (!step && act?.ready) ? (
          <section className="rounded-2xl bg-zinc-900 p-4 text-center">
            <p className="text-2xl">✓</p>
            <h2 className="mt-2 text-lg font-semibold">{t("onboarding.readyTitle")}</h2>
            <p className="mt-1 text-sm text-zinc-400">{t("onboarding.readyHint")}</p>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="mt-4 min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950"
            >
              {copied ? t("onboarding.copied") : t("onboarding.copyLink")}
            </button>
            <Link
              href={shopPath("/")}
              className="mt-2 flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 text-sm"
            >
              {t("onboarding.openBooking")}
            </Link>
            <Link
              href={shopPath("/admin")}
              className="mt-2 flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 text-sm"
            >
              {t("onboarding.viewBoard")}
            </Link>
          </section>
        ) : null}

        {!step && act && !act.ready ? (
          <button
            type="button"
            onClick={() => goStep(firstIncompleteSetupStep(act))}
            className="min-h-12 w-full rounded-xl bg-amber-400 font-semibold text-zinc-950"
          >
            {t("onboarding.startSetup")}
          </button>
        ) : null}

        {!step && act?.ready ? (
          <Link
            href={shopPath("/admin")}
            className="flex min-h-12 items-center justify-center rounded-xl bg-amber-400 font-semibold text-zinc-950"
          >
            {t("onboarding.viewBoard")}
          </Link>
        ) : null}
      </div>
    </AdminShell>
  );
}

export default function AdminSetupPage() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={
        <section className="flex min-h-full items-center justify-center px-4 py-16">
          <p className="text-sm text-zinc-400">{t("common.loading")}</p>
        </section>
      }
    >
      <SetupContent />
    </Suspense>
  );
}
