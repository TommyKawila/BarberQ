"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BarberAvatar } from "@/components/barber/BarberAvatar";
import { AdminShell } from "@/components/admin/AdminShell";
import { useAdminPageAuth } from "@/lib/admin/use-admin-line-auth";
import { formatBreaksSummary, formatOffDaysSummary } from "@/lib/barber/schedule-summary";
import { fitLogoFile } from "@/lib/image/fit-logo";
import { useI18n } from "@/lib/i18n/locale-provider";
import { ALLOWED_SLOT_DURATIONS } from "@/lib/schedule/validation";
import { ADMIN_NAV_STICKY_BOTTOM_CLASS } from "@/lib/admin/admin-nav-items";
import { useShopSlug } from "@/lib/shop/shop-slug-context";
import { barberLabel, type Barber } from "@/types/booking";

interface ApiError {
  error?: { code?: string; message?: string; count?: number };
}

interface RecurringBreakRow {
  id: string;
  weekday: number;
  startTime: string;
  endTime: string;
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

export default function EditBarberPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const params = useParams();
  const barberId = params.id as string;
  const { ready, profile, authHeaders } = useAdminPageAuth();
  const { shopPath } = useShopSlug();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [barber, setBarber] = useState<Barber | null>(null);
  const [breaks, setBreaks] = useState<RecurringBreakRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const [name, setName] = useState("");
  const [lineId, setLineId] = useState("");
  const [isBookable, setIsBookable] = useState(true);
  const [slotDuration, setSlotDuration] = useState(30);
  const [showProfileInBooking, setShowProfileInBooking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [barberRes, breaksRes] = await Promise.all([
        fetch(`/api/barbers/${barberId}`, { headers: authHeaders }),
        fetch(`/api/barbers/${barberId}/breaks`, { headers: authHeaders }),
      ]);
      const barberJson = (await barberRes.json()) as { barber?: Barber } & ApiError;
      const breaksJson = (await breaksRes.json()) as { breaks?: RecurringBreakRow[] } & ApiError;
      if (!barberRes.ok) {
        setError(barberJson.error?.message ?? t("admin.loadFailed"));
        return;
      }
      const b = barberJson.barber ?? null;
      setBarber(b);
      setBreaks(breaksJson.breaks ?? []);
      if (b) {
        setName(b.name);
        setLineId(b.line_id ?? "");
        setIsBookable(b.is_bookable !== false);
        setSlotDuration(b.slot_duration_minutes);
        setShowProfileInBooking(b.show_profile_in_booking === true);
      }
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setLoading(false);
    }
  }, [authHeaders, barberId, t]);

  useEffect(() => {
    if (!ready || !profile || profile.role !== "owner") return;
    void load();
  }, [load, profile, ready]);

  async function unlinkLine() {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/barbers/${barberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({ lineId: null }),
      });
      const json = (await res.json()) as { barber?: Barber } & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setBarber(json.barber ?? null);
      setLineId("");
      setMessage(t("admin.barberSaved"));
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/barbers/${barberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          name: trimmed,
          lineId: lineId.trim() || null,
          isBookable,
          slotDuration: isBookable ? slotDuration : undefined,
          showProfileInBooking,
        }),
      });
      const json = (await res.json()) as { barber?: Barber } & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setBarber(json.barber ?? null);
      setMessage(t("admin.barberSaved"));
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setSaving(false);
    }
  }

  async function uploadPhoto(file: File) {
    setUploading(true);
    setError(null);
    try {
      const dataUrl = await fitLogoFile(file);
      const blob = await dataUrlToBlob(dataUrl);
      const form = new FormData();
      form.append("file", blob, "profile.png");
      const res = await fetch(`/api/barbers/${barberId}/profile-image`, {
        method: "POST",
        headers: authHeaders,
        body: form,
      });
      const json = (await res.json()) as { barber?: Barber } & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setBarber(json.barber ?? null);
      setMessage(t("admin.barberSaved"));
    } catch {
      setError(t("admin.updateFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function deletePhoto() {
    setUploading(true);
    setError(null);
    try {
      const res = await fetch(`/api/barbers/${barberId}/profile-image`, {
        method: "DELETE",
        headers: authHeaders,
      });
      const json = (await res.json()) as { barber?: Barber } & ApiError;
      if (!res.ok) {
        setError(json.error?.message ?? t("admin.updateFailed"));
        return;
      }
      setBarber(json.barber ?? null);
      setMessage(t("admin.barberSaved"));
    } catch {
      setError(t("admin.updateFailed"));
    } finally {
      setUploading(false);
    }
  }

  async function removeFromShop() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/barbers/${barberId}/deactivate`, {
        method: "POST",
        headers: authHeaders,
      });
      const json = (await res.json()) as ApiError;
      if (!res.ok) {
        if (json.error?.code === "HAS_FUTURE_BOOKINGS" && barber) {
          setError(
            t("admin.removeFromShopFutureBookings")
              .replace("{name}", barberLabel(barber.name, locale))
              .replace("{count}", String(json.error.count ?? 0)),
          );
        } else {
          setError(json.error?.message ?? t("admin.updateFailed"));
        }
        return;
      }
      router.push(shopPath("/admin/staff"));
    } catch {
      setError(t("admin.networkError"));
    } finally {
      setSaving(false);
      setConfirmRemove(false);
    }
  }

  if (!ready || !profile) {
    return <p className="p-4 text-sm text-zinc-400">{t("common.loading")}</p>;
  }

  if (profile.role !== "owner") {
    return (
      <section className="px-4 py-10">
        <p className="text-sm text-red-400">{t("admin.forbiddenOwnerOnly")}</p>
      </section>
    );
  }

  if (loading || !barber) {
    return <p className="p-4 text-sm text-zinc-400">{t("common.loading")}</p>;
  }

  const displayName = barberLabel(barber.name, locale);
  const isOwnerBarber = barber.role === "owner";

  return (
    <AdminShell role={profile.role}>
      <div className="flex flex-col gap-5 px-4 py-5 pb-28">
        <Link href={shopPath("/admin/staff")} className="text-sm text-amber-400">
          ← {t("admin.backToBoard")}
        </Link>

        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold">{t("admin.editBarberTitle")}</h1>
            <p className="mt-1 text-sm text-zinc-400">
              {t("admin.editBarberSubtitle").replace("{name}", displayName)}
            </p>
            <p className="mt-2 text-lg font-semibold">{displayName}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="rounded-full bg-zinc-800 px-2.5 py-0.5 text-xs text-zinc-300">
                {isBookable ? t("admin.barberBookable") : t("admin.barberNotBookable")}
              </span>
              {isOwnerBarber ? (
                <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-300">
                  {t("admin.ownerBadge")}
                </span>
              ) : null}
            </div>
          </div>
          <BarberAvatar name={barber.name} imageUrl={barber.profile_image_url} size="lg" />
        </header>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-400">{message}</p> : null}

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-semibold">{t("admin.barberInfoSection")}</h2>
          <label className="mt-3 flex flex-col gap-1 text-sm">
            {t("admin.barberName")}
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3"
            />
          </label>
          <p className="mt-1 text-xs text-zinc-500">{t("admin.barberNameHint")}</p>
          <label className="mt-4 flex flex-col gap-1 text-sm">
            {t("admin.barberRoleLabel")}
            <input
              readOnly
              value={isOwnerBarber ? t("admin.ownerBadge") : t("admin.roleBarber")}
              className="min-h-11 rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-zinc-400"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-semibold">{t("admin.profileSection")}</h2>
          <p className="mt-1 text-sm text-zinc-400">{t("admin.profileSectionHint")}</p>
          <div className="mt-4 flex items-center gap-4">
            <BarberAvatar name={barber.name} imageUrl={barber.profile_image_url} size="lg" />
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadPhoto(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg bg-zinc-800 px-3 py-2 text-sm text-zinc-200 disabled:opacity-50"
              >
                {t("admin.uploadProfilePhoto")}
              </button>
              {barber.profile_image_url ? (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={() => void deletePhoto()}
                  className="rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 disabled:opacity-50"
                >
                  {t("admin.deleteProfilePhoto")}
                </button>
              ) : null}
            </div>
          </div>
          <p className="mt-3 text-xs text-zinc-500">{t("admin.profilePhotoHint")}</p>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={showProfileInBooking}
              onChange={(e) => setShowProfileInBooking(e.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="font-medium">{t("admin.showProfileInBooking")}</span>
              <p className="mt-1 text-xs text-zinc-500">{t("admin.showProfileInBookingHint")}</p>
            </span>
          </label>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-semibold">{t("admin.queueSection")}</h2>
          <p className="mt-1 text-sm text-zinc-400">{t("admin.queueSectionHint")}</p>
          <label className="mt-4 flex items-center justify-between gap-3 text-sm">
            <span>{t("admin.openQueueToggle")}</span>
            <input
              type="checkbox"
              checked={isBookable}
              onChange={(e) => setIsBookable(e.target.checked)}
            />
          </label>
          {isBookable ? (
            <label className="mt-4 flex flex-col gap-1 text-sm">
              {t("admin.slotDuration")}
              <p className="text-xs text-zinc-500">{t("admin.slotDurationHint")}</p>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="mt-1 min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3"
              >
                {ALLOWED_SLOT_DURATIONS.map((m) => (
                  <option key={m} value={m}>{m} {t("common.minutes")}</option>
                ))}
              </select>
            </label>
          ) : null}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-semibold">{t("admin.lineAdminSection")}</h2>
          <p className="mt-1 text-sm text-zinc-400">{t("admin.lineAdminHint")}</p>
          <p className="mt-3 text-sm">
            {barber.line_id ? t("admin.barberLineLinked") : t("admin.barberLineNotLinked")}
          </p>
          {!barber.line_id ? (
            <>
              <label className="mt-3 flex flex-col gap-1 text-sm">
                LINE User ID
                <input
                  value={lineId}
                  onChange={(e) => setLineId(e.target.value)}
                  className="min-h-11 rounded-lg border border-zinc-700 bg-zinc-950 px-3"
                />
              </label>
              <p className="mt-1 text-xs text-zinc-500">{t("admin.barberLineHint")}</p>
            </>
          ) : (
            <>
              <p className="mt-2 text-xs text-zinc-500">{t("admin.unlinkLineWarning")}</p>
              <button
                type="button"
                disabled={saving}
                onClick={() => void unlinkLine()}
                className="mt-3 rounded-lg border border-zinc-700 px-3 py-2 text-sm text-zinc-300 disabled:opacity-50"
              >
                {t("admin.unlinkLine")}
              </button>
            </>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
          <h2 className="font-semibold">{t("admin.scheduleSection")}</h2>
          <dl className="mt-3 space-y-2 text-sm text-zinc-400">
            <div>
              <dt className="text-zinc-500">{t("admin.scheduleOffDaysLabel")}</dt>
              <dd>{formatOffDaysSummary(barber.off_days, t)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("admin.scheduleBreaksLabel")}</dt>
              <dd>{formatBreaksSummary(breaks, t)}</dd>
            </div>
            <div>
              <dt className="text-zinc-500">{t("admin.scheduleDurationLabel")}</dt>
              <dd>{barber.slot_duration_minutes} {t("common.minutes")}</dd>
            </div>
          </dl>
          <Link
            href={shopPath(`/admin/my-schedule?barber=${barber.id}`)}
            className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-zinc-700 text-sm font-medium text-zinc-200"
          >
            {t("admin.manageScheduleFor").replace("{name}", displayName)}
          </Link>
        </section>

        {!isOwnerBarber ? (
          <section className="rounded-2xl border border-red-900/40 bg-zinc-900 p-4">
            <h2 className="font-semibold text-red-300">{t("admin.manageBarberSection")}</h2>
            <p className="mt-1 text-sm text-zinc-400">{t("admin.removeFromShopHint")}</p>
            {confirmRemove ? (
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void removeFromShop()}
                  className="min-h-10 rounded-lg bg-red-600/90 px-4 text-sm font-medium text-white disabled:opacity-50"
                >
                  {t("admin.removeFromShop")}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmRemove(false)}
                  className="min-h-10 rounded-lg border border-zinc-700 px-4 text-sm text-zinc-300"
                >
                  {t("common.cancel")}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemove(true)}
                className="mt-4 rounded-lg border border-red-800/60 px-4 py-2 text-sm text-red-300"
              >
                {t("admin.removeFromShop")}
              </button>
            )}
          </section>
        ) : null}

        <div className={`fixed inset-x-0 z-10 border-t border-zinc-800 bg-zinc-950/95 px-4 py-3 backdrop-blur ${ADMIN_NAV_STICKY_BOTTOM_CLASS}`}>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void save()}
              className="min-h-12 flex-1 rounded-xl bg-amber-400 font-semibold text-zinc-950 disabled:opacity-50"
            >
              {t("admin.saveChanges")}
            </button>
            <button
              type="button"
              onClick={() => router.push(shopPath("/admin/staff"))}
              className="min-h-12 rounded-xl border border-zinc-700 px-4 text-sm text-zinc-300"
            >
              {t("common.cancel")}
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
